import { httpClient } from "@wix/essentials";
import { z } from "zod";
import { dropSchema, type DropInput } from "../domain/drop";
import { en, t, type MessageKey } from "../locales/en";
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
  catalogVersion: z.enum(["V1_CATALOG", "V3_CATALOG"]),
});
export type CatalogPage = z.infer<typeof catalogSchema>;
export type DashboardData = z.infer<typeof responseSchema>;
const endpoint = new URL(/* @vite-ignore */ "/api/drops", import.meta.url);
async function call(url: URL, init?: RequestInit) {
  const response = await httpClient.fetchWithAuth(url.href, init);
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = z.object({ error: z.string() }).safeParse(body);
    const key =
      parsed.success && parsed.data.error in en
        ? (parsed.data.error as MessageKey)
        : "failed";
    throw new Error(t(key));
  }
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
