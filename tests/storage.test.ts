import { beforeEach, describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  record: null as Record<string, unknown> | null,
  token: {
    active: true,
    instanceId: "installation-a",
    siteId: "site-a",
    subjectType: "USER",
  },
}));
vi.mock("@wix/essentials", () => ({
  auth: {
    getTokenInfo: async () => fixture.token,
    elevate: <T>(method: T) => method,
  },
}));
vi.mock("@wix/data", () => {
  const filter = () => ({
    values: {} as Record<string, unknown>,
    eq(key: string, value: unknown) {
      this.values[key] = value;
      return this;
    },
  });
  return {
    items: {
      filter,
      query: () => ({
        eq() {
          return this;
        },
        limit() {
          return this;
        },
        find: async () => ({
          items: fixture.record ? [structuredClone(fixture.record)] : [],
        }),
      }),
      insert: async (_collection: string, record: Record<string, unknown>) => {
        if (fixture.record) throw new Error("duplicate");
        fixture.record = structuredClone(record);
        return record;
      },
      update: async (
        _collection: string,
        record: Record<string, unknown>,
        options: { condition: { values: Record<string, unknown> } },
      ) => {
        await Promise.resolve();
        if (
          fixture.record?.revision !== options.condition.values.revision ||
          fixture.record?.instanceId !== options.condition.values.instanceId
        )
          throw new Error("condition");
        fixture.record = structuredClone(record);
        return record;
      },
    },
  };
});
import {
  commit,
  initialize,
  readInstallation,
  tenant,
} from "../src/server/storage";
const scope = { instanceId: "installation-a", siteId: "site-a" };
beforeEach(() => {
  fixture.record = null;
  fixture.token = { active: true, ...scope, subjectType: "USER" };
});
describe("installation authorization and optimistic concurrency", () => {
  it("denies visitor dashboard access", async () => {
    fixture.token.subjectType = "VISITOR";
    await expect(tenant(true)).rejects.toThrow("forbidden");
  });
  it("rejects a record from another site", async () => {
    await initialize(scope, "V1_CATALOG", "UTC");
    await expect(
      readInstallation({ ...scope, siteId: "site-b" }),
    ).rejects.toThrow("forbidden");
  });
  it("allows one concurrent writer and rejects the stale publication", async () => {
    const current = await initialize(scope, "V1_CATALOG", "UTC");
    const outcomes = await Promise.allSettled([
      commit(current, []),
      commit(current, []),
    ]);
    expect(
      outcomes.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = outcomes.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason.message).toBe(
      "conflict",
    );
    expect(fixture.record?.revision).toBe(1);
  });
});
