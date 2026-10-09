import { z } from "zod";
import type { Drop } from "./drop";
import { MAX_SUBJECT_CHARS, messageSchema } from "./message";

export const WAITLIST_PAGE_SIZE = 50;
// Recipients emailed per request; the dashboard loops so no request runs long.
export const EMAIL_BATCH_SIZE = 25;
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
    // The product page the visitor signed up from; the server checks it belongs to the drop.
    productId: z.string().uuid().optional(),
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
export const entryCommandSchema = z
  .object({
    action: z.enum(["unsubscribe", "remove"]),
    dropId: z.string().uuid(),
    id: hex64,
  })
  .strict();
// "all" pages through subscribers ordered by (joinedAt, id); `after` is the last one sent.
export const cursorSchema = z
  .object({ joinedAt: z.number().int().min(0), id: hex64 })
  .strict();
export type Cursor = z.infer<typeof cursorSchema>;
export const recipientsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("all"), after: cursorSchema.optional() }).strict(),
  z
    .object({
      kind: z.literal("selected"),
      ids: z.array(hex64).min(1).max(EMAIL_BATCH_SIZE),
    })
    .strict(),
]);
export type Recipients = z.infer<typeof recipientsSchema>;
export const emailCommandSchema = z
  .object({
    action: z.literal("email"),
    dropId: z.string().uuid(),
    // Fixed for one send, so retrying a batch can't email anyone twice.
    broadcastId: z.string().uuid(),
    subject: z.string().trim().min(1).max(MAX_SUBJECT_CHARS),
    message: messageSchema,
    recipients: recipientsSchema,
  })
  .strict();
export type EmailCommand = z.infer<typeof emailCommandSchema>;
export const adminCommandSchema = z.union([
  entryCommandSchema,
  emailCommandSchema,
]);
export const emailResultSchema = z.object({
  sent: z.number(),
  failed: z.number(),
  // Selected entries that were removed or unsubscribed before the send.
  skipped: z.number(),
  next: cursorSchema.nullable(),
});
export type EmailResult = z.infer<typeof emailResultSchema>;

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
