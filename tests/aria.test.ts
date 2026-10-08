import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Installation } from "../src/server/storage";
const state = vi.hoisted(() => ({
  read: vi.fn(),
  record: null as Installation | null,
}));
vi.mock("../src/server/storage", () => ({ readForValidation: state.read }));
import { runAriaTool } from "../src/server/aria";
const metadata = {
  instanceId: "a937c9e8-a028-40f8-9a07-0f173b081c70",
  identity: { wixUserId: "64a99fa7-29a1-46e5-9018-26b340c28682" },
};
const productId = "4c8379c5-7609-4ae9-91ad-a22a052f1aa9";
beforeEach(() => {
  state.read.mockReset();
  const drop = {
    id: crypto.randomUUID(),
    name: "Launch",
    productIds: [productId],
    localStart: "",
    localEnd: "",
    timeZone: "UTC",
    startsAt: Date.now() + 10000,
    endsAt: Date.now() + 20000,
    endBehavior: "RESTORE" as const,
    version: 1,
    updatedAt: 100,
    status: "PUBLISHED" as const,
  };
  state.record = {
    _id: metadata.instanceId,
    instanceId: metadata.instanceId,
    siteId: "site-a",
    catalogVersion: "V3_CATALOG",
    timeZone: "UTC",
    revision: 1,
    state: {
      drops: [
        drop,
        {
          ...drop,
          id: crypto.randomUUID(),
          name: "Private draft",
          status: "DRAFT",
        },
      ],
    },
  };
  state.read.mockResolvedValue(state.record);
});
describe("Aria published launch tools", () => {
  it("uses the trusted installation and excludes drafts and private records", async () => {
    const result = await runAriaTool("list-published-drops", {}, metadata);
    expect(state.read).toHaveBeenCalledWith(metadata.instanceId);
    expect("drops" in result && result.drops).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain("Private draft");
    expect(JSON.stringify(result)).not.toContain("site-a");
  });
  it("returns current gating status for the selected product", async () => {
    const result = await runAriaTool(
      "get-product-launch",
      { productId },
      metadata,
    );
    expect("blocked" in result && result.blocked).toBe(true);
  });
  it("rejects forged tenant fields, malformed UUIDs and unknown tools before reading", async () => {
    await expect(
      runAriaTool(
        "get-product-launch",
        { productId, instanceId: "other" },
        metadata,
      ),
    ).rejects.toThrow();
    await expect(
      runAriaTool("get-product-launch", { productId: "invalid" }, metadata),
    ).rejects.toThrow();
    await expect(runAriaTool("publish", {}, metadata)).rejects.toThrow(
      "unknownTool",
    );
    expect(state.read).not.toHaveBeenCalled();
  });
  it("rejects member/anonymous invocations without trusted collaborator identity", async () => {
    await expect(
      runAriaTool(
        "list-published-drops",
        {},
        { ...metadata, identity: { memberId: productId } },
      ),
    ).rejects.toThrow();
    expect(state.read).not.toHaveBeenCalled();
  });
});
