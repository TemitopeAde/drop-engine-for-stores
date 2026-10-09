import { describe, expect, it, vi } from "vitest";
import type { Drop } from "../src/domain/drop";
import { messageSchema, renderMessage } from "../src/domain/message";
import type { Entry } from "../src/domain/waitlist";

const sdk = vi.hoisted(() => ({
  getSite: vi.fn(),
  send: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@wix/essentials", () => ({
  auth: { elevate: (fn: unknown) => fn },
}));
vi.mock("@wix/stores", () => ({
  products: { getProduct: vi.fn() },
  productsV3: { getProduct: vi.fn() },
}));
vi.mock("@wix/business-tools", () => ({
  siteProperties: { getSiteProperties: sdk.getSite },
}));
vi.mock("@wix/email-transmissions", () => ({
  emailTransmissions: { sendEmailTransmission: sdk.send },
}));
vi.mock("@wix/data", () => ({ items: { insert: sdk.insert } }));
import { broadcastEmail, sendBroadcast } from "../src/server/email";

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
const entry = (n: number): Entry => ({
  _id: n.toString(16).padStart(64, "0"),
  instanceId: "instance",
  siteId: "site",
  dropId: drop.id,
  email: `shopper${n}@example.com`,
  status: "SUBSCRIBED",
  joinedAt: n,
  tokenHash: "f".repeat(64),
  consent: { version: "v1", text: "ok", at: n, source: "product-page" },
});

describe("waitlist message rendering", () => {
  it("renders formatting, headings and lists from a Quill Delta", () => {
    const html = renderMessage({
      ops: [
        { insert: "Launch day" },
        { insert: "\n", attributes: { header: 2 } },
        { insert: "It's " },
        { insert: "live", attributes: { bold: true } },
        { insert: " now.\nFirst" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "Second" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "Shop", attributes: { link: "https://shop.example/drop" } },
        { insert: "\n\n\n" },
      ],
    });
    expect(html).toContain(">Launch day</h2>");
    expect(html).toContain("It&#39;s <strong>live</strong> now.");
    expect(html.match(/<ul /g)).toHaveLength(1);
    expect(html).toContain("<li>First</li>\n<li>Second</li>\n</ul>");
    expect(html).toContain('href="https://shop.example/drop"');
    // Quill's trailing newlines don't pad the email with blank paragraphs.
    expect(html.trimEnd().endsWith("</a></p>")).toBe(true);
  });

  it("escapes text and drops unsafe links and embeds", () => {
    const html = renderMessage({
      ops: [
        { insert: "<script>alert(1)</script>" },
        { insert: "click", attributes: { link: "javascript:alert(1)" } },
        { insert: { image: "https://evil.example/x.png" } },
        { insert: "\n" },
      ],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
  });

  it("rejects empty messages and ignores unknown formats", () => {
    expect(messageSchema.safeParse({ ops: [{ insert: "  \n" }] }).success).toBe(
      false,
    );
    const parsed = messageSchema.parse({
      ops: [{ insert: "Hi", attributes: { color: "red", header: 1 } }],
    });
    expect(renderMessage(parsed)).toBe(
      '<p style="margin:0 0 16px;font-size:16px;line-height:1.5">Hi</p>',
    );
  });
});

describe("waitlist broadcast email", () => {
  it("wraps the message with an escaped footer naming the drop", () => {
    const { subject, html } = broadcastEmail(
      drop,
      "  It's live  ",
      { ops: [{ insert: "Hello\n" }] },
      "Acme",
    );
    expect(subject).toBe("It's live");
    expect(html).toContain(">Hello</p>");
    expect(html).toContain("waitlist for Summer &lt;Drop&gt; on Acme");
  });

  it("sends each subscriber their own idempotent email and records failures", async () => {
    sdk.getSite.mockResolvedValue({
      properties: { siteDisplayName: "Acme" },
    });
    sdk.insert.mockResolvedValue({});
    sdk.send.mockImplementation(async ({ toRecipients }) => {
      if (toRecipients[0].emailAddress === "shopper2@example.com")
        throw new Error("boom");
      return { emailTransmission: { _id: "t" } };
    });
    const input = {
      scope: { instanceId: "instance", siteId: "site" },
      drop,
      broadcastId: crypto.randomUUID(),
      subject: "Live",
      message: { ops: [{ insert: "Hello\n" }] },
      entries: [entry(1), entry(2), entry(3)],
    };
    expect(await sendBroadcast(input)).toEqual({ sent: 2, failed: 1 });
    expect(sdk.send).toHaveBeenCalledTimes(3);
    for (const [transmission] of sdk.send.mock.calls) {
      expect(transmission.toRecipients).toHaveLength(1);
      expect(transmission.type).toBe("TRANSACTIONAL");
    }
    const keys = sdk.send.mock.calls.map(
      ([, options]) => options.idempotencyKey,
    );
    expect(new Set(keys).size).toBe(3);
    const statuses = sdk.insert.mock.calls.map(([, record]) => record.status);
    expect(statuses.sort()).toEqual(["FAILED", "SENT", "SENT"]);

    // Retrying the same broadcast reuses the same keys, so nobody is emailed twice.
    sdk.send.mockClear();
    await sendBroadcast(input);
    expect(
      sdk.send.mock.calls.map(([, options]) => options.idempotencyKey),
    ).toEqual(keys);
  });
});
