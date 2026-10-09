import type { APIRoute } from "astro";
import { z } from "zod";
import { DomainError } from "../../domain/drop";
import {
  adminCommandSchema,
  toCsv,
  type EmailResult,
} from "../../domain/waitlist";
import { readInstallation, tenant } from "../../server/storage";
import { handle, readBody } from "../../server/http";
import { currentPlan } from "../../server/plan";
import {
  allEntries,
  listEntries,
  recipientBatch,
  removeEntry,
  unsubscribe,
} from "../../server/waitlist";
import { sendBroadcast } from "../../server/email";
import type { Tenant } from "../../server/storage";

async function ownedDrop(scope: Tenant, dropId: string) {
  const installation = await readInstallation(scope);
  const drop = installation?.state.drops.find((item) => item.id === dropId);
  if (!drop) throw new DomainError("conflict", 409);
  return drop;
}
const iso = (value?: number) =>
  value === undefined ? "" : new Date(value).toISOString();

export const GET: APIRoute = ({ url }) =>
  handle(async () => {
    const scope = await tenant(true);
    const dropId = z.string().uuid().parse(url.searchParams.get("dropId"));
    const drop = await ownedDrop(scope, dropId);
    if (url.searchParams.get("format") !== "csv") {
      const page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10_000)
        .parse(url.searchParams.get("page") || 0);
      return listEntries(scope, dropId, page);
    }
    if (!(await currentPlan(scope)).limits.csvExport)
      throw new DomainError("proRequired", 403);
    const rows = (await allEntries(scope, dropId)).map((entry) => [
      entry.email,
      entry.status,
      iso(entry.joinedAt),
      iso(entry.unsubscribedAt),
      entry.consent.version,
      iso(entry.consent.at),
    ]);
    const csv = toCsv([
      [
        "email",
        "status",
        "joined_at",
        "unsubscribed_at",
        "consent_version",
        "consent_at",
      ],
      ...rows,
    ]);
    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="waitlist-${drop.id}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });

export const POST: APIRoute = ({ request }) =>
  handle(async () => {
    const scope = await tenant(true);
    const command = adminCommandSchema.parse(await readBody(request));
    const drop = await ownedDrop(scope, command.dropId);
    if (command.action === "email") {
      const { entries, skipped, next } = await recipientBatch(
        scope,
        drop.id,
        command.recipients,
      );
      const { sent, failed } = await sendBroadcast({
        scope,
        drop,
        broadcastId: command.broadcastId,
        subject: command.subject,
        message: command.message,
        entries,
      });
      return { sent, failed, skipped, next } satisfies EmailResult;
    }
    if (command.action === "remove")
      await removeEntry(scope, command.dropId, command.id);
    else await unsubscribe(scope, command.dropId, command.id, Date.now());
    return { ok: true };
  });
