import { z } from "zod";
import { blocked, controlsPurchasing, phase, type Drop } from "./drop";
import { acceptsSignups } from "./waitlist";
export const projectionSchema = z.object({
  serverNow: z.number(),
  drop: z
    .object({
      id: z.string(),
      name: z.string(),
      phase: z.enum(["SCHEDULED", "LIVE", "ENDED"]),
      startsAt: z.number(),
      endsAt: z.number(),
      waitlist: z.boolean().default(false),
    })
    .nullable(),
});
export type Projection = z.infer<typeof projectionSchema>;
export function productLaunch(drops: Drop[], productId: string, now: number) {
  const candidates = drops.filter(
    (drop) =>
      drop.status === "PUBLISHED" && drop.productIds.includes(productId),
  );
  return (
    candidates.find((drop) => controlsPurchasing(drop, now)) ||
    candidates.sort((a, b) => b.updatedAt - a.updatedAt)[0]
  );
}
export function projectDrop(drop: Drop, now: number) {
  return {
    id: drop.id,
    name: drop.name,
    phase: phase(drop, now),
    startsAt: drop.startsAt,
    endsAt: drop.endsAt,
    blocked: blocked(drop, now),
    waitlist: acceptsSignups(drop, now),
  };
}
