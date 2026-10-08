import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.DROP_ENGINE_BROWSER
    ? { executablePath: process.env.DROP_ENGINE_BROWSER }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (error) => {
  errors.push(error.message);
  console.error(error.message);
});
await page.route("**/api/storefront?*", (route) =>
  route.fulfill({
    json: {
      serverNow: 1000,
      drop: {
        id: "fixture-drop",
        name: "Friday launch",
        phase: "SCHEDULED",
        startsAt: 1000 + 86400000,
        endsAt: 1000 + 90000000,
      },
    },
  }),
);
await page.route("**/api/drops*", (route) =>
  route.fulfill({
    json: {
      drops: [],
      revision: 0,
      serverNow: 1000,
      timeZone: "UTC",
      catalogVersion: "V3_CATALOG",
      products: [
        { id: "4c8379c5-7609-4ae9-91ad-a22a052f1aa9", name: "Launch tee" },
      ],
      hasNext: false,
    },
  }),
);
await page.goto("http://127.0.0.1:5177/?editor", {
  waitUntil: "domcontentloaded",
});
await page
  .getByRole("status")
  .filter({ hasText: "This drop opens soon" })
  .waitFor();
const geometry = [];
for (const width of [480, 320, 240, 800]) {
  for (const direction of ["ltr", "rtl"]) {
    await page.locator("#container").evaluate((element, width) => {
      element.style.width = `${width}px`;
    }, width);
    await page.locator("#countdown").evaluate((element, direction) => {
      element.dir = direction;
    }, direction);
    await page.locator("h2").evaluate((element) => {
      element.textContent =
        "A very long launch heading with UnbrokenProductCollectionTokenThatMustWrapSafelyAcrossNarrowContainers";
    });
    const metrics = await page
      .locator("#countdown")
      .evaluate((element) => ({
        scroll: element.scrollWidth,
        client: element.clientWidth,
        height: element.clientHeight,
      }));
    if (metrics.scroll > metrics.client + 1)
      throw new Error(
        `Overflow at ${width}/${direction}: ${JSON.stringify(metrics)}`,
      );
    geometry.push({ width, direction, ...metrics });
  }
}
await page.locator("#container").evaluate((element) => {
  element.style.width = "480px";
});
await page.screenshot({ path: "/private/tmp/drop-engine-react.png" });
await page.goto("http://127.0.0.1:5177/", { waitUntil: "domcontentloaded" });
await page
  .getByRole("heading", { name: "Your next launch starts here" })
  .waitFor();
await page.screenshot({ path: "/private/tmp/drop-engine-dashboard.png" });
await page.getByRole("button", { name: "Create drop" }).first().click();
await page.getByRole("textbox", { name: "Drop name" }).waitFor();
await page.screenshot({ path: "/private/tmp/drop-engine-form.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/private/tmp/drop-engine-mobile.png" });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1,
);
if (overflow) throw new Error("Dashboard mobile overflow");
await page.addScriptTag({
  path: new URL("../../node_modules/axe-core/axe.min.js", import.meta.url)
    .pathname,
});
const accessibility = await page.evaluate(async () =>
  (
    await axe.run(document, { rules: { "color-contrast": { enabled: false } } })
  ).violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    count: v.nodes.length,
  })),
);
const result = {
  fixture: true,
  geometry,
  mobileOverflow: overflow,
  errors,
  accessibility,
};
await fs.writeFile(
  "/private/tmp/drop-engine-browser-results.json",
  JSON.stringify(result, null, 2),
);
await browser.close();
console.log(JSON.stringify(result));
if (errors.length || accessibility.length) process.exitCode = 1;
