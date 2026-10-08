import { catalogVersioning, products, productsV3 } from "@wix/stores";
import { siteProperties } from "@wix/business-tools";
import { auth } from "@wix/essentials";
import { DomainError } from "../domain/drop";
import { CATALOG_PAGE_SIZE } from "../domain/limits";
import type { Installation } from "./storage";
export type ProductOption = { id: string; name: string; image?: string };
export async function storeContext() {
  const [catalog, site] = await Promise.all([
    auth.elevate(catalogVersioning.getCatalogVersion)(),
    auth.elevate(siteProperties.getSiteProperties)(),
  ]);
  if (
    catalog.catalogVersion !== "V1_CATALOG" &&
    catalog.catalogVersion !== "V3_CATALOG"
  )
    throw new DomainError("unavailable", 409);
  return {
    catalogVersion: catalog.catalogVersion,
    timeZone: site.properties?.timeZone || "UTC",
    siteName: site.properties?.siteDisplayName?.trim() || "",
  };
}
export async function catalogPage(
  version: Installation["catalogVersion"],
  page: number,
  cursor?: string,
) {
  const limit = CATALOG_PAGE_SIZE;
  if (version === "V1_CATALOG") {
    const result = await products
      .queryProducts()
      .limit(limit)
      .skip(page * limit)
      .find();
    return {
      products: result.items.map((p) => ({
        id: p._id,
        name: p.name || "",
        image: p.media?.mainMedia?.image?.url,
      })),
      hasNext: result.hasNext(),
    };
  }
  let query = productsV3.queryProducts().eq("visible", true).limit(limit);
  if (cursor) query = query.skipTo(cursor);
  const result = await query.find();
  return {
    products: result.items.map((p) => ({
      id: p._id,
      name: p.name || "",
      image: p.media?.main?.image || p.media?.main?.url,
    })),
    hasNext: result.hasNext(),
    cursor: result.cursors?.next,
  };
}
export async function verifyProducts(
  version: Installation["catalogVersion"],
  ids: string[],
) {
  // Query batches rather than issuing a getProduct request for every selection.
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100);
    const result =
      version === "V1_CATALOG"
        ? await products.queryProducts().in("_id", batch).limit(100).find()
        : await productsV3.queryProducts().in("_id", batch).limit(100).find();
    const visibleIds = new Set(
      result.items.filter((p) => p.visible === true).map((p) => p._id),
    );
    if (batch.some((id) => !visibleIds.has(id)))
      throw new DomainError("unavailable");
  }
}
