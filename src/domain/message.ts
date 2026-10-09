import { z } from "zod";

// Merchant-written waitlist emails travel as a Quill Delta, never as HTML: the
// server renders every tag itself, so a crafted request can't inject markup.
export const MAX_MESSAGE_CHARS = 20_000;
export const MAX_SUBJECT_CHARS = 200;
// Formats the composer enables; anything else in a Delta is ignored when rendering.
export const messageFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "link",
];

const attributesSchema = z.object({
  bold: z.boolean().optional().catch(undefined),
  italic: z.boolean().optional().catch(undefined),
  underline: z.boolean().optional().catch(undefined),
  link: z.string().max(2048).optional().catch(undefined),
  header: z
    .union([z.literal(2), z.literal(3)])
    .optional()
    .catch(undefined),
  list: z.enum(["ordered", "bullet"]).optional().catch(undefined),
});
const opSchema = z.object({
  // Embeds (images, video) are objects; the composer disables them and the renderer skips them.
  insert: z.union([z.string(), z.record(z.string(), z.unknown())]),
  attributes: attributesSchema.optional(),
});
type Delta = { ops: z.infer<typeof opSchema>[] };
export const messageSchema = z
  .object({ ops: z.array(opSchema).min(1).max(5000) })
  .refine(
    (delta) => {
      const length = messageText(delta).length;
      return length > 0 && length <= MAX_MESSAGE_CHARS;
    },
    { message: "messageLength" },
  );
export type Message = z.infer<typeof messageSchema>;
type Attributes = z.infer<typeof attributesSchema>;

const textOf = (delta: Delta) =>
  delta.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
export const messageText = (delta: Delta) => textOf(delta).trim();

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

// Only web and mail links survive; javascript:, data: and relative URLs are dropped.
export function safeHref(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:", "mailto:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const text = "font-size:16px;line-height:1.5";
const inline = (value: string, attributes: Attributes = {}) => {
  let html = escapeHtml(value);
  if (attributes.bold) html = `<strong>${html}</strong>`;
  if (attributes.italic) html = `<em>${html}</em>`;
  if (attributes.underline) html = `<u>${html}</u>`;
  const href = safeHref(attributes.link);
  if (href)
    html = `<a href="${escapeHtml(href)}" style="color:#1a1a1a;text-decoration:underline">${html}</a>`;
  return html;
};

type Line = { html: string; attributes: Attributes };
// In a Delta, block formats (header, list) sit on the newline that ends each line.
function lines(delta: Delta) {
  const result: Line[] = [];
  let current = "";
  for (const op of delta.ops) {
    if (typeof op.insert !== "string") continue;
    const parts = op.insert.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) {
        result.push({ html: current, attributes: op.attributes ?? {} });
        current = "";
      }
      if (part) current += inline(part, op.attributes);
    });
  }
  if (current) result.push({ html: current, attributes: {} });
  // Quill always ends with a newline; trailing blank lines would pad the email.
  while (
    result.length &&
    !result.at(-1)!.html &&
    !result.at(-1)!.attributes.list
  )
    result.pop();
  return result;
}

export function renderMessage(delta: Delta) {
  const out: string[] = [];
  let list: "ordered" | "bullet" | undefined;
  const closeList = () => {
    if (list) out.push(list === "ordered" ? "</ol>" : "</ul>");
    list = undefined;
  };
  for (const line of lines(delta)) {
    const { header, list: kind } = line.attributes;
    if (kind) {
      if (kind !== list) {
        closeList();
        out.push(
          `<${kind === "ordered" ? "ol" : "ul"} style="margin:0 0 16px;padding-inline-start:24px;${text}">`,
        );
        list = kind;
      }
      out.push(`<li>${line.html || "<br>"}</li>`);
      continue;
    }
    closeList();
    if (header === 2)
      out.push(`<h2 style="margin:0 0 12px;font-size:20px">${line.html}</h2>`);
    else if (header === 3)
      out.push(`<h3 style="margin:0 0 8px;font-size:17px">${line.html}</h3>`);
    else
      out.push(`<p style="margin:0 0 16px;${text}">${line.html || "<br>"}</p>`);
  }
  closeList();
  return out.join("\n");
}
