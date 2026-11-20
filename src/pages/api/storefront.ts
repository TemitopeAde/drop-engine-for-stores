import type { APIRoute } from "astro";
import { z } from "zod";
import { productLaunch, projectDrop } from "../../domain/projection";
import { readInstallation, tenant } from "../../server/storage";
import { handle } from "../../server/http";
export const GET: APIRoute = ({ url }) =>
  handle(async () => {
    const dropId = z
      .string()
      .uuid()
      .optional()
      .parse(url.searchParams.get("dropId") || undefined);
    const productId = z
      .string()
      .uuid()
      .optional()
      .parse(url.searchParams.get("productId") || undefined);
    if (!dropId && !productId) return { drop: null, serverNow: Date.now() };
    const installation = await readInstallation(await tenant(), true);
    const now = Date.now();
    const drops = installation?.state.drops || [];
    const drop = dropId
      ? drops.find(
          (candidate) =>
            candidate.id === dropId && candidate.status === "PUBLISHED",
        )
      : productLaunch(drops, productId!, now);
    if (!drop) return { drop: null, serverNow: now };
    return { serverNow: now, drop: projectDrop(drop, now) };
  });
