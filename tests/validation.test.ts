import { beforeEach, describe, expect, it, vi } from "vitest";
import type { validations } from "@wix/ecom/service-plugins";
import type { Installation } from "../src/server/storage";
type ValidationHandler = NonNullable<
  Parameters<typeof validations.provideHandlers>[0]["getValidationViolations"]
>;
type ValidationPayload = Parameters<ValidationHandler>[0];
const state = vi.hoisted(() => ({
  handler: undefined as ValidationHandler | undefined,
  installation: null as Installation | null,
  fail: false,
}));
vi.mock("@wix/ecom/service-plugins", () => ({
  validations: {
    Severity: { ERROR: "ERROR" },
    NameInLineItem: { LINE_ITEM_DEFAULT: "LINE_ITEM_DEFAULT" },
    NameInOther: { OTHER_DEFAULT: "OTHER_DEFAULT" },
    provideHandlers: (handlers: {
      getValidationViolations: typeof state.handler;
    }) => {
      state.handler = handlers.getValidationViolations;
    },
  },
}));
vi.mock("../src/server/storage", () => ({
  readForValidation: async () => {
    if (state.fail) throw new Error("outage");
    return state.installation;
  },
}));
import "../src/extensions/backend/service-plugins/drop-validation/drop-validation";
const payload: ValidationPayload = {
  metadata: { instanceId: "instance-a" },
  request: {
    validationInfo: {
      lineItems: [
        {
          _id: "line-a",
          catalogReference: {
            appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e",
            catalogItemId: "product-a",
          },
        },
        {
          _id: "line-b",
          catalogReference: { appId: "other-app", catalogItemId: "product-a" },
        },
      ],
    },
  },
};
beforeEach(() => {
  state.fail = false;
  state.installation = {
    _id: "instance-a",
    instanceId: "instance-a",
    siteId: "site-a",
    revision: 1,
    catalogVersion: "V3_CATALOG",
    timeZone: "UTC",
    state: {
      drops: [
        {
          id: "drop-a",
          name: "Test",
          productIds: ["product-a"],
          startsAt: Date.now() + 60_000,
          endsAt: Date.now() + 120_000,
          localStart: "",
          localEnd: "",
          timeZone: "UTC",
          endBehavior: "RESTORE",
          status: "PUBLISHED",
          version: 1,
          updatedAt: Date.now(),
        },
      ],
    },
  };
});
describe("registered eCommerce validation handler", () => {
  it("targets the matching Stores line and ignores other catalog apps", async () => {
    const result = await state.handler!(payload);
    expect(result.violations).toHaveLength(1);
    expect(result.violations?.[0].target?.lineItem?._id).toBe("line-a");
    expect(result.violations?.[0].severity).toBe("ERROR");
  });
  it("returns an explicit checkout error on storage outage", async () => {
    state.fail = true;
    const result = await state.handler!(payload);
    expect(result.violations?.[0].target?.other?.name).toBe("OTHER_DEFAULT");
  });
  it("returns an explicit error when trusted metadata is missing", async () => {
    expect(
      (await state.handler!({ ...payload, metadata: {} })).violations?.[0]
        .severity,
    ).toBe("ERROR");
  });
  it("does not gate installations with no published drops", async () => {
    state.installation = null;
    expect((await state.handler!(payload)).violations).toEqual([]);
  });
});
