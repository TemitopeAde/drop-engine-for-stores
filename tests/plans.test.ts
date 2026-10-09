import { describe, expect, it } from "vitest";
import {
  APP_ID,
  describePlan,
  PLAN_LIMITS,
  planFromInstance,
  upgradeUrl,
} from "../src/domain/plans";

describe("plans", () => {
  it("maps the app instance to Basic, Pro or Business", () => {
    expect(planFromInstance(undefined)).toBe("basic");
    expect(planFromInstance({ isFree: true })).toBe("basic");
    expect(
      planFromInstance({ isFree: false, billing: { packageName: "pro" } }),
    ).toBe("pro");
    expect(
      planFromInstance({
        isFree: false,
        billing: { packageName: " Business " },
      }),
    ).toBe("business");
  });
  it("never downgrades a paying merchant with an unknown package to Basic", () => {
    expect(
      planFromInstance({ isFree: false, billing: { packageName: "renamed" } }),
    ).toBe("pro");
  });
  it("keeps the agreed limits", () => {
    expect(PLAN_LIMITS.basic).toEqual({
      activeDrops: 1,
      waitlistSignups: 200,
      productsPerDrop: 1,
      csvExport: false,
    });
    expect(PLAN_LIMITS.pro).toMatchObject({
      activeDrops: 3,
      waitlistSignups: 5000,
      productsPerDrop: 50,
      csvExport: true,
    });
    expect(PLAN_LIMITS.business).toMatchObject({
      activeDrops: null,
      waitlistSignups: null,
      csvExport: true,
    });
  });
  it("reports trial availability and an in-progress trial", () => {
    const basic = describePlan(
      { isFree: true, freeTrialAvailable: true },
      "instance",
    );
    expect(basic.trial).toEqual({ available: true, status: null });
    const trial = describePlan(
      {
        isFree: false,
        billing: {
          packageName: "pro",
          freeTrialInfo: { status: "IN_PROGRESS" },
        },
      },
      "instance",
    );
    expect(trial.id).toBe("pro");
    expect(trial.trial.status).toBe("IN_PROGRESS");
  });
  it("links to Wix's pricing page for this installation", () => {
    expect(upgradeUrl("a b")).toBe(
      `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=a%20b`,
    );
  });
});
