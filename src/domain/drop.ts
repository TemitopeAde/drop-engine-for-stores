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
export type Phase =
  "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" | "ARCHIVED";
export class DomainError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function schedule(input: DropInput) {
  try {
    const convert = (local: string) =>
      Temporal.PlainDateTime.from(local).toZonedDateTime(input.timeZone, {
        disambiguation: "reject",
      }).epochMilliseconds;
    const startsAt = convert(input.localStart),
      endsAt = convert(input.localEnd);
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
export function assertPublishable(endsAt: number, now: number) {
  if (endsAt <= now) throw new DomainError("expiredSchedule");
}
export function replaceDrop(drops: Drop[], next: Drop, now: number) {
  const others = drops.filter((drop) => drop.id !== next.id);
  if (controlsPurchasing(next, now)) {
    if (others.some((drop) => controlsPurchasing(drop, now)))
      throw new DomainError("activeLimit", 409);
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
