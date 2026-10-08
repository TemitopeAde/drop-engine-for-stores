import { beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import { dropSchema, DomainError } from "../src/domain/drop";
import { MAX_PRODUCTS_PER_DROP } from "../src/domain/limits";

const api = vi.hoisted(() => ({
  tenant: vi.fn(),
  storeContext: vi.fn(),
  initialize: vi.fn(),
  catalogPage: vi.fn(),
  readInstallation: vi.fn(),
  verifyProducts: vi.fn(),
  commit: vi.fn(),
}));
vi.mock("../src/server/catalog", () => ({
  catalogPage: api.catalogPage,
  storeContext: api.storeContext,
  verifyProducts: api.verifyProducts,
}));
vi.mock("../src/server/storage", () => ({
  tenant: api.tenant,
  initialize: api.initialize,
  readInstallation: api.readInstallation,
  commit: api.commit,
}));
import { GET, POST } from "../src/pages/api/drops";

function context(url: string, body?: unknown) {
  const request = new Request(
    url,
    body
      ? {
          method: "POST",
          headers: {
            authorization: "Bearer fixture",
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  return { url: new URL(url), request } as APIContext;
}
beforeEach(() => {
  vi.resetAllMocks();
  api.tenant.mockResolvedValue({ instanceId: "fixture", siteId: "fixture" });
  api.storeContext.mockResolvedValue({
    catalogVersion: "V3_CATALOG",
    timeZone: "UTC",
  });
  api.readInstallation.mockResolvedValue({ revision: 1, state: { drops: [] } });
  api.commit.mockResolvedValue({ revision: 2 });
});

describe("product selection API", () => {
  it("returns only the requested catalog page for the selector", async () => {
    const page = {
      products: [{ id: crypto.randomUUID(), name: "Product" }],
      hasNext: false,
    };
    api.catalogPage.mockResolvedValue(page);
    const response = await GET(
      context(
        "https://example.test/api/drops?catalogOnly=true&page=2&cursor=cursor-2",
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(page);
    expect(api.catalogPage).toHaveBeenCalledWith("V3_CATALOG", 2, "cursor-2");
    expect(api.initialize).not.toHaveBeenCalled();
    expect(api.tenant).toHaveBeenCalledWith(true);
  });
  it("requires dashboard authorization before querying the catalog", async () => {
    api.tenant.mockRejectedValue(new DomainError("forbidden", 403));
    const response = await GET(
      context("https://example.test/api/drops?catalogOnly=true"),
    );
    expect(response.status).toBe(403);
    expect(api.catalogPage).not.toHaveBeenCalled();
  });
  it("saves all 10,000 selected IDs through request, schema, and storage validation", async () => {
    const input = {
      name: "Catalog launch",
      productIds: Array.from({ length: MAX_PRODUCTS_PER_DROP }, () =>
        crypto.randomUUID(),
      ),
      localStart: "2099-10-09T12:00",
      localEnd: "2099-10-09T13:00",
      timeZone: "UTC",
      endBehavior: "RESTORE",
    };
    const response = await POST(
      context("https://example.test/api/drops", { action: "save", input }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(dropSchema.parse(body.drop).productIds).toEqual(input.productIds);
    expect(api.verifyProducts).toHaveBeenCalledWith(
      "V3_CATALOG",
      input.productIds,
    );
    expect(api.commit).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining(input),
    ]);
  });
  it("keeps the saved drop unchanged when catalog validation fails", async () => {
    api.verifyProducts.mockRejectedValue(new DomainError("unavailable"));
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "save",
        input: {
          name: "Launch",
          productIds: [crypto.randomUUID()],
          localStart: "2099-10-09T12:00",
          localEnd: "2099-10-09T13:00",
          timeZone: "UTC",
          endBehavior: "RESTORE",
        },
      }),
    );
    expect(response.status).toBe(400);
    expect(api.commit).not.toHaveBeenCalled();
  });
});
