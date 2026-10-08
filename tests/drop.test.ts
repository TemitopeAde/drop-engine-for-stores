import { describe, it, expect } from "vitest";
import {
  assertPublishable,
  blocked,
  controlsPurchasing,
  dropInputSchema,
  phase,
  replaceDrop,
  schedule,
  type Drop,
} from "../src/domain/drop";
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
});
