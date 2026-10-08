import { MAX_PRODUCTS_PER_DROP, CATALOG_PAGE_SIZE } from "../domain/limits";
import { t } from "../locales/translations";
import type { CatalogPage } from "./api";

type LoadPage = (
  page: number,
  cursor?: string,
  signal?: AbortSignal,
) => Promise<CatalogPage>;

export async function collectProductIds(
  firstPage: CatalogPage,
  loadPage: LoadPage,
  signal: AbortSignal,
  progress: (count: number) => void,
): Promise<string[]> {
  const ids = new Set<string>();
  const cursors = new Set<string>();
  let current = firstPage;
  let page = 0;
  while (true) {
    signal.throwIfAborted();
    for (const product of current.products) ids.add(product.id);
    if (ids.size > MAX_PRODUCTS_PER_DROP)
      throw new Error(t("selectionTooLarge"));
    progress(ids.size);
    if (!current.hasNext) return [...ids];
    // Detect a stalled cursor and bound offset paging when the catalog changes.
    if (current.cursor) {
      if (cursors.has(current.cursor)) throw new Error(t("failed"));
      cursors.add(current.cursor);
    }
    if (++page > Math.ceil(MAX_PRODUCTS_PER_DROP / CATALOG_PAGE_SIZE))
      throw new Error(t("selectionTooLarge"));
    current = await loadPage(page, current.cursor, signal);
  }
}
