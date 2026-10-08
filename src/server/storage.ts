import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { z } from "zod";
import { dropSchema, DomainError, type Drop } from "../domain/drop";
export const COLLECTION =
  "@admin14744/drop-engine-for-stores/app_installations";
const installationSchema = z
  .object({
    _id: z.string(),
    instanceId: z.string(),
    siteId: z.string(),
    revision: z.number().int().nonnegative(),
    catalogVersion: z.enum(["V1_CATALOG", "V3_CATALOG"]),
    timeZone: z.string(),
    state: z.object({ drops: z.array(dropSchema) }),
  })
  .passthrough();
export type Installation = z.infer<typeof installationSchema>;
export type Tenant = { instanceId: string; siteId: string };
export async function caller(admin = false) {
  const token = await auth.getTokenInfo();
  if (
    !token.active ||
    !token.instanceId ||
    !token.siteId ||
    (admin && token.subjectType !== "USER")
  )
    throw new DomainError("forbidden", 403);
  return {
    scope: { instanceId: token.instanceId, siteId: token.siteId } as Tenant,
    subjectId: token.subjectId,
  };
}
export async function tenant(admin = false): Promise<Tenant> {
  return (await caller(admin)).scope;
}
async function find(instanceId: string, elevated: boolean) {
  const query = (elevated ? auth.elevate(items.query) : items.query)(COLLECTION)
    .eq("_id", instanceId)
    .limit(1);
  const result = await query.find({ consistentRead: true });
  if (!result.items.length) return null;
  const parsed = installationSchema.parse(result.items[0]);
  if (parsed.instanceId !== instanceId) throw new DomainError("forbidden", 403);
  return parsed;
}
export async function readInstallation(scope: Tenant, elevated = false) {
  const parsed = await find(scope.instanceId, elevated);
  if (parsed && parsed.siteId !== scope.siteId)
    throw new DomainError("forbidden", 403);
  return parsed;
}
// Only use with the installation ID supplied by trusted Wix SPI metadata.
export const readForValidation = (instanceId: string) => find(instanceId, true);
export async function initialize(
  scope: Tenant,
  catalogVersion: Installation["catalogVersion"],
  timeZone: string,
) {
  const current = await readInstallation(scope);
  if (current) return current;
  const record: Installation = {
    _id: scope.instanceId,
    ...scope,
    revision: 0,
    catalogVersion,
    timeZone,
    state: { drops: [] },
  };
  try {
    return installationSchema.parse(await items.insert(COLLECTION, record));
  } catch (error) {
    const winner = await readInstallation(scope);
    if (winner) return winner;
    throw error;
  }
}
export async function commit(current: Installation, drops: Drop[]) {
  try {
    return installationSchema.parse(
      await items.update(
        COLLECTION,
        { ...current, revision: current.revision + 1, state: { drops } },
        {
          condition: items
            .filter()
            .eq("revision", current.revision)
            .eq("instanceId", current.instanceId),
        },
      ),
    );
  } catch (error) {
    const fresh = await readInstallation(current);
    if (fresh && fresh.revision !== current.revision)
      throw new DomainError("conflict", 409);
    throw error;
  }
}
