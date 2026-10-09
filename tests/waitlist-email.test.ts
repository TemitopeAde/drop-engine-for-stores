import { beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import type { Drop } from "../src/domain/drop";

const api = vi.hoisted(() => ({
  tenant: vi.fn(),
  readInstallation: vi.fn(),
  recipientBatch: vi.fn(),
  sendBroadcast: vi.fn(),
}));
vi.mock("../src/server/plan", () => ({ currentPlan: vi.fn() }));
vi.mock("../src/server/email", () => ({ sendBroadcast: api.sendBroadcast }));
vi.mock("../src/server/storage", () => ({
  tenant: api.tenant,
  readInstallation: api.readInstallation,
}));
vi.mock("../src/server/waitlist", () => ({
  allEntries: vi.fn(),
  listEntries: vi.fn(),
  removeEntry: vi.fn(),
  unsubscribe: vi.fn(),
  recipientBatch: api.recipientBatch,
}));
import { POST } from "../src/pages/api/waitlist-admin";

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
const post = (body: unknown) =>
  ({
    request: new Request("https://app/api/waitlist-admin", {
      method: "POST",
      headers: {
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  }) as APIContext;
const email = (overrides: object = {}) => ({
  action: "email",
  dropId: drop.id,
  broadcastId: crypto.randomUUID(),
  subject: "It's live",
  message: { ops: [{ insert: "Shop now\n" }] },
  recipients: { kind: "all" },
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  api.tenant.mockResolvedValue(scope);
  api.readInstallation.mockResolvedValue({ state: { drops: [drop] } });
  api.sendBroadcast.mockResolvedValue({ sent: 2, failed: 0 });
});

describe("merchant waitlist email API", () => {
  it("emails one batch and returns the cursor for the next", async () => {
    const next = { joinedAt: 5, id: "b".repeat(64) };
    const entries = [{ _id: "a" }, { _id: "b" }];
    api.recipientBatch.mockResolvedValue({ entries, skipped: 0, next });
    const body = email();
    const response = await POST(post(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sent: 2,
      failed: 0,
      skipped: 0,
      next,
    });
    expect(api.tenant).toHaveBeenCalledWith(true);
    expect(api.recipientBatch).toHaveBeenCalledWith(scope, drop.id, {
      kind: "all",
    });
    expect(api.sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        drop,
        entries,
        broadcastId: body.broadcastId,
        subject: "It's live",
      }),
    );
  });

  it("reports selected entries that are no longer subscribed as skipped", async () => {
    api.recipientBatch.mockResolvedValue({
      entries: [{ _id: "a" }],
      skipped: 1,
      next: null,
    });
    api.sendBroadcast.mockResolvedValue({ sent: 1, failed: 0 });
    const response = await POST(
      post(
        email({
          recipients: {
            kind: "selected",
            ids: ["a".repeat(64), "c".repeat(64)],
          },
        }),
      ),
    );
    expect(await response.json()).toMatchObject({ sent: 1, skipped: 1 });
  });

  it("refuses empty messages, raw HTML and oversized batches", async () => {
    for (const body of [
      email({ subject: "  " }),
      email({ message: { ops: [{ insert: "\n" }] } }),
      email({ html: "<p>hi</p>" }),
      email({
        recipients: {
          kind: "selected",
          ids: Array.from({ length: 26 }, (_, n) =>
            n.toString(16).padStart(64, "0"),
          ),
        },
      }),
    ]) {
      expect((await POST(post(body))).status).toBe(400);
    }
    expect(api.sendBroadcast).not.toHaveBeenCalled();
  });

  it("never emails the waitlist of another merchant's drop", async () => {
    api.readInstallation.mockResolvedValue({ state: { drops: [] } });
    expect((await POST(post(email()))).status).toBe(409);
    expect(api.recipientBatch).not.toHaveBeenCalled();
    expect(api.sendBroadcast).not.toHaveBeenCalled();
  });
});
