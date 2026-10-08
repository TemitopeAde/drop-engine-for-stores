import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { appInstances } from "@wix/app-management";
import { z } from "zod";
import { DomainError } from "../domain/drop";
import {
  CONSENT_VERSION,
  entryId,
  entrySchema,
  FREE_WAITLIST_CAP,
  randomToken,
  sha256Hex,
  SIGNUP_RATE_LIMIT,
  toView,
  WAITLIST_PAGE_SIZE,
  type Entry,
} from "../domain/waitlist";
import type { Tenant } from "./storage";

export const WAITLIST = "@admin14744/drop-engine-for-stores/waitlist_entries";
export const EVENTS = "@admin14744/drop-engine-for-stores/processed_events";
// Callers verify the tenant first; every query below is filtered by it.
const query = auth.elevate(items.query);
const insert = auth.elevate(items.insert);
const update = auth.elevate(items.update);
const remove = auth.elevate(items.remove);
const read = { consistentRead: true };

// Server-side entitlement; unknown plans are treated as Free (cap on, export off).
export async function isPro() {
  try {
    const { instance } = await auth.elevate(appInstances.getAppInstance)();
    return instance?.isFree === false;
  } catch {
    return false;
  }
}

const counterSchema = z
  .object({
    _id: z.string(),
    instanceId: z.string(),
    revision: z.number(),
    count: z.number(),
    windowStart: z.number().optional(),
  })
  .passthrough();
type Counter = { count: number; windowStart?: number };
// Persistent compare-and-set counter: concurrent callers retry on the revision fence.
async function adjust(
  id: string,
  scope: Tenant,
  eventType: string,
  next: (current: Counter | null) => Counter | null,
) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const found = await query(EVENTS).eq("_id", id).limit(1).find(read);
    const current = found.items.length
      ? counterSchema.parse(found.items[0])
      : null;
    if (current && current.instanceId !== scope.instanceId)
      throw new DomainError("forbidden", 403);
    const value = next(current);
    if (!value) return false;
    const record = {
      _id: id,
      instanceId: scope.instanceId,
      eventId: id,
      eventType,
      processedAt: new Date(),
      ...value,
    };
    try {
      if (!current) await insert(EVENTS, { ...record, revision: 0 });
      else
        await update(
          EVENTS,
          { ...record, revision: current.revision + 1 },
          {
            condition: items
              .filter()
              .eq("revision", current.revision)
              .eq("instanceId", scope.instanceId),
          },
        );
      return true;
    } catch {
      // Lost the race (duplicate insert or stale revision): re-read and retry.
    }
  }
  throw new DomainError("unavailable", 503);
}

export async function consumeSignupAttempt(
  scope: Tenant,
  subjectId: string,
  now: number,
) {
  const key = await sha256Hex(`${scope.instanceId}\n${subjectId}`);
  return adjust(`waitlist-rate:${key}`, scope, "WAITLIST_RATE", (current) => {
    if (
      !current?.windowStart ||
      now - current.windowStart >= SIGNUP_RATE_LIMIT.windowMs
    )
      return { count: 1, windowStart: now };
    if (current.count >= SIGNUP_RATE_LIMIT.attempts) return null;
    return { count: current.count + 1, windowStart: current.windowStart };
  });
}

const quotaId = (scope: Tenant) => `waitlist-quota:${scope.instanceId}`;
export const countEntries = (scope: Tenant, dropId?: string) => {
  const base = query(WAITLIST).eq("instanceId", scope.instanceId);
  return (dropId ? base.eq("dropId", dropId) : base).count(read);
};
// Claim one Free-plan slot. Persisted entries also bound the counter, so entries
// created while on Pro still count after a downgrade.
async function reserveSlot(scope: Tenant) {
  const stored = await countEntries(scope);
  return adjust(quotaId(scope), scope, "WAITLIST_QUOTA", (current) => {
    const used = Math.max(current?.count ?? 0, stored);
    return used >= FREE_WAITLIST_CAP ? null : { count: used + 1 };
  });
}
const releaseSlot = (scope: Tenant) =>
  adjust(quotaId(scope), scope, "WAITLIST_QUOTA", (current) => ({
    count: Math.max(0, (current?.count ?? 0) - 1),
  }));

