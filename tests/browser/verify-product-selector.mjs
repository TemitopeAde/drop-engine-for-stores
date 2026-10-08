import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.DROP_ENGINE_BROWSER ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const products = Array.from({ length: 5000 }, (_, index) => ({
  id: `${index.toString(16).padStart(8, "0")}-7609-4ae9-91ad-a22a052f1aa9`,
  name: `Product ${index + 1}`,
}));
const requests = [];
let savedIds = [];
await page.route("**/api/drops*", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (request.method() === "POST") {
    savedIds = request.postDataJSON().input.productIds;
    return route.fulfill({ json: { revision: 1 } });
  }
  const index = Number(url.searchParams.get("page") || 0);
  if (url.searchParams.get("catalogOnly")) requests.push(index);
  const catalog = {
    products: products.slice(index * 50, index * 50 + 50),
    hasNext: index < 99,
    cursor: index < 99 ? `cursor-${index + 1}` : undefined,
  };
  if (url.searchParams.get("catalogOnly"))
    return route.fulfill({ json: catalog });
  return route.fulfill({
    json: {
      drops: [],
      revision: 0,
      serverNow: Date.now(),
      timeZone: "UTC",
      catalogVersion: "V3_CATALOG",
      ...catalog,
    },
  });
});
try {
  await page.goto(
    process.env.DROP_ENGINE_TEST_URL || "http://127.0.0.1:5179/",
    {
      waitUntil: "domcontentloaded",
    },
  );
  await page.getByRole("button", { name: "Create drop" }).first().click();
  await page
    .getByRole("textbox", { name: "Drop name" })
    .fill("Full catalog launch");
  await page.getByLabel("Starts", { exact: true }).fill("2099-10-09T12:00");
  await page.getByLabel("Ends", { exact: true }).fill("2099-10-09T13:00");
  await page.getByRole("button", { name: "Choose products" }).click();
  const picker = page.frameLocator('iframe[title="Choose products"]');
  await picker.getByRole("checkbox", { name: "Select all products" }).click();
  await picker.getByText("5,000 selected", { exact: true }).waitFor();
  if ((await picker.getByRole("checkbox").count()) !== 51)
    throw new Error("Unbounded product rows");
  await picker.getByRole("button", { name: "Next products" }).click();
  await picker
    .getByRole("checkbox", { name: "Product 51", exact: true })
    .waitFor();
  if (
    !(await picker
      .getByRole("checkbox", { name: "Product 51", exact: true })
      .isChecked())
  )
    throw new Error("Selection lost across pages");
  await picker
    .getByRole("checkbox", { name: "Product 51", exact: true })
    .uncheck();
  await picker.getByText("4,999 selected", { exact: true }).waitFor();
  const mixed = await picker
    .getByRole("checkbox", { name: "Select all products" })
    .evaluate((element) => element.indeterminate);
  if (!mixed) throw new Error("Missing mixed checkbox state");
  await page.screenshot({ path: "/private/tmp/drop-engine-select-all.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/private/tmp/drop-engine-select-all-mobile.png",
  });
  const overflow = await picker
    .locator("body")
    .evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (overflow) throw new Error("Product picker mobile overflow");
  await picker.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByText("4,999 selected", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("heading", { name: "Drops", exact: true }).waitFor();
  if (savedIds.length !== 4999 || savedIds.includes(products[50].id))
    throw new Error("Wrong IDs submitted");
  if (errors.length) throw new Error(errors.join("; "));
  console.log(
    JSON.stringify({
      fixture: true,
      selected: 5000,
      submitted: savedIds.length,
      renderedRows: 50,
      catalogRequests: requests.length,
      mobileOverflow: overflow,
      errors,
    }),
  );
} finally {
  await browser.close();
}
