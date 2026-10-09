import { beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import { DomainError, type Drop } from "../src/domain/drop";
import {
  acceptsSignups,
  csvCell,
  emailSchema,
  entryId,
  joinSchema,
  toCsv,
} from "../src/domain/waitlist";
import { projectDrop } from "../src/domain/projection";
import { describePlan } from "../src/domain/plans";

const api = vi.hoisted(() => ({
  caller: vi.fn(),
  tenant: vi.fn(),
  readInstallation: vi.fn(),
  consumeSignupAttempt: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
  currentPlan: vi.fn(),
  allEntries: vi.fn(),
  listEntries: vi.fn(),
  removeEntry: vi.fn(),
  unsubscribe: vi.fn(),
  sendConfirmation: vi.fn(),
}));
vi.mock("../src/server/plan", () => ({ currentPlan: api.currentPlan }));
vi.mock("../src/server/email", () => ({
  sendConfirmation: api.sendConfirmation,
}));
vi.mock("../src/server/storage", () => ({
  caller: api.caller,
  tenant: api.tenant,
  readInstallation: api.readInstallation,
}));
vi.mock("../src/server/waitlist", () => ({
  consumeSignupAttempt: api.consumeSignupAttempt,
  join: api.join,
  leave: api.leave,
  allEntries: api.allEntries,
  listEntries: api.listEntries,
  removeEntry: api.removeEntry,
  unsubscribe: api.unsubscribe,
}));
import { POST as storefront } from "../src/pages/api/waitlist";
import {
  GET as adminGet,
  POST as adminPost,
} from "../src/pages/api/waitlist-admin";

const scope = { instanceId: "instance", siteId: "site" };
const drop: Drop = {
  id: crypto.randomUUID(),
  name: "Drop",
  productIds: [crypto.randomUUID()],
  localStart: "2026-01-01T00:00",
  localEnd: "2026-01-02T00:00",
  timeZone: "UTC",
  endBehavior: "RESTORE",
  version: 1,
  startsAt: Date.now() + 60_000,
  endsAt: Date.now() + 120_000,
  status: "PUBLISHED",
  updatedAt: 0,
};
function post(body: unknown) {
  return {
    request: new Request("https://app/api/waitlist", {
      method: "POST",
      headers: {
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  } as APIContext;
}
const join = (overrides: object = {}) => ({
  action: "join",
  dropId: drop.id,
  email: "  Shopper@Example.COM ",
  consent: true,
  website: "",
  elapsedMs: 5000,
  ...overrides,
});
beforeEach(() => {
  vi.resetAllMocks();
  api.caller.mockResolvedValue({ scope, subjectId: "visitor" });
  api.tenant.mockResolvedValue(scope);
  api.readInstallation.mockResolvedValue({
    catalogVersion: "V3_CATALOG",
    state: { drops: [drop] },
  });
  api.consumeSignupAttempt.mockResolvedValue(true);
  api.join.mockResolvedValue({ status: "joined", id: "a", token: "b" });
});

describe("waitlist rules", () => {
  it("trims and case-folds without rewriting the mailbox", () => {
    expect(emailSchema.parse("  A.B+tag@Gmail.COM ")).toBe("a.b+tag@gmail.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
  it("derives one ID per tenant, drop and normalized email", async () => {
    const a = await entryId("i", "d", "Shopper@Example.com");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await entryId("i", "d", " shopper@example.com")).toBe(a);
    expect(await entryId("other", "d", "shopper@example.com")).not.toBe(a);
    expect(await entryId("i", "other", "shopper@example.com")).not.toBe(a);
  });
  it("requires explicit consent", () => {
    expect(joinSchema.safeParse(join({ consent: false })).success).toBe(false);
    expect(joinSchema.safeParse(join({ consent: undefined })).success).toBe(
      false,
    );
  });
  it("accepts signups only before a published drop opens", () => {
    const now = drop.startsAt - 1;
    expect(acceptsSignups(drop, now)).toBe(true);
    expect(acceptsSignups(drop, drop.startsAt)).toBe(false);
    expect(acceptsSignups({ ...drop, status: "DRAFT" }, now)).toBe(false);
    expect(acceptsSignups({ ...drop, waitlist: false }, now)).toBe(false);
    expect(projectDrop(drop, now).waitlist).toBe(true);
  });
  it("neutralises spreadsheet formulas and quotes", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("@x")).toBe(`"'@x"`);
    expect(csvCell('a"b')).toBe(`"a""b"`);
    expect(toCsv([["a", "b"]])).toBe(`"a","b"\r\n`);
  });
});

describe("storefront waitlist API", () => {
  it("joins with the normalized email and consent text", async () => {
    const response = await storefront(post(join()));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "joined",
      id: "a",
      token: "b",
    });
    expect(api.join).toHaveBeenCalledWith(
      scope,
      drop.id,
      "shopper@example.com",
      expect.stringContaining("unsubscribe"),
      expect.any(Number),
    );
  });
  it("emails the confirmation for the product the visitor signed up from", async () => {
    const other = crypto.randomUUID();
    api.readInstallation.mockResolvedValue({
      catalogVersion: "V1_CATALOG",
      state: { drops: [{ ...drop, productIds: [drop.productIds[0], other] }] },
    });
    await storefront(post(join({ productId: other })));
    expect(api.sendConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        scope,
        catalogVersion: "V1_CATALOG",
        productId: other,
        entryId: "a",
        email: "shopper@example.com",
        seed: "b",
      }),
    );
  });
  it("never emails a product outside the drop", async () => {
    await storefront(post(join({ productId: crypto.randomUUID() })));
    expect(api.sendConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ productId: drop.productIds[0] }),
    );
  });
  it("does not re-send to an address already on the list", async () => {
    api.join.mockResolvedValue({ status: "already" });
    await storefront(post(join()));
    expect(api.sendConfirmation).not.toHaveBeenCalled();
  });
  it("silently drops honeypot and too-fast submissions", async () => {
    for (const body of [join({ website: "spam" }), join({ elapsedMs: 10 })]) {
      const response = await storefront(post(body));
      expect(await response.json()).toEqual({ status: "joined" });
    }
    expect(api.join).not.toHaveBeenCalled();
    expect(api.consumeSignupAttempt).not.toHaveBeenCalled();
    expect(api.sendConfirmation).not.toHaveBeenCalled();
  });
  it("rate limits persistently per visitor", async () => {
    api.consumeSignupAttempt.mockResolvedValue(false);
    const response = await storefront(post(join()));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
    expect(api.join).not.toHaveBeenCalled();
  });
  it("rejects signups for unknown, live or disabled drops", async () => {
    for (const drops of [
      [],
      [{ ...drop, startsAt: Date.now() - 1 }],
      [{ ...drop, waitlist: false }],
    ]) {
      api.readInstallation.mockResolvedValue({ state: { drops } });
      const response = await storefront(post(join()));
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "waitlistClosed" });
    }
  });
  it("reports a full Free waitlist", async () => {
    api.join.mockRejectedValue(new DomainError("waitlistFull", 409));
    const response = await storefront(post(join()));
    expect(await response.json()).toEqual({ error: "waitlistFull" });
  });
  it("leaves with the entry credentials", async () => {
    const id = "a".repeat(64),
      token = "b".repeat(64);
    const response = await storefront(
      post({ action: "leave", dropId: drop.id, id, token }),
    );
    expect(await response.json()).toEqual({ status: "left" });
    expect(api.leave).toHaveBeenCalledWith(
      scope,
      drop.id,
      id,
      token,
      expect.any(Number),
    );
  });
});

