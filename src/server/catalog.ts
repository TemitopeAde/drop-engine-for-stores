import { catalogVersioning, products, productsV3 } from "@wix/stores";
import { siteProperties } from "@wix/business-tools";
import { auth } from "@wix/essentials";
import { DomainError } from "../domain/drop";
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
  };
}
export async function catalogPage(
  version: Installation["catalogVersion"],
  page: number,
  cursor?: string,
) {
  const limit = 50;
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
    products: result.items.map((p) => ({ id: p._id, name: p.name || "" })),
    hasNext: result.hasNext(),
    cursor: result.cursors?.next,
  };
}
export async function verifyProducts(
  version: Installation["catalogVersion"],
  ids: string[],
) {
  for (let offset = 0; offset < ids.length; offset += 5) {
    await Promise.all(
      ids.slice(offset, offset + 5).map(async (id) => {
        const product =
          version === "V1_CATALOG"
            ? (await products.getProduct(id)).product
            : await productsV3.getProduct(id);
        if (!product || product._id !== id || product.visible !== true)
          throw new DomainError("unavailable");
      }),
    );
  }
}
