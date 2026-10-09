import { emailTransmissions } from "@wix/email-transmissions";
import { products, productsV3 } from "@wix/stores";
import { siteProperties } from "@wix/business-tools";
import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import type { Drop } from "../domain/drop";
import { escapeHtml, renderMessage, type Message } from "../domain/message";
import { sha256Hex, type Entry } from "../domain/waitlist";
import { emailEn, type EmailKey } from "../locales/email.en";
import type { Installation, Tenant } from "./storage";

export const DELIVERIES = "@admin14744/drop-engine-for-stores/email_deliveries";
// Storefront callers are visitors; catalog, site and email calls act for the business.
const getProductV1 = auth.elevate(products.getProduct);
const getProductV3 = auth.elevate(productsV3.getProduct);
const getSite = auth.elevate(siteProperties.getSiteProperties);
const send = auth.elevate(emailTransmissions.sendEmailTransmission);
const insert = auth.elevate(items.insert);

export type ProductLink = { name: string; url: string };

const httpUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

// The link always comes from the catalog, never from the request, so a signup
// can't make the store email an arbitrary URL.
export async function productLink(
  catalogVersion: Installation["catalogVersion"],
  productId: string,
): Promise<ProductLink | null> {
  if (catalogVersion === "V1_CATALOG") {
    const { product } = await getProductV1(productId);
    const page = product?.productPageUrl;
    const url =
      page?.base && page.path
        ? httpUrl(page.base.replace(/\/+$/, "") + page.path)
        : null;
    return url ? { name: product?.name || "", url } : null;
  }
  const product = await getProductV3(productId, { fields: ["URL"] });
  const url = httpUrl(product?.url);
  return url ? { name: product?.name || "", url } : null;
}

const format = (key: EmailKey, values: Record<string, string> = {}) =>
  emailEn[key].replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? "");

export function confirmationEmail(
  drop: Drop,
  product: ProductLink,
  siteName: string,
) {
  const values = {
    drop: drop.name,
    product: product.name || drop.name,
    site: siteName || emailEn.site,
    date: new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: drop.timeZone,
      timeZoneName: "short",
    }).format(drop.startsAt),
  };
  const text = (key: EmailKey) => escapeHtml(format(key, values));
  const href = escapeHtml(product.url);
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;padding:32px">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px">${text("heading")}</h1>
<p style="margin:0 0 8px;font-size:16px;line-height:1.5">${text("intro")}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">${text("opens")}</p>
<p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${text("cta")}</a></p>
<p style="margin:0 0 4px;font-size:13px;color:#555">${text("fallback")}</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${href}" style="color:#1a1a1a">${href}</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#777">${text("footer")}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
  return { subject: format("subject", values).slice(0, 200), html };
}

// Email Transmissions wants a GUID; derive one so retries of the same signup don't double-send.
export async function idempotencyKey(seed: string) {
  const hex = await sha256Hex(`waitlist-email\n${seed}`);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(
    (parseInt(hex[16]!, 16) & 0x3) |
    0x8
  ).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export type Confirmation = {
  scope: Tenant;
  catalogVersion: Installation["catalogVersion"];
  drop: Drop;
  productId: string;
  entryId: string;
  email: string;
  // Unique per join, so re-joining after leaving sends a fresh confirmation.
  seed: string;
};
// Best effort: the signup is already stored, so failures are recorded, never thrown.
export async function sendConfirmation(input: Confirmation) {
  const key = await idempotencyKey(input.seed);
  const record = (status: "SENT" | "FAILED" | "SKIPPED", delivery: object) =>
    insert(DELIVERIES, {
      _id: key,
      instanceId: input.scope.instanceId,
      dropId: input.drop.id,
      entryId: input.entryId,
      status,
      delivery: {
        kind: "WAITLIST_CONFIRMATION",
        productId: input.productId,
        at: Date.now(),
        ...delivery,
      },
    }).catch(() => undefined);
  try {
    const [product, site] = await Promise.all([
      productLink(input.catalogVersion, input.productId),
      getSite().catch(() => null),
    ]);
    if (!product) return record("SKIPPED", { reason: "productUrlMissing" });
    const siteName = site?.properties?.siteDisplayName?.trim() || "";
    const { subject, html } = confirmationEmail(input.drop, product, siteName);
    const { emailTransmission } = await send(
      {
        emailSubject: subject,
        emailHtmlContent: html,
        ...(siteName ? { senderName: siteName.slice(0, 50) } : {}),
        toRecipients: [{ emailAddress: input.email }],
        type: "TRANSACTIONAL",
      },
      { idempotencyKey: key },
    );
    return record("SENT", { transmissionId: emailTransmission?._id });
  } catch (error) {
    console.error("Drop Engine confirmation email failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    // Error messages can echo the address, so only the error name is kept.
    return record("FAILED", {
      reason: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

export function broadcastEmail(
  drop: Drop,
  subject: string,
  message: Message,
  siteName: string,
) {
  const footer = escapeHtml(
    format("broadcastFooter", {
      drop: drop.name,
      site: siteName || emailEn.site,
    }),
  );
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;padding:32px">
<tr><td>
${renderMessage(message)}
<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#777">${footer}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
  return { subject: subject.trim().slice(0, 200), html };
}

export type Broadcast = {
  scope: Tenant;
  drop: Drop;
  broadcastId: string;
  subject: string;
  message: Message;
  entries: Entry[];
};
// Each subscriber gets their own transmission, so no one sees another's address.
// Keys are per broadcast and entry: a retried batch never emails anyone twice.
export async function sendBroadcast(input: Broadcast) {
  const site = await getSite().catch(() => null);
  const siteName = site?.properties?.siteDisplayName?.trim() || "";
  const { subject, html } = broadcastEmail(
    input.drop,
    input.subject,
    input.message,
    siteName,
  );
  let sent = 0;
  let failed = 0;
  const deliver = async (entry: Entry) => {
    const key = await idempotencyKey(
      `broadcast\n${input.broadcastId}\n${entry._id}`,
    );
    const record = (status: "SENT" | "FAILED", delivery: object) =>
      insert(DELIVERIES, {
        _id: key,
        instanceId: input.scope.instanceId,
        dropId: input.drop.id,
        entryId: entry._id,
        status,
        delivery: {
          kind: "WAITLIST_BROADCAST",
          broadcastId: input.broadcastId,
          at: Date.now(),
          ...delivery,
        },
      }).catch(() => undefined);
    try {
      const { emailTransmission } = await send(
        {
          emailSubject: subject,
          emailHtmlContent: html,
          ...(siteName ? { senderName: siteName.slice(0, 50) } : {}),
          toRecipients: [{ emailAddress: entry.email }],
          type: "TRANSACTIONAL",
        },
        { idempotencyKey: key },
      );
      sent++;
      await record("SENT", { transmissionId: emailTransmission?._id });
    } catch (error) {
      failed++;
      const reason = error instanceof Error ? error.name : "UnknownError";
      console.error("Drop Engine waitlist email failed", { error: reason });
      await record("FAILED", { reason });
    }
  };
  for (let offset = 0; offset < input.entries.length; offset += 5)
    await Promise.all(input.entries.slice(offset, offset + 5).map(deliver));
  return { sent, failed };
}
