import { describe, it, expect } from "vitest";
import {
  assertPublishable,
  blocked,
  controlsPurchasing,
  dropInputSchema,
  phase,
  replaceDrop,
  schedule,
  startDrop,
  type Drop,
} from "../src/domain/drop";
import { acceptsSignups } from "../src/domain/waitlist";
import { MAX_PRODUCTS_PER_DROP } from "../src/domain/limits";
const base: Drop = {
  id: "a937c9e8-a028-40f8-9a07-0f173b081c70",
  name: "Launch",
  productIds: ["64a99fa7-29a1-46e5-9018-26b340c28682"],
  localStart: "2026-10-09T12:00",
  localEnd: "2026-10-09T13:00",
  timeZone: "UTC",
  endBehavior: "RESTORE",
  startsAt: 1000,
  endsAt: 2000,
  updatedAt: 500,
  version: 1,
  status: "PUBLISHED",
};
describe("authoritative launch window", () => {
  it("blocks before start, opens exactly at start, restores exactly at end", () => {
    expect(blocked(base, 999)).toBe(true);
    expect(blocked(base, 1000)).toBe(false);
    expect(blocked(base, 1999)).toBe(false);
    expect(blocked(base, 2000)).toBe(false);
    expect(phase(base, 2000)).toBe("ENDED");
    expect(controlsPurchasing(base, 2000)).toBe(false);
  });
  it("continues blocking after an explicitly closed end", () => {
    const drop = { ...base, endBehavior: "BLOCK" as const };
    expect(blocked(drop, 2000)).toBe(true);
    expect(controlsPurchasing(drop, 10000)).toBe(true);
  });
  it.each(["DRAFT", "CANCELLED", "ARCHIVED"] as const)(
    "never gates %s drops",
    (status) => {
      expect(blocked({ ...base, status }, 999)).toBe(false);
    },
  );
  it("prevents a second active drop even if its launch window is later", () => {
    const second = {
      ...base,
      id: "3f3ac9ea-e7f5-4532-9ad2-644a2105d54d",
      startsAt: 3000,
      endsAt: 4000,
    };
    expect(() => replaceDrop([base], second, 500)).toThrow("activeLimit");
    expect(
      replaceDrop([{ ...base, status: "CANCELLED" }], second, 500),
    ).toHaveLength(2);
  });
  it("ended continued-blocking drops retain the active slot", () => {
    expect(() =>
      replaceDrop(
        [{ ...base, endBehavior: "BLOCK" }],
        { ...base, id: crypto.randomUUID(), startsAt: 4000, endsAt: 5000 },
        3000,
      ),
    ).toThrow("activeLimit");
  });
});
describe("one drop per product", () => {
  const other = {
    ...base,
    id: crypto.randomUUID(),
    status: "DRAFT" as const,
  };
  it("rejects a product already held by a draft or gating drop", () => {
    expect(() =>
      replaceDrop([{ ...base, status: "DRAFT" }], other, 500),
    ).toThrow("productInUse");
    expect(() =>
      replaceDrop([{ ...base, endBehavior: "BLOCK" }], other, 3000),
    ).toThrow("productInUse");
  });
  it("releases products from cancelled, archived and restored drops", () => {
    for (const status of ["CANCELLED", "ARCHIVED"] as const)
      expect(replaceDrop([{ ...base, status }], other, 500)).toHaveLength(2);
    expect(replaceDrop([base], other, 3000)).toHaveLength(2);
  });
  it("allows the same drop to be saved again", () => {
    expect(replaceDrop([base], { ...base, version: 2 }, 500)).toHaveLength(1);
  });
});
describe("merchant schedule validation", () => {
  it("rejects publication at or after the end while allowing a future end", () => {
    expect(() => assertPublishable(2000, 2000)).toThrow("expiredSchedule");
    expect(() => assertPublishable(2000, 2001)).toThrow("expiredSchedule");
    expect(() => assertPublishable(2000, 1999)).not.toThrow();
  });
  it("converts IANA local time to UTC", () => {
    expect(
      schedule({ ...base, timeZone: "America/Los_Angeles" }).startsAt,
    ).toBe(Date.parse("2026-10-09T19:00:00Z"));
  });
  it.each(["2026-03-08T02:30", "2026-11-01T01:30"])(
    "rejects skipped or ambiguous DST time %s",
    (localStart) => {
      expect(() =>
        schedule({
          ...base,
          localStart,
          localEnd: "2026-11-02T12:00",
          timeZone: "America/Los_Angeles",
        }),
      ).toThrow("invalidSchedule");
    },
  );
  it("rejects reversed ranges and invalid zones", () => {
    expect(() => schedule({ ...base, localEnd: base.localStart })).toThrow(
      "invalidSchedule",
    );
    expect(() => schedule({ ...base, timeZone: "Mars/Base" })).toThrow(
      "invalidSchedule",
    );
  });
  it("rejects empty and repeated product selections", () => {
    expect(dropInputSchema.safeParse({ ...base, productIds: [] }).success).toBe(
      false,
    );
    expect(
      dropInputSchema.safeParse({
        ...base,
        productIds: [...base.productIds, ...base.productIds],
      }).success,
    ).toBe(false);
  });
  it("validates and persists 10,000 selected products", () => {
    const drop = {
      ...base,
      productIds: Array.from({ length: MAX_PRODUCTS_PER_DROP }, () =>
        crypto.randomUUID(),
      ),
    };
    expect(dropInputSchema.safeParse(drop).success).toBe(true);
    expect(replaceDrop([], drop, 500)[0].productIds).toHaveLength(
      MAX_PRODUCTS_PER_DROP,
    );
    expect(
      dropInputSchema.safeParse({
        ...drop,
        productIds: [...drop.productIds, crypto.randomUUID()],
      }).success,
    ).toBe(false);
    expect(() =>
      replaceDrop(
        [
          {
            ...drop,
            id: crypto.randomUUID(),
            productIds: drop.productIds.map(() => crypto.randomUUID()),
            status: "DRAFT",
          },
        ],
        drop,
        500,
      ),
    ).toThrow("storageLimit");
  });
});

