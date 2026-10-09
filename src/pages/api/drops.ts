import type { APIRoute } from "astro";
import { z } from "zod";
import {
  assertPublishable,
  dropFilterSchema,
  dropInputSchema,
  DomainError,
  filterDrops,
  replaceDrop,
  schedule,
  startDrop,
  type Drop,
} from "../../domain/drop";
import {
  catalogPage,
  storeContext,
  verifyProducts,
} from "../../server/catalog";
import {
  commit,
  initialize,
  readInstallation,
  tenant,
} from "../../server/storage";
import { handle, readBody } from "../../server/http";
import { currentPlan } from "../../server/plan";
import { removeDropEntries } from "../../server/waitlist";
import { CATALOG_PAGE_SIZE, MAX_PRODUCTS_PER_DROP } from "../../domain/limits";
export const GET: APIRoute = ({ url }) =>
  handle(async () => {
    const scope = await tenant(true);
    if (url.searchParams.get("view") === "list") {
      const filter = dropFilterSchema.parse({
        search: url.searchParams.get("search") ?? "",
        status: url.searchParams.get("status") || undefined,
      });
      const drops = (await readInstallation(scope))?.state.drops ?? [];
      const now = Date.now();
      return {
        drops: filterDrops(drops, filter, now),
        total: drops.length,
        serverNow: now,
      };
    }
    const context = await storeContext();
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(Math.ceil(MAX_PRODUCTS_PER_DROP / CATALOG_PAGE_SIZE))
      .parse(url.searchParams.get("page") || 0);
    const cursor = z
      .string()
      .max(4000)
      .optional()
      .parse(url.searchParams.get("cursor") || undefined);
    const catalog = await catalogPage(context.catalogVersion, page, cursor);
    if (url.searchParams.get("catalogOnly") === "true") return catalog;
    const installation = await initialize(
      scope,
      context.catalogVersion,
      context.timeZone,
    );
    return {
      drops: installation.state.drops,
      revision: installation.revision,
      plan: await currentPlan(scope),
      ...context,
      ...catalog,
      serverNow: Date.now(),
    };
  });
const commandSchema = z
  .object({
    action: z.enum([
      "save",
      "publish",
      "start",
      "cancel",
      "archive",
      "restore",
      "duplicate",
      "delete",
    ]),
    id: z.string().uuid().optional(),
    version: z.number().int().positive().optional(),
    input: dropInputSchema.optional(),
  })
  .strict();
export const POST: APIRoute = ({ request }) =>
  handle(async () => {
    const scope = await tenant(true);
    const command = commandSchema.parse(await readBody(request));
    const current = await readInstallation(scope);
    if (!current) throw new DomainError("setup", 409);
    const old = current.state.drops.find((drop) => drop.id === command.id);
    if (command.id && (!old || command.version !== old.version))
      throw new DomainError("conflict", 409);
    const now = Date.now();
    if (command.action === "delete") {
      if (!old) throw new DomainError("conflict", 409);
      const result = await commit(
        current,
        current.state.drops.filter((drop) => drop.id !== old.id),
      );
      // The drop is gone either way; leftover signups only cost plan capacity.
      await removeDropEntries(scope, old.id).catch((error: unknown) =>
        console.error("Drop Engine waitlist cleanup failed", {
          error: error instanceof Error ? error.name : "UnknownError",
        }),
      );
      return { deleted: old.id, revision: result.revision };
    }
    let next: Drop;
    // Only saving or publishing can make a drop gate checkout.
    let maxActive: number | null = null;
    if (command.action === "save" || command.action === "publish") {
      if (!command.input) throw new DomainError("fieldsRequired");
      const input = command.input;
      const { limits } = await currentPlan(scope);
      if (input.productIds.length > limits.productsPerDrop)
        throw new DomainError("productLimit", 403);
      maxActive = limits.activeDrops;
      const context = await storeContext();
      await verifyProducts(context.catalogVersion, input.productIds);
      next = {
        ...input,
        ...schedule(input, old),
        id: old?.id || crypto.randomUUID(),
        version: (old?.version || 0) + 1,
        status:
          command.action === "publish"
            ? "PUBLISHED"
            : old?.status === "PUBLISHED"
              ? "PUBLISHED"
              : "DRAFT",
        updatedAt: now,
      };
    } else {
      if (!old) throw new DomainError("conflict", 409);
      next = { ...old, version: old.version + 1, updatedAt: now };
      if (command.action === "start") next = startDrop(old, now);
      if (command.action === "duplicate")
        next = {
          ...next,
          id: crypto.randomUUID(),
          version: 1,
          status: "DRAFT",
        };
      if (command.action === "cancel") next.status = "CANCELLED";
      if (command.action === "archive") {
        if (old.status === "PUBLISHED")
          throw new DomainError("activeLimit", 409);
        next.status = "ARCHIVED";
      }
      if (command.action === "restore") next.status = "DRAFT";
    }
    if (command.action === "publish")
      assertPublishable(next.endsAt, Date.now());
    const result = await commit(
      current,
      replaceDrop(current.state.drops, next, now, maxActive),
    );
    return { drop: next, revision: result.revision };
  });
