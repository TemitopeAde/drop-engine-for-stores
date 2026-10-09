import { describe, expect, it, vi } from "vitest";
import type { Drop } from "../src/domain/drop";

const sdk = vi.hoisted(() => ({
  getProductV1: vi.fn(),
  getProductV3: vi.fn(),
  getSite: vi.fn(),
  send: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@wix/essentials", () => ({
  auth: { elevate: (fn: unknown) => fn },
}));
vi.mock("@wix/stores", () => ({
  products: { getProduct: sdk.getProductV1 },
  productsV3: { getProduct: sdk.getProductV3 },
}));
vi.mock("@wix/business-tools", () => ({
  siteProperties: { getSiteProperties: sdk.getSite },
}));
vi.mock("@wix/email-transmissions", () => ({
  emailTransmissions: { sendEmailTransmission: sdk.send },
}));
vi.mock("@wix/data", () => ({ items: { insert: sdk.insert } }));
import {
  confirmationEmail,
  idempotencyKey,
  productLink,
  sendConfirmation,
} from "../src/server/email";

const drop: Drop = {
  id: crypto.randomUUID(),
  name: "Summer <Drop>",
  productIds: [crypto.randomUUID()],
  localStart: "2026-11-01T10:00",
  localEnd: "2026-11-02T10:00",
  timeZone: "UTC",
  endBehavior: "RESTORE",
  version: 1,
  startsAt: Date.UTC(2026, 10, 1, 10),
  endsAt: Date.UTC(2026, 10, 2, 10),
  status: "PUBLISHED",
  updatedAt: 0,
};
const scope = { instanceId: "instance", siteId: "site" };

describe("waitlist confirmation email", () => {
  it("builds the product page URL from either catalog", async () => {
    sdk.getProductV1.mockResolvedValue({
      product: {
        name: "Tee",
        productPageUrl: {
          base: "https://shop.example/",
          path: "/product-page/tee",
        },
      },
    });
    expect(await productLink("V1_CATALOG", "p")).toEqual({
      name: "Tee",
      url: "https://shop.example/product-page/tee",
    });
    sdk.getProductV3.mockResolvedValue({
      name: "Tee",
      url: "https://shop.example/product-page/tee",
    });
    expect(await productLink("V3_CATALOG", "p")).toEqual({
      name: "Tee",
      url: "https://shop.example/product-page/tee",
    });
    expect(sdk.getProductV3).toHaveBeenCalledWith("p", { fields: ["URL"] });
    sdk.getProductV3.mockResolvedValue({
      name: "Tee",
      url: "javascript:alert(1)",
    });
    expect(await productLink("V3_CATALOG", "p")).toBeNull();
  });
  it("links the product page and escapes merchant text", () => {
    const { subject, html } = confirmationEmail(
      drop,
      { name: "Tee", url: "https://shop.example/p?a=1&b=2" },
      "Shop",
    );
    expect(subject).toBe("You're on the waitlist for Summer <Drop>");
    expect(html).toContain('href="https://shop.example/p?a=1&amp;b=2"');
    expect(html).toContain("Summer &lt;Drop&gt;");
    expect(html).not.toContain("<Drop>");
    expect(html).toContain("View Tee");
    expect(html).toContain("November 1, 2026");
  });
  it("derives a stable GUID idempotency key", async () => {
    const key = await idempotencyKey("token");
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(await idempotencyKey("token")).toBe(key);
    expect(await idempotencyKey("other")).not.toBe(key);
  });
  it("sends a transactional email and records the delivery", async () => {
    sdk.getProductV3.mockResolvedValue({
      name: "Tee",
      url: "https://shop.example/tee",
    });
    sdk.getSite.mockResolvedValue({ properties: { siteDisplayName: "Shop" } });
    sdk.send.mockResolvedValue({ emailTransmission: { _id: "t1" } });
    sdk.insert.mockResolvedValue({});
    const input = {
      scope,
      catalogVersion: "V3_CATALOG" as const,
      drop,
      productId: "p",
      entryId: "e",
      email: "shopper@example.com",
      seed: "token",
    };
    await sendConfirmation(input);
    expect(sdk.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TRANSACTIONAL",
        senderName: "Shop",
        toRecipients: [{ emailAddress: "shopper@example.com" }],
        emailHtmlContent: expect.stringContaining("https://shop.example/tee"),
      }),
      { idempotencyKey: await idempotencyKey("token") },
    );
    expect(sdk.insert).toHaveBeenCalledWith(
      expect.stringContaining("email_deliveries"),
      expect.objectContaining({
        status: "SENT",
        entryId: "e",
        delivery: expect.objectContaining({ transmissionId: "t1" }),
      }),
    );
  });
  it("never fails the signup when sending fails", async () => {
    sdk.getProductV3.mockResolvedValue({
      name: "Tee",
      url: "https://shop.example/tee",
    });
    sdk.getSite.mockResolvedValue({ properties: {} });
    sdk.send.mockRejectedValue(new Error("OUT_OF_QUOTA shopper@example.com"));
    sdk.insert.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      sendConfirmation({
        scope,
        catalogVersion: "V3_CATALOG",
        drop,
        productId: "p",
        entryId: "e",
        email: "shopper@example.com",
        seed: "token-2",
      }),
    ).resolves.not.toThrow();
    const record = sdk.insert.mock.calls.at(-1)![1];
    expect(record.status).toBe("FAILED");
    expect(JSON.stringify(record)).not.toContain("shopper@example.com");
  });
});
