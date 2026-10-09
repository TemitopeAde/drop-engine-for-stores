import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import { MAX_DROP_STATE_BYTES, MAX_PRODUCTS_PER_DROP } from "./limits";

export const dropInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  productIds: z
    .array(z.string().uuid())
    .min(1)
    .max(MAX_PRODUCTS_PER_DROP)
    .refine((ids) => new Set(ids).size === ids.length),
  localStart: z.string().min(16).max(25),
  localEnd: z.string().min(16).max(25),
  timeZone: z.string().min(1).max(100),
  endBehavior: z.enum(["RESTORE", "BLOCK"]),
  // Optional so drops stored before the waitlist existed keep parsing; absent means on.
  waitlist: z.boolean().optional(),
});
export type DropInput = z.infer<typeof dropInputSchema>;
export const dropSchema = dropInputSchema.extend({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  startsAt: z.number().int(),
  endsAt: z.number().int(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]),
  updatedAt: z.number().int(),
});
export type Drop = z.infer<typeof dropSchema>;
export const phaseSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "ENDED",
  "CANCELLED",
  "ARCHIVED",
]);
export type Phase = z.infer<typeof phaseSchema>;
// Dashboard list filters; an empty status means every phase.
export const dropFilterSchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: phaseSchema.optional(),
});
export type DropFilter = z.infer<typeof dropFilterSchema>;
export class DomainError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function schedule(input: DropInput, previous?: Drop) {
  try {
    const convert = (local: string) =>
      Temporal.PlainDateTime.from(local).toZonedDateTime(input.timeZone, {
        disambiguation: "reject",
      }).epochMilliseconds;
    // Retain exact instants for unchanged fields, including repeated DST hours.
    const sameZone = previous?.timeZone === input.timeZone;
    const startsAt =
        sameZone && previous?.localStart === input.localStart
          ? previous.startsAt
          : convert(input.localStart),
      endsAt =
        sameZone && previous?.localEnd === input.localEnd
          ? previous.endsAt
          : convert(input.localEnd);
    if (endsAt <= startsAt) throw new Error("range");
    return { startsAt, endsAt };
  } catch {
    throw new DomainError("invalidSchedule");
  }
}
export function phase(drop: Drop, now: number): Phase {
  if (drop.status !== "PUBLISHED") return drop.status;
  return now < drop.startsAt
    ? "SCHEDULED"
    : now < drop.endsAt
      ? "LIVE"
      : "ENDED";
}
export function startDrop(drop: Drop, now: number): Drop {
  if (phase(drop, now) !== "SCHEDULED")
    throw new DomainError("startUnavailable", 409);
  const localStart = Temporal.Instant.fromEpochMilliseconds(now)
    .toZonedDateTimeISO(drop.timeZone)
    .toPlainDateTime()
    .toString({ smallestUnit: "millisecond" });
  return {
    ...drop,
    startsAt: now,
    localStart,
    version: drop.version + 1,
    updatedAt: now,
  };
}
export function controlsPurchasing(drop: Drop, now: number) {
  return (
    drop.status === "PUBLISHED" &&
    (now < drop.endsAt || drop.endBehavior === "BLOCK")
  );
}
export function blocked(drop: Drop, now: number) {
  return (
    controlsPurchasing(drop, now) && (now < drop.startsAt || now >= drop.endsAt)
  );
}
// A product may belong to only one drop that is a draft or still gates checkout.
export function holdsProducts(drop: Drop, now: number) {
  return drop.status === "DRAFT" || controlsPurchasing(drop, now);
}
export function heldProductIds(
  drops: Drop[],
  exceptId: string | undefined,
  now: number,
) {
  return new Set(
    drops
      .filter((drop) => drop.id !== exceptId && holdsProducts(drop, now))
      .flatMap((drop) => drop.productIds),
  );
}
export function assertPublishable(endsAt: number, now: number) {
  if (endsAt <= now) throw new DomainError("expiredSchedule");
}
// maxActive is the plan's limit on drops that gate checkout at once; null is unlimited.
export function replaceDrop(
  drops: Drop[],
  next: Drop,
  now: number,
  maxActive: number | null = 1,
) {
  const others = drops.filter((drop) => drop.id !== next.id);
  if (controlsPurchasing(next, now) && maxActive !== null) {
    const active = others.filter((drop) => controlsPurchasing(drop, now));
    if (active.length >= maxActive) throw new DomainError("activeLimit", 409);
  }
  if (holdsProducts(next, now)) {
    const held = heldProductIds(others, undefined, now);
    if (next.productIds.some((id) => held.has(id)))
      throw new DomainError("productInUse", 409);
  }
  const result = [...others, next];
  // Bound the canonical item below Wix Data's 500 KB limit.
  if (
    result.length > 100 ||
    new TextEncoder().encode(JSON.stringify(result)).length >
      MAX_DROP_STATE_BYTES
  )
    throw new DomainError("storageLimit", 409);
  return result;
}
export function filterDrops(drops: Drop[], filter: DropFilter, now: number) {
  const search = filter.search.toLocaleLowerCase();
  return drops.filter(
    (drop) =>
      drop.name.toLocaleLowerCase().includes(search) &&
      (!filter.status || phase(drop, now) === filter.status),
  );
}