async function getEntry(scope: Tenant, dropId: string, id: string) {
  const found = await query(WAITLIST).eq("_id", id).limit(1).find(read);
  if (!found.items.length) return null;
  const entry = entrySchema.parse(found.items[0]);
  if (
    entry.instanceId !== scope.instanceId ||
    entry.siteId !== scope.siteId ||
    entry.dropId !== dropId
  )
    return null;
  return entry;
}
function consent(consentText: string, now: number) {
  return {
    version: CONSENT_VERSION,
    text: consentText,
    at: now,
    source: "product-page",
  };
}

export type JoinResult =
  | { status: "joined"; id: string; token: string }
  | { status: "already" };
export async function join(
  scope: Tenant,
  dropId: string,
  email: string,
  consentText: string,
  now: number,
): Promise<JoinResult> {
  const id = await entryId(scope.instanceId, dropId, email);
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const existing = await getEntry(scope, dropId, id);
  // Never hand out a leave token for an address someone else already subscribed.
  if (existing?.status === "SUBSCRIBED") return { status: "already" };
  if (existing) {
    const { unsubscribedAt: _, ...rest } = existing;
    await update(WAITLIST, {
      ...rest,
      status: "SUBSCRIBED",
      tokenHash,
      consent: consent(consentText, now),
    });
    return { status: "joined", id, token };
  }
  const pro = await isPro();
  if (!pro && !(await reserveSlot(scope)))
    throw new DomainError("waitlistFull", 409);
  const entry: Entry = {
    _id: id,
    ...scope,
    dropId,
    email,
    status: "SUBSCRIBED",
    joinedAt: now,
    tokenHash,
    consent: consent(consentText, now),
  };
  try {
    await insert(WAITLIST, entry);
    return { status: "joined", id, token };
  } catch (error) {
    if (!pro) await releaseSlot(scope).catch(() => undefined);
    // A simultaneous identical signup won the deterministic ID.
    if (await getEntry(scope, dropId, id)) return { status: "already" };
    throw error;
  }
}

export async function leave(
  scope: Tenant,
  dropId: string,
  id: string,
  token: string,
  now: number,
) {
  const entry = await getEntry(scope, dropId, id);
  if (!entry || entry.tokenHash !== (await sha256Hex(token)))
    throw new DomainError("forbidden", 403);
  if (entry.status !== "UNSUBSCRIBED")
    await update(WAITLIST, {
      ...entry,
      status: "UNSUBSCRIBED",
      unsubscribedAt: now,
    });
}

export async function unsubscribe(
  scope: Tenant,
  dropId: string,
  id: string,
  now: number,
) {
  const entry = await getEntry(scope, dropId, id);
  if (!entry) throw new DomainError("conflict", 409);
  if (entry.status !== "UNSUBSCRIBED")
    await update(WAITLIST, {
      ...entry,
      status: "UNSUBSCRIBED",
      unsubscribedAt: now,
    });
}

// Deletion frees Free-plan capacity; unsubscribing alone does not.
export async function removeEntry(scope: Tenant, dropId: string, id: string) {
  const entry = await getEntry(scope, dropId, id);
  if (!entry) throw new DomainError("conflict", 409);
  await remove(WAITLIST, id);
  await releaseSlot(scope).catch(() => undefined);
}

export async function listEntries(scope: Tenant, dropId: string, page: number) {
  const base = () =>
    query(WAITLIST)
      .eq("instanceId", scope.instanceId)
      .eq("siteId", scope.siteId)
      .eq("dropId", dropId);
  const [result, total, subscribed, used, pro] = await Promise.all([
    base()
      .descending("joinedAt")
      .skip(page * WAITLIST_PAGE_SIZE)
      .limit(WAITLIST_PAGE_SIZE)
      .find(read),
    base().count(read),
    base().eq("status", "SUBSCRIBED").count(read),
    countEntries(scope),
    isPro(),
  ]);
  return {
    entries: result.items.map((item) => toView(entrySchema.parse(item))),
    total,
    subscribed,
    page,
    hasNext: (page + 1) * WAITLIST_PAGE_SIZE < total,
    pro,
    used,
    cap: pro ? null : FREE_WAITLIST_CAP,
  };
}

export async function allEntries(scope: Tenant, dropId: string) {
  let result = await query(WAITLIST)
    .eq("instanceId", scope.instanceId)
    .eq("siteId", scope.siteId)
    .eq("dropId", dropId)
    .ascending("joinedAt")
    .limit(1000)
    .find(read);
  const entries = result.items.map((item) => entrySchema.parse(item));
  while (result.hasNext()) {
    result = await result.next();
    entries.push(...result.items.map((item) => entrySchema.parse(item)));
  }
  return entries;
}
