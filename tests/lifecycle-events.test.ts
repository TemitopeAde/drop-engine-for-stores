import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const wix = vi.hoisted(() => ({
  getAppInstance: vi.fn(),
  installed: vi.fn(),
  purchased: vi.fn(),
  changed: vi.fn(),
}));
vi.mock("@wix/app-management", () => ({
  appInstances: {
    getAppInstance: wix.getAppInstance,
    onAppInstanceInstalled: wix.installed,
    onAppInstancePaidPlanPurchased: wix.purchased,
    onAppInstancePaidPlanChanged: wix.changed,
  },
}));
vi.mock("@wix/essentials", () => ({ auth: { elevate: (fn: unknown) => fn } }));

import { notifyLifecycleEvent } from "../src/backend/notify-lifecycle-event";

const fetchMock = vi.fn();
const purchase = {
  data: {
    vendorProductId: "pro",
    previousVendorProductId: "business",
    cycle: "MONTHLY",
    invoiceId: "invoice-1",
    operationTimeStamp: new Date("2026-10-09T12:00:00Z"),
  },
  metadata: { instanceId: "event-instance" },
};

function email() {
  return JSON.parse(fetchMock.mock.calls[0]?.[1].body);
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({ ok: true });
  wix.getAppInstance.mockResolvedValue({
    instance: { instanceId: "instance-1" },
    site: {
      siteDisplayName: 'Shop <&"Example>',
      url: "https://example.com",
      ownerInfo: { email: "OWNER@EXAMPLE.COM" },
    },
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lifecycle notifications", () => {
  it("sends installations to the shared mailer with escaped site details", async () => {
    await import("../src/extensions/backend/events/app-installed/app-installed");
    expect(wix.installed).toHaveBeenCalledOnce();
    await wix.installed.mock.calls[0]?.[0]({ metadata: purchase.metadata });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://pdfstore-mailer.vercel.app/api/send-email",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(email()).toMatchObject({
      to: "adesiyantope2014@gmail.com",
      appName: "Drop Engine for Stores",
      subject: "App installed",
    });
    expect(email().html).toContain("Shop &lt;&amp;&quot;Example&gt;");
    expect(email().html).toContain("owner@example.com");
    expect(email().html).toContain("instance-1");
  });

  it.each([
    ["IN_PROGRESS", "Free trial started"],
    ["ENDED", "Paid plan purchased"],
    ["NOT_AVAILABLE", "Paid plan purchased"],
  ])("classifies purchases with trial status %s", async (status, subject) => {
    wix.getAppInstance.mockResolvedValue({
      instance: { billing: { freeTrialInfo: { status } } },
    });
    await import("../src/extensions/backend/events/paid-plan-purchased/paid-plan-purchased");
    await wix.purchased.mock.calls[0]?.[0](purchase);
    expect(email().subject).toBe(subject);
    for (const value of [
      "pro",
      "MONTHLY",
      "invoice-1",
      "2026-10-09T12:00:00.000Z",
    ])
      expect(email().html).toContain(value);
  });

  it("labels a downgrade as Plan changed and includes the previous plan", async () => {
    await import("../src/extensions/backend/events/paid-plan-changed/paid-plan-changed");
    await wix.changed.mock.calls[0]?.[0](purchase);
    expect(email().subject).toBe("Plan changed");
    expect(email().html).toContain("Previous plan:</strong> business");
  });

  it("uses event metadata when instance lookup and trial detection fail", async () => {
    wix.getAppInstance.mockRejectedValue(new Error("Wix unavailable"));
    await import("../src/extensions/backend/events/paid-plan-purchased/paid-plan-purchased");
    await expect(
      wix.purchased.mock.calls[0]?.[0](purchase),
    ).resolves.toBeUndefined();
    expect(email().subject).toBe("Paid plan purchased");
    expect(email().html).toContain("event-instance");
  });

  it("handles absent site metadata and invalid dates", async () => {
    wix.getAppInstance.mockResolvedValue({});
    await notifyLifecycleEvent({
      eventType: "APP_INSTALLED",
      occurredAt: new Date("invalid"),
    });
    expect(email().subject).toBe("App installed");
    expect(email().html).not.toContain("Owner email");
    expect(email().html).not.toContain("Invalid Date");
  });

  it.each(["http", "network", "timeout"])(
    "contains %s delivery failures",
    async (failure) => {
      if (failure === "http")
        fetchMock.mockResolvedValue({
          ok: false,
          status: 503,
          text: async () => "Unavailable",
        });
      else fetchMock.mockRejectedValue(new Error(failure));
      await expect(
        notifyLifecycleEvent({ eventType: "APP_INSTALLED" }),
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        "[Drop Engine for Stores] Failed to send lifecycle email",
        expect.any(String),
      );
    },
  );

  it("sets a ten-second delivery timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await notifyLifecycleEvent({ eventType: "APP_INSTALLED" });
    expect(timeout).toHaveBeenCalledWith(10_000);
  });
});
