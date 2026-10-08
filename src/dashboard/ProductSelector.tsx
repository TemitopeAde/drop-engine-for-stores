import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Rocket } from "lucide-react";
import { Button } from "../components/ui/button";
import { MAX_PRODUCTS_PER_DROP } from "../domain/limits";
import { useTranslation } from "../locales/use-translation";
import { loadCatalog, type CatalogPage } from "./api";
import { collectProductIds } from "./catalog-selection";

interface Props {
  firstPage: CatalogPage;
  ids: string[];
  lockedIds: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
  onSelecting: (selecting: boolean) => void;
}

export function ProductSelector({
  firstPage,
  ids,
  lockedIds,
  disabled,
  onChange,
  onSelecting,
}: Props) {
  const { t, locale } = useTranslation();
  const [current, setCurrent] = useState(firstPage);
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [catalogIds, setCatalogIds] = useState<string[] | null>(
    firstPage.hasNext ? null : firstPage.products.map((product) => product.id),
  );
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [found, setFound] = useState(0);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => new Set(ids), [ids]);
  const locked = useMemo(() => new Set(lockedIds), [lockedIds]);
  const selectableIds = catalogIds?.filter((id) => !locked.has(id));
  const allSelected =
    !!selectableIds?.length && selectableIds.every((id) => selected.has(id));
  const busy = disabled || loading || selecting;

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate = ids.length > 0 && !allSelected;
  }, [ids.length, allSelected]);

  async function changePage(nextPage: number) {
    if (busy || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const cursor = nextPage > page ? current.cursor : cursors[nextPage];
      const next =
        nextPage === 0
          ? firstPage
          : await loadCatalog(nextPage, cursor, controller.signal);
      controller.signal.throwIfAborted();
      setCursors((previous) => {
        const nextCursors = previous.slice(0, nextPage + 1);
        nextCursors[nextPage] = cursor;
        return nextCursors;
      });
      setCurrent(next);
      setPage(nextPage);
    } catch (err) {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function toggleAll() {
    if (busy || request.current) return;
    setError("");
    if (allSelected) {
      onChange([]);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSelecting(true);
    onSelecting(true);
    setFound(0);
    try {
      const allIds = await collectProductIds(
        firstPage,
        loadCatalog,
        controller.signal,
        setFound,
      );
      controller.signal.throwIfAborted();
      const nextIds = [
        ...new Set([...ids, ...allIds.filter((id) => !locked.has(id))]),
      ];
      if (nextIds.length > MAX_PRODUCTS_PER_DROP)
        throw new Error(t("selectionTooLarge"));
      setCatalogIds(allIds);
      onChange(nextIds);
    } catch (err) {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      if (request.current === controller) request.current = null;
      setSelecting(false);
      onSelecting(false);
    }
  }

  function toggleProduct(id: string, checked: boolean) {
    setError("");
    if (
      checked &&
      !selected.has(id) &&
      selected.size >= MAX_PRODUCTS_PER_DROP
    ) {
      setError(t("selectionTooLarge"));
      return;
    }
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange([...next]);
  }

  return (
    <section
      className="de-card de-product-card"
      aria-busy={loading || selecting}
    >
      <div className="de-card-heading">
        <h2>{t("catalog")}</h2>
        <span aria-live="polite">
          {ids.length.toLocaleString(locale)} {t("selected")}
        </span>
      </div>
      <div className="de-product-selection">
        <label className="de-select-all">
          <input
            ref={selectAll}
            type="checkbox"
            checked={allSelected}
            disabled={
              busy || (!firstPage.products.length && !firstPage.hasNext)
            }
            aria-describedby="select-all-help"
            onChange={() => void toggleAll()}
          />
          {t("selectAllProducts")}
        </label>
        <p id="select-all-help">{t("selectAllHelp")}</p>
      </div>
      {selecting && (
        <div className="de-selection-progress">
          <span role="status">
            <LoaderCircle className="de-spin" size={16} aria-hidden="true" />
            {t("selectingProducts")} {found.toLocaleString(locale)}{" "}
            {t("productsFound")}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => request.current?.abort()}
          >
            {t("stopSelecting")}
          </Button>
        </div>
      )}
      {error && (
        <p className="de-error" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={busy}>
        <legend className="de-sr-only">{t("products")}</legend>
        {current.products.map((product) => (
          <label className="de-product" key={product.id}>
            <input
              type="checkbox"
              checked={selected.has(product.id)}
              disabled={locked.has(product.id) && !selected.has(product.id)}
              onChange={(event) =>
                toggleProduct(product.id, event.target.checked)
              }
            />
            {product.image ? (
              <img
                src={product.image}
                alt=""
                width={44}
                height={44}
                loading="lazy"
              />
            ) : (
              <span className="de-product-placeholder" aria-hidden="true">
                <Rocket size={18} />
              </span>
            )}
            <span>{product.name}</span>
            {locked.has(product.id) && (
              <span className="de-product-locked">{t("inOtherDrop")}</span>
            )}
          </label>
        ))}
        {!current.products.length && <p>{t("noProducts")}</p>}
      </fieldset>
      <div className="de-product-pagination">
        <span>
          {t("productPage")} {page + 1}
        </span>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={busy || page === 0}
            onClick={() => void changePage(page - 1)}
          >
            {t("previousProducts")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !current.hasNext}
            onClick={() => void changePage(page + 1)}
          >
            {loading && (
              <LoaderCircle className="de-spin" size={16} aria-hidden="true" />
            )}
            {t("nextProducts")}
          </Button>
        </div>
      </div>
    </section>
  );
}
