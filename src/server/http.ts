import { ZodError } from "zod";
import { DomainError } from "../domain/drop";
import { MAX_DROP_STATE_BYTES } from "../domain/limits";
export function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function handle(operation: () => Promise<unknown>) {
  try {
    const value = await operation();
    // Non-JSON responses (e.g. CSV exports) are returned as built.
    return value instanceof Response ? value : json(value);
  } catch (error) {
    if (error instanceof DomainError)
      return json({ error: error.code }, error.status);
    if (error instanceof ZodError)
      return json({ error: "fieldsRequired" }, 400);
    console.error("Drop Engine request failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "unavailable" }, 503);
  }
}
export async function readBody(request: Request) {
  if (
    !request.headers.get("authorization") ||
    !request.headers.get("content-type")?.startsWith("application/json")
  )
    throw new DomainError("forbidden", 403);
  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_DROP_STATE_BYTES)
    throw new DomainError("fieldsRequired", 413);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new DomainError("fieldsRequired");
  }
}
