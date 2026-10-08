import { httpClient } from "@wix/essentials";
import { z } from "zod";
import { dropSchema, type DropInput } from "../domain/drop";
import { entryViewSchema } from "../domain/waitlist";
import { en, type MessageKey } from "../locales/en";
import { t } from "../locales/translations";
const catalogSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().optional(),
    }),
  ),
  hasNext: z.boolean(),
  cursor: z.string().optional(),
});
const responseSchema = catalogSchema.extend({
  drops: z.array(dropSchema),
  revision: z.number(),
  serverNow: z.number(),
  timeZone: z.string(),
  siteName: z.string().optional(),
  catalogVersion: z.enum(["V1_CATALOG", "V3_CATALOG"]),
});
export type CatalogPage = z.infer<typeof catalogSchema>;
export type DashboardData = z.infer<typeof responseSchema>;
const endpoint = new URL(/* @vite-ignore */ "/api/drops", import.meta.url);
function failure(body: unknown): never {
  const parsed = z.object({ error: z.string() }).safeParse(body);
  const key =
    parsed.success && parsed.data.error in en
      ? (parsed.data.error as MessageKey)
      : "failed";
  throw new Error(t(key));
}
async function call(url: URL, init?: RequestInit) {
  const response = await httpClient.fetchWithAuth(url.href, init);
  const body: unknown = await response.json();
  if (!response.ok) failure(body);
  return body;
}
export async function loadDashboard(
  page = 0,
  cursor?: string,
  signal?: AbortSignal,
) {
  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  if (cursor) url.searchParams.set("cursor", cursor);
  return responseSchema.parse(await call(url, { signal }));
}
export async function loadCatalog(
  page: number,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  const url = new URL(endpoint);
  url.searchParams.set("catalogOnly", "true");
  url.searchParams.set("page", String(page));
  if (cursor) url.searchParams.set("cursor", cursor);
  return catalogSchema.parse(await call(url, { signal }));
}
export type Command = {
  action: "save" | "publish" | "cancel" | "archive" | "restore" | "duplicate";
  id?: string;
  version?: number;
  input?: DropInput;
};
export async function mutate(command: Command) {
  await call(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
}
const waitlistEndpoint = new URL(
  /* @vite-ignore */ "/api/waitlist-admin",
  import.meta.url,
);
const waitlistPageSchema = z.object({
  entries: z.array(entryViewSchema),
  total: z.number(),
  subscribed: z.number(),
  page: z.number(),
  hasNext: z.boolean(),
  pro: z.boolean(),
  used: z.number(),
  cap: z.number().nullable(),
});
export type WaitlistPage = z.infer<typeof waitlistPageSchema>;
export async function loadWaitlist(
  dropId: string,
  page: number,
  signal?: AbortSignal,
) {
  const url = new URL(waitlistEndpoint);
  url.searchParams.set("dropId", dropId);
  url.searchParams.set("page", String(page));
  return waitlistPageSchema.parse(await call(url, { signal }));
}
export async function updateEntry(
  action: "unsubscribe" | "remove",
  dropId: string,
  id: string,
) {
  await call(waitlistEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, dropId, id }),
  });
}
export async function exportWaitlist(dropId: string) {
  const url = new URL(waitlistEndpoint);
  url.searchParams.set("dropId", dropId);
  url.searchParams.set("format", "csv");
  const response = await httpClient.fetchWithAuth(url.href);
  if (!response.ok) failure(await response.json().catch(() => null));
  return response.blob();
}