describe("plan active-drop limits", () => {
  const live = (id: string) => ({
    ...base,
    id,
    startsAt: 0,
    endsAt: 10_000,
    productIds: [crypto.randomUUID()],
  });
  it("allows up to the plan limit and never limits Business", () => {
    const three = [live("a"), live("b")];
    expect(replaceDrop(three, live("c"), 500, 3)).toHaveLength(3);
    expect(() => replaceDrop([...three, live("c")], live("d"), 500, 3)).toThrow(
      "activeLimit",
    );
    expect(
      replaceDrop([...three, live("c")], live("d"), 500, null),
    ).toHaveLength(4);
  });
});

describe("manual start", () => {
  it.each([
    "2026-10-09T19:00:45.123Z",
    "2026-03-08T09:59:59.123Z",
    "2026-03-08T10:00:00.123Z",
    "2026-11-01T08:30:45.123Z",
    "2026-11-01T09:30:45.123Z",
  ])("preserves the exact instant when saved again at %s", (instant) => {
    const now = Date.parse(instant);
    const drop: Drop = {
      ...base,
      timeZone: "America/Los_Angeles",
      startsAt: Date.parse("2026-12-01T20:00:00Z"),
      endsAt: Date.parse("2026-12-01T21:00:00Z"),
      localStart: "2026-12-01T12:00",
      localEnd: "2026-12-01T13:00",
    };
    const started = startDrop(drop, now);
    expect(started.startsAt).toBe(now);
    expect(started.localStart).toMatch(/:45\.123$|:59\.123$|:00\.123$/);
    expect(schedule(dropInputSchema.parse(started), started)).toEqual({
      startsAt: now,
      endsAt: drop.endsAt,
    });
    expect(started).toEqual({
      ...drop,
      startsAt: now,
      localStart: started.localStart,
      version: drop.version + 1,
      updatedAt: now,
    });
    expect(blocked(drop, now)).toBe(true);
    expect(acceptsSignups(drop, now)).toBe(true);
    expect(phase(started, now)).toBe("LIVE");
    expect(blocked(started, now)).toBe(false);
    expect(acceptsSignups(started, now)).toBe(false);
  });
  it("still rejects newly edited ambiguous local times", () => {
    const started = startDrop(
      {
        ...base,
        timeZone: "America/Los_Angeles",
        startsAt: Date.parse("2026-12-01T20:00Z"),
        endsAt: Date.parse("2026-12-01T21:00Z"),
      },
      Date.parse("2026-11-01T09:30:45.123Z"),
    );
    expect(() =>
      schedule({ ...started, localStart: "2026-11-01T01:45" }, started),
    ).toThrow("invalidSchedule");
  });
});
