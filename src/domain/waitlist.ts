import { z } from "zod";
import type { Drop } from "./drop";

// Free plan: retained entries per installation across all drops (architecture decision).
export const FREE_WAITLIST_CAP = 200;
export const WAITLIST_PAGE_SIZE = 50;
// Persistent per-visitor signup attempts.
export const SIGNUP_RATE_LIMIT = { attempts: 10, windowMs: 60 * 60 * 1000 };
// Submissions faster than this after the form renders are treated as automated.
export const MIN_FILL_MS = 1500;
// Bump whenever the consent wording in locales changes.
export const CONSENT_VERSION = "2026-10-08";

// Trim and case-fold only; no provider-specific dot/plus rewriting.
export const normalizeEmail = (value: string) =>
  value.normalize("NFC").trim().toLowerCase();
export const emailSchema = z
  .string()
  .max(320)
  .transform(normalizeEmail)
  .pipe(z.email().max(254));

const hex64 = z.string().regex(/^[0-9a-f]{64}$/);
export const joinSchema = z
  .object({
    action: z.literal("join"),
    dropId: z.string().uuid(),
    email: emailSchema,
    consent: z.literal(true),
    // Honeypot: hidden from people, filled by naive bots.
    website: z.string().max(500).optional(),
    elapsedMs: z.number().int().min(0),
  })
  .strict();
export const leaveSchema = z
  .object({
    action: z.literal("leave"),
    dropId: z.string().uuid(),
    id: hex64,
    token: hex64,
  })
  .strict();
export const storefrontCommandSchema = z.discriminatedUnion("action", [
  joinSchema,
  leaveSchema,
]);
export const adminCommandSchema = z
  .object({
    action: z.enum(["unsubscribe", "remove"]),
    dropId: z.string().uuid(),
    id: hex64,
  })
  .strict();

export const entryStatusSchema = z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]);
export const entrySchema = z
  .object({
    _id: hex64,
    instanceId: z.string(),
    siteId: z.string(),
    dropId: z.string(),
    email: z.string(),
    status: entryStatusSchema,
    joinedAt: z.number(),
    unsubscribedAt: z.number().optional(),
    tokenHash: hex64,
    consent: z.object({
      version: z.string(),
      text: z.string(),
      at: z.number(),
      source: z.string(),
    }),
  })
  .passthrough();
export type Entry = z.infer<typeof entrySchema>;

// What the merchant dashboard receives; never sent to the storefront.
export const entryViewSchema = z.object({
  id: hex64,
  email: z.string(),
  status: entryStatusSchema,
  joinedAt: z.number(),
  unsubscribedAt: z.number().optional(),
});
export type EntryView = z.infer<typeof entryViewSchema>;
export const toView = (entry: Entry): EntryView => ({
  id: entry._id,
  email: entry.email,
  status: entry.status,
  joinedAt: entry.joinedAt,
  unsubscribedAt: entry.unsubscribedAt,
});

export const waitlistEnabled = (drop: Drop) => drop.waitlist !== false;
// Signups are accepted only while a published drop is waiting to open.
export const acceptsSignups = (drop: Drop, now: number) =>
  drop.status === "PUBLISHED" && waitlistEnabled(drop) && now < drop.startsAt;

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
// Deterministic ID: concurrent identical signups collide on insert instead of duplicating.
export const entryId = (instanceId: string, dropId: string, email: string) =>
  sha256Hex(`waitlist\n${instanceId}\n${dropId}\n${normalizeEmail(email)}`);
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Quote every cell and neutralise spreadsheet formula prefixes.
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export const toCsv = (rows: string[][]) =>
  rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
