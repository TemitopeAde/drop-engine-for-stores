import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import { dropSchema, DomainError } from "../src/domain/drop";
import { MAX_PRODUCTS_PER_DROP } from "../src/domain/limits";
import { describePlan } from "../src/domain/plans";

const basic = describePlan({ isFree: true }, "fixture");
const business = describePlan(
  { isFree: false, billing: { packageName: "business" } },
  "fixture",
);

const api = vi.hoisted(() => ({
  tenant: vi.fn(),
  storeContext: vi.fn(),
  initialize: vi.fn(),
  catalogPage: vi.fn(),
  readInstallation: vi.fn(),
  verifyProducts: vi.fn(),
  commit: vi.fn(),
  removeDropEntries: vi.fn(),
  currentPlan: vi.fn(),
}));
vi.mock("../src/server/plan", () => ({ currentPlan: api.currentPlan }));
vi.mock("../src/server/waitlist", () => ({
  removeDropEntries: api.removeDropEntries,
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
  api.currentPlan.mockResolvedValue(business);
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

describe("drop deletion API", () => {
  const drop = (id = crypto.randomUUID()) => ({
    id,
    name: "Launch",
    productIds: [crypto.randomUUID()],
    localStart: "2099-10-09T12:00",
    localEnd: "2099-10-09T13:00",
    timeZone: "UTC",
    endBehavior: "RESTORE" as const,
    version: 3,
    startsAt: 4_000_000_000_000,
    endsAt: 4_000_003_600_000,
    status: "PUBLISHED" as const,
    updatedAt: 0,
  });
  it("removes the drop and its waitlist signups", async () => {
    const target = drop(),
      other = drop();
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: { drops: [target, other] },
    });
    api.removeDropEntries.mockResolvedValue(2);
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "delete",
        id: target.id,
        version: target.version,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: target.id, revision: 2 });
    expect(api.commit).toHaveBeenCalledWith(expect.anything(), [other]);
    expect(api.removeDropEntries).toHaveBeenCalledWith(
      { instanceId: "fixture", siteId: "fixture" },
      target.id,
    );
  });
  it("refuses to delete a stale version", async () => {
    const target = drop();
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: { drops: [target] },
    });
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "delete",
        id: target.id,
        version: 1,
      }),
    );
    expect(response.status).toBe(409);
    expect(api.commit).not.toHaveBeenCalled();
    expect(api.removeDropEntries).not.toHaveBeenCalled();
  });
  it("still reports success when signup cleanup fails", async () => {
    const target = drop();
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: { drops: [target] },
    });
    api.removeDropEntries.mockRejectedValue(new Error("WDE0001"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "delete",
        id: target.id,
        version: target.version,
      }),
    );
    expect(response.status).toBe(200);
    expect(api.commit).toHaveBeenCalledWith(expect.anything(), []);
  });
});

describe("drop list filtering API", () => {
  const now = Date.now();
  const make = (name: string, overrides: object = {}) => ({
    id: crypto.randomUUID(),
    name,
    productIds: [crypto.randomUUID()],
    localStart: "2099-10-09T12:00",
    localEnd: "2099-10-09T13:00",
    timeZone: "UTC",
    endBehavior: "RESTORE" as const,
    version: 1,
    startsAt: now - 60_000,
    endsAt: now + 60_000,
    status: "PUBLISHED" as const,
    updatedAt: 0,
    ...overrides,
  });
  const live = make("Summer Launch"),
    scheduled = make("Summer Preview", {
      startsAt: now + 60_000,
      endsAt: now + 120_000,
    }),
    draft = make("Winter", { status: "DRAFT" });
  beforeEach(() => {
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: { drops: [live, scheduled, draft] },
    });
  });
  const list = async (query: string) => {
    const response = await GET(
      context(`https://example.test/api/drops?view=list${query}`),
    );
    return { status: response.status, body: await response.json() };
  };
  it("searches names case-insensitively on the server", async () => {
    const { body } = await list("&search=%20summer%20");
    expect(body.drops.map((d: { id: string }) => d.id)).toEqual([
      live.id,
      scheduled.id,
    ]);
    expect(body.total).toBe(3);
    expect(api.storeContext).not.toHaveBeenCalled();
    expect(api.catalogPage).not.toHaveBeenCalled();
  });
  it("filters by launch phase and combines with search", async () => {
    expect(
      (await list("&status=LIVE")).body.drops.map((d: { id: string }) => d.id),
    ).toEqual([live.id]);
    expect((await list("&status=DRAFT&search=summer")).body.drops).toEqual([]);
  });
  it("rejects unknown statuses and requires a dashboard user", async () => {
    expect((await list("&status=BOGUS")).status).toBe(400);
    api.tenant.mockRejectedValue(new DomainError("forbidden", 403));
    expect((await list("")).status).toBe(403);
    expect(api.readInstallation).not.toHaveBeenCalled();
  });
});

