import type { APIRoute } from "astro";
import { z } from "zod";
import { productLaunch, projectDrop } from "../../domain/projection";
import { readInstallation, tenant } from "../../server/storage";
import { handle } from "../../server/http";
export const GET: APIRoute = ({ url }) =>
  handle(async () => {
    const productId = z
      .string()
      .uuid()
      .parse(url.searchParams.get("productId"));
    const installation = await readInstallation(await tenant(), true);
    const now = Date.now();
    const drop = productLaunch(installation?.state.drops || [], productId, now);
    if (!drop) return { drop: null, serverNow: now };
    return { serverNow: now, drop: projectDrop(drop, now) };
  });
