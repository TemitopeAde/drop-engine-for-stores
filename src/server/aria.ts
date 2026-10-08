import { z } from "zod";
import { blocked, DomainError } from "../domain/drop";
import { productLaunch, projectDrop } from "../domain/projection";
import { readForValidation } from "./storage";
const listSchema = z
  .object({
    offset: z.number().int().min(0).max(100).default(0),
    limit: z.number().int().min(1).max(20).default(20),
  })
  .strict();
const productSchema = z.object({ productId: z.string().uuid() }).strict();
const contextSchema = z.object({
  instanceId: z.string().uuid(),
  identity: z.object({ wixUserId: z.string().uuid() }),
});
export async function runAriaTool(
  methodName: string | undefined,
  payload: unknown,
  metadata: unknown,
) {
  // Wix authenticates the registered SPI. Never accept a tenant ID in tool payloads.
  // Expose published storefront data only; delegated mutation authorization is a separate contract.
  const context = contextSchema.parse(metadata);
  if (
    methodName !== "list-published-drops" &&
    methodName !== "get-product-launch"
  )
    throw new DomainError("unknownTool");
  const input =
    methodName === "list-published-drops"
      ? listSchema.parse(payload || {})
      : productSchema.parse(payload);
  const installation = await readForValidation(context.instanceId);
  const drops = installation?.state.drops || [];
  const now = Date.now();
  if ("productId" in input) {
    const drop = productLaunch(drops, input.productId, now);
    return {
      serverNow: now,
      blocked: !!drop && blocked(drop, now),
      drop: drop ? projectDrop(drop, now) : null,
    };
  }
  const published = drops
    .filter((drop) => drop.status === "PUBLISHED")
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return {
    serverNow: now,
    drops: published
      .slice(input.offset, input.offset + input.limit)
      .map((drop) => projectDrop(drop, now)),
    nextOffset:
      input.offset + input.limit < published.length
        ? input.offset + input.limit
        : null,
  };
}
