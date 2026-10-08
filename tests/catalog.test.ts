import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  queries: [] as { version: string; ids: string[]; limit: number }[],
  missing: false,
  hidden: false,
}));
vi.mock("@wix/stores", () => {
  const queryProducts = (version: string) => () => {
    const captured = { version, ids: [] as string[], limit: 0 };
    state.queries.push(captured);
    const builder = {
      in: (_field: string, ids: string[]) => {
        captured.ids = ids;
        return builder;
      },
      limit: (limit: number) => {
        captured.limit = limit;
        return builder;
      },
      find: async () => ({
        items: captured.ids
          .filter((_id, index) => !state.missing || index !== 0)
          .map((_id, index) => ({
            _id,
            visible: !(state.hidden && index === 0),
          })),
      }),
    };
    return builder;
  };
  return {
    products: { queryProducts: queryProducts("V1_CATALOG") },
    productsV3: { queryProducts: queryProducts("V3_CATALOG") },
    catalogVersioning: {},
  };
});
vi.mock("@wix/business-tools", () => ({ siteProperties: {} }));
vi.mock("@wix/essentials", () => ({ auth: {} }));
import { verifyProducts } from "../src/server/catalog";
beforeEach(() => {
  state.queries = [];
  state.missing = false;
  state.hidden = false;
});
describe.each(["V1_CATALOG", "V3_CATALOG"] as const)(
  "%s selection validation",
  (version) => {
    it("validates 5,000 products in 50 bounded queries", async () => {
      const ids = Array.from({ length: 5000 }, () => crypto.randomUUID());
      await verifyProducts(version, ids);
      expect(state.queries).toHaveLength(50);
      expect(
        state.queries.every(
          (query) => query.version === version && query.limit === 100,
        ),
      ).toBe(true);
      expect(state.queries.flatMap((query) => query.ids)).toEqual(ids);
    });
    it("rejects a missing selected product", async () => {
      state.missing = true;
      await expect(
        verifyProducts(version, [crypto.randomUUID()]),
      ).rejects.toThrow("unavailable");
    });
    it("rejects a hidden selected product", async () => {
      state.hidden = true;
      await expect(
        verifyProducts(version, [crypto.randomUUID()]),
      ).rejects.toThrow("unavailable");
    });
  },
);