describe("merchant waitlist API", () => {
  const url = (params: string) =>
    ({
      url: new URL(`https://app/api/waitlist-admin?dropId=${drop.id}${params}`),
    }) as APIContext;
  it("requires a dashboard user", async () => {
    api.tenant.mockRejectedValue(new DomainError("forbidden", 403));
    expect((await adminGet(url(""))).status).toBe(403);
    expect(api.tenant).toHaveBeenCalledWith(true);
  });
  it("refuses CSV export without Pro", async () => {
    api.currentPlan.mockResolvedValue(describePlan({ isFree: true }, "i"));
    const response = await adminGet(url("&format=csv"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "proRequired" });
    expect(api.allEntries).not.toHaveBeenCalled();
  });
  it("exports an uncached, injection-safe CSV on Pro", async () => {
    api.currentPlan.mockResolvedValue(
      describePlan({ isFree: false, billing: { packageName: "pro" } }, "i"),
    );
    api.allEntries.mockResolvedValue([
      {
        email: "=cmd@example.com",
        status: "SUBSCRIBED",
        joinedAt: 0,
        consent: { version: "v1", at: 0 },
      },
    ]);
    const response = await adminGet(url("&format=csv"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/csv");
    const text = await response.text();
    expect(text).toContain(`"'=cmd@example.com","SUBSCRIBED"`);
  });
  it("only touches entries of the merchant's own drops", async () => {
    api.readInstallation.mockResolvedValue({ state: { drops: [] } });
    const response = await adminPost(
      post({ action: "remove", dropId: drop.id, id: "a".repeat(64) }),
    );
    expect(response.status).toBe(409);
    expect(api.removeEntry).not.toHaveBeenCalled();
  });
});
