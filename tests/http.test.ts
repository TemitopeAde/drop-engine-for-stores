import { expect, it } from "vitest";
import { readBody } from "../src/server/http";
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
        body: "x".repeat(33000),
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
