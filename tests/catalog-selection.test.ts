import { describe, expect, it, vi } from "vitest";
import { collectProductIds } from "../src/dashboard/catalog-selection";
import { MAX_PRODUCTS_PER_DROP } from "../src/domain/limits";

describe("catalog selection paging", () => {
  it("pages offset-based catalogs and deduplicates repeated products", async () => {
    const loadPage = vi.fn().mockResolvedValue({
      products: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
      hasNext: false,
    });
    const progress = vi.fn();
    await expect(
      collectProductIds(
        {
          products: [{ id: "a", name: "A" }],
          hasNext: true,
        },
        loadPage,
        new AbortController().signal,
        progress,
      ),
    ).resolves.toEqual(["a", "b"]);
    expect(loadPage).toHaveBeenCalledWith(
      1,
      undefined,
      expect.any(AbortSignal),
    );
    expect(progress).toHaveBeenLastCalledWith(2);
  });
  it("rejects a stalled cursor instead of selecting only the repeated page", async () => {
    const page = {
      products: [{ id: "a", name: "A" }],
      hasNext: true,
      cursor: "same",
    };
    await expect(
      collectProductIds(
        page,
        vi.fn().mockResolvedValue(page),
        new AbortController().signal,
        vi.fn(),
      ),
    ).rejects.toThrow("Unable to complete");
  });
  it("reports the limit rather than silently truncating a large catalog", async () => {
    await expect(
      collectProductIds(
        {
          products: Array.from(
            { length: MAX_PRODUCTS_PER_DROP + 1 },
            (_, i) => ({ id: String(i), name: "Product" }),
          ),
          hasNext: false,
        },
        vi.fn(),
        new AbortController().signal,
        vi.fn(),
      ),
    ).rejects.toThrow("product limit");
  });
  it("aborts before requesting another page", async () => {
    const controller = new AbortController();
    controller.abort();
    const loadPage = vi.fn();
    await expect(
      collectProductIds(
        { products: [], hasNext: true },
        loadPage,
        controller.signal,
        vi.fn(),
      ),
    ).rejects.toThrow();
    expect(loadPage).not.toHaveBeenCalled();
  });
});
