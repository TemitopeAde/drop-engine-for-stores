import { expect, it } from "vitest";
import { readBody } from "../src/server/http";
import { MAX_DROP_STATE_BYTES } from "../src/domain/limits";
it("rejects mutation requests without bearer credentials", async () => {
  await expect(
    readBody(
      new Request("https://example.test/api/drops", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    ),
  ).rejects.toThrow("forbidden");
});
it("rejects oversized and malformed mutation payloads", async () => {
  const headers = {
    authorization: "Bearer test-only",
    "content-type": "application/json",
  };
  await expect(
    readBody(
      new Request("https://example.test", {
        method: "POST",
        headers,
        body: "x".repeat(MAX_DROP_STATE_BYTES + 1),
      }),
    ),
  ).rejects.toThrow("fieldsRequired");
  await expect(
    readBody(
      new Request("https://example.test", {
        method: "POST",
        headers,
        body: "not json",
      }),
    ),
  ).rejects.toThrow("fieldsRequired");
});
it("accepts a mutation payload containing thousands of product IDs", async () => {
  const input = {
    productIds: Array.from({ length: 5000 }, () => crypto.randomUUID()),
  };
  const request = new Request("https://example.test/api/drops", {
    method: "POST",
    headers: {
      authorization: "Bearer test-only",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  await expect(readBody(request)).resolves.toEqual(input);
});