describe("plan limits API", () => {
  const input = (count: number) => ({
    name: "Launch",
    productIds: Array.from({ length: count }, () => crypto.randomUUID()),
    localStart: "2099-10-09T12:00",
    localEnd: "2099-10-09T13:00",
    timeZone: "UTC",
    endBehavior: "RESTORE" as const,
  });
  it("limits Basic drops to one product before touching the catalog", async () => {
    api.currentPlan.mockResolvedValue(basic);
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "save",
        input: input(2),
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "productLimit" });
    expect(api.verifyProducts).not.toHaveBeenCalled();
    expect(api.commit).not.toHaveBeenCalled();
  });
  it("enforces the plan's active-drop limit on publish", async () => {
    api.currentPlan.mockResolvedValue(basic);
    const now = Date.now();
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: {
        drops: [
          {
            ...input(1),
            id: crypto.randomUUID(),
            version: 1,
            startsAt: now + 60_000,
            endsAt: now + 120_000,
            status: "PUBLISHED",
            updatedAt: 0,
          },
        ],
      },
    });
    const response = await POST(
      context("https://example.test/api/drops", {
        action: "publish",
        input: input(1),
      }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "activeLimit" });
  });
  it("returns the plan with the dashboard data", async () => {
    api.storeContext.mockResolvedValue({
      catalogVersion: "V3_CATALOG",
      timeZone: "UTC",
    });
    api.catalogPage.mockResolvedValue({ products: [], hasNext: false });
    api.initialize.mockResolvedValue({ revision: 1, state: { drops: [] } });
    api.currentPlan.mockResolvedValue(basic);
    const response = await GET(context("https://example.test/api/drops"));
    expect((await response.json()).plan).toEqual(basic);
  });
});

describe("manual start API", () => {
  const now = Date.parse("2026-11-01T09:30:45.123Z");
  const target = () => ({
    id: crypto.randomUUID(),
    name: "Launch",
    productIds: [crypto.randomUUID()],
    localStart: "2026-12-01T12:00",
    localEnd: "2026-12-01T13:00",
    timeZone: "America/Los_Angeles",
    endBehavior: "RESTORE" as const,
    version: 3,
    startsAt: Date.parse("2026-12-01T20:00Z"),
    endsAt: Date.parse("2026-12-01T21:00Z"),
    status: "PUBLISHED" as const,
    updatedAt: 0,
  });
  beforeEach(() => vi.spyOn(Date, "now").mockReturnValue(now));
  afterEach(() => vi.restoreAllMocks());
  async function start(
    drop: ReturnType<typeof target>,
    overrides: object = {},
  ) {
    api.readInstallation.mockResolvedValue({
      revision: 1,
      state: { drops: [drop] },
    });
    return POST(
      context("https://example.test/api/drops", {
        action: "start",
        id: drop.id,
        version: drop.version,
        ...overrides,
      }),
    );
  }
  it("starts using server time and keeps the end, products, and settings", async () => {
    const drop = target();
    const response = await start(drop);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      drop: {
        ...drop,
        startsAt: now,
        localStart: "2026-11-01T01:30:45.123",
        version: 4,
        updatedAt: now,
      },
      revision: 2,
    });
    expect(api.commit).toHaveBeenCalledWith(expect.anything(), [body.drop]);
    expect(api.tenant).toHaveBeenCalledWith(true);
    expect(api.currentPlan).not.toHaveBeenCalled();
    expect(api.removeDropEntries).not.toHaveBeenCalled();
    // Reopening and saving keeps the exact repeated-hour instant.
    api.readInstallation.mockResolvedValue({
      revision: 2,
      state: { drops: [body.drop] },
    });
    const saved = await POST(
      context("https://example.test/api/drops", {
        action: "save",
        id: drop.id,
        version: 4,
        input: body.drop,
      }),
    );
    expect(saved.status).toBe(200);
    expect((await saved.json()).drop.startsAt).toBe(now);
  });
  it.each(["DRAFT", "CANCELLED", "ARCHIVED", "LIVE", "ENDED"])(
    "rejects %s drops",
    async (status) => {
      const drop = target();
      const changed =
        status === "LIVE"
          ? { ...drop, startsAt: now }
          : status === "ENDED"
            ? { ...drop, startsAt: now - 1000, endsAt: now }
            : { ...drop, status };
      api.readInstallation.mockResolvedValue({
        revision: 1,
        state: { drops: [changed] },
      });
      const response = await POST(
        context("https://example.test/api/drops", {
          action: "start",
          id: drop.id,
          version: drop.version,
        }),
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "startUnavailable" });
      expect(api.commit).not.toHaveBeenCalled();
    },
  );
  it.each([
    { id: undefined },
    { version: undefined },
    { version: 1 },
    { id: crypto.randomUUID() },
  ])("rejects missing or stale identifiers %j", async (overrides) => {
    expect((await start(target(), overrides)).status).toBe(409);
    expect(api.commit).not.toHaveBeenCalled();
  });
  it("rejects unauthorized callers before reading state", async () => {
    api.tenant.mockRejectedValue(new DomainError("forbidden", 403));
    expect((await start(target())).status).toBe(403);
    expect(api.readInstallation).not.toHaveBeenCalled();
    expect(api.commit).not.toHaveBeenCalled();
  });
  it("reports concurrent commit conflicts without success", async () => {
    api.commit.mockRejectedValue(new DomainError("conflict", 409));
    expect((await start(target())).status).toBe(409);
  });
});
