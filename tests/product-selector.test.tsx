// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ProductSelector } from "../src/dashboard/ProductSelector";
import type { CatalogPage } from "../src/dashboard/api";

const api = vi.hoisted(() => ({ loadCatalog: vi.fn() }));
vi.mock("../src/dashboard/api", () => ({ loadCatalog: api.loadCatalog }));
const products = Array.from({ length: 5000 }, (_, index) => ({
  id: `${index.toString(16).padStart(8, "0")}-7609-4ae9-91ad-a22a052f1aa9`,
  name: `Product ${index + 1}`,
}));
function catalogPage(page: number): CatalogPage {
  return {
    products: products.slice(page * 50, page * 50 + 50),
    hasNext: page < 99,
    cursor: page < 99 ? `cursor-${page + 1}` : undefined,
  };
}
function Selector({
  initial = [],
  firstPage = catalogPage(0),
  disabled = false,
  lockedIds = [],
}: {
  initial?: string[];
  lockedIds?: string[];
  firstPage?: CatalogPage;
  disabled?: boolean;
}) {
  const [ids, setIds] = useState(initial);
  return (
    <ProductSelector
      firstPage={firstPage}
      ids={ids}
      lockedIds={lockedIds}
      disabled={disabled}
      onChange={setIds}
      onSelecting={vi.fn()}
    />
  );
}
afterEach(cleanup);
beforeEach(() =>
  api.loadCatalog
    .mockReset()
    .mockImplementation(async (page: number) => catalogPage(page)),
);

describe("catalog product selection", () => {
  it("selects all 5,000 products across pages while rendering only 50 rows", async () => {
    render(<Selector />);
    const all = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Select all products",
    });
    fireEvent.click(all);
    await waitFor(() =>
      expect(screen.getByText("5,000 selected")).toBeTruthy(),
    );
    expect(api.loadCatalog).toHaveBeenCalledTimes(99);
    expect(api.loadCatalog).toHaveBeenCalledWith(
      1,
      "cursor-1",
      expect.any(AbortSignal),
    );
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);
    expect(screen.getAllByRole("checkbox")).toHaveLength(51);
    fireEvent.click(screen.getByRole("checkbox", { name: "Product 1" }));
    expect(screen.getByText("4,999 selected")).toBeTruthy();
    expect(all.checked).toBe(false);
    expect(all.indeterminate).toBe(true);
  }, 15000);
  it("clears all selections with the same checkbox", async () => {
    render(
      <Selector
        firstPage={{ products: products.slice(0, 2), hasNext: false }}
      />,
    );
    const all = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Select all products",
    });
    fireEvent.click(all);
    await waitFor(() => expect(all.checked).toBe(true));
    fireEvent.click(all);
    expect(screen.getByText("0 selected")).toBeTruthy();
    expect(api.loadCatalog).not.toHaveBeenCalled();
  });
  it("retains selections when navigating forward and back using cursors", async () => {
    render(<Selector />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Product 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Next products" }));
    await screen.findByRole("checkbox", { name: "Product 51" });
    expect(screen.queryByRole("checkbox", { name: "Product 1" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Product 51" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous products" }));
    await waitFor(() =>
      expect(
        screen.getByRole<HTMLInputElement>("checkbox", { name: "Product 1" })
          .checked,
      ).toBe(true),
    );
    expect(screen.getByText("2 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next products" }));
    await waitFor(() =>
      expect(
        screen.getByRole<HTMLInputElement>("checkbox", { name: "Product 51" })
          .checked,
      ).toBe(true),
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(51);
  });
  it("keeps the previous selection when selecting all fails and can retry", async () => {
    api.loadCatalog.mockRejectedValueOnce(new Error("Catalog unavailable"));
    render(<Selector initial={[products[0].id]} />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select all products" }),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Catalog unavailable",
    );
    expect(screen.getByText("1 selected")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select all products" }),
    );
    await screen.findByText("5,000 selected");
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("cancels a pending selection without keeping a partial catalog", async () => {
    api.loadCatalog.mockImplementationOnce(
      (_page: number, _cursor: string, signal: AbortSignal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason)),
        ),
    );
    render(<Selector initial={[products[0].id]} />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select all products" }),
    );
    expect(
      screen
        .getByRole<HTMLInputElement>("checkbox", { name: "Product 1" })
        .matches(":disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Stop selecting" }));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByText("1 selected")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Select all products",
      }).disabled,
    ).toBe(false);
  });
  it("keeps the current page and selection after pagination fails", async () => {
    api.loadCatalog.mockRejectedValueOnce(new Error("Catalog unavailable"));
    render(<Selector initial={[products[0].id]} />);
    fireEvent.click(screen.getByRole("button", { name: "Next products" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", { name: "Product 1" })
        .checked,
    ).toBe(true);
    expect(screen.getByText("Page 1")).toBeTruthy();
  });
  it("disables selection for empty catalogs and during saving", () => {
    const view = render(
      <Selector firstPage={{ products: [], hasNext: false }} />,
    );
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Select all products",
      }).disabled,
    ).toBe(true);
    view.rerender(<Selector disabled />);
    expect(
      screen
        .getAllByRole<HTMLInputElement>("checkbox")
        .every((checkbox) => checkbox.matches(":disabled")),
    ).toBe(true);
  });
  it("prevents choosing products that belong to another drop", async () => {
    const page = { products: products.slice(0, 3), hasNext: false };
    render(<Selector firstPage={page} lockedIds={[products[1].id]} />);
    const locked = screen.getByRole<HTMLInputElement>("checkbox", {
      name: /Product 2/,
    });
    expect(locked.disabled).toBe(true);
    expect(screen.getByText("In another drop")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select all products" }),
    );
    await waitFor(() => expect(screen.getByText("2 selected")).toBeTruthy());
    expect(locked.checked).toBe(false);
  });
});
