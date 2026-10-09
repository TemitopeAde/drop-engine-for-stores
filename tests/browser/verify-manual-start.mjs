import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 30000 });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.DROP_ENGINE_BROWSER
    ? { executablePath: process.env.DROP_ENGINE_BROWSER }
    : {}),
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const editor = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  editor.on("pageerror", (error) => errors.push(error.message));
  const now = Date.now();
  let drop = {
    id: "a937c9e8-a028-40f8-9a07-0f173b081c70",
    name: "Friday launch",
    productIds: ["4c8379c5-7609-4ae9-91ad-a22a052f1aa9"],
    localStart: new Date(now + 86400000).toISOString().slice(0, 23),
    localEnd: new Date(now + 90000000).toISOString().slice(0, 23),
    timeZone: "UTC",
    endBehavior: "RESTORE",
    startsAt: now + 86400000,
    endsAt: now + 90000000,
    updatedAt: now,
    version: 3,
    status: "PUBLISHED",
  };
  const end = drop.endsAt;
  let posts = 0,
    fail = false;
  await context.route("**/api/drops*", async (route) => {
    if (route.request().method() === "POST") {
      const command = route.request().postDataJSON();
      posts++;
      expect(command).toEqual({
        action: "start",
        id: drop.id,
        version: drop.version,
      });
      if (fail) {
        await route.fulfill({
          status: 409,
          json: { error: "startUnavailable" },
        });
        return;
      }
      const started = Date.now();
      drop = {
        ...drop,
        startsAt: started,
        localStart: new Date(started).toISOString().slice(0, 23),
        version: drop.version + 1,
        updatedAt: started,
      };
      await route.fulfill({ json: { drop, revision: 2 } });
      return;
    }
    const url = new URL(route.request().url());
    await route.fulfill({
      json:
        url.searchParams.get("view") === "list"
          ? { drops: [drop], total: 1, serverNow: Date.now() }
          : {
              drops: [drop],
              revision: 1,
              serverNow: Date.now(),
              timeZone: "UTC",
              catalogVersion: "V3_CATALOG",
              products: [{ id: drop.productIds[0], name: "Launch tee" }],
              hasNext: false,
              plan: {
                id: "basic",
                limits: {
                  activeDrops: 1,
                  waitlistSignups: 200,
                  productsPerDrop: 1,
                  csvExport: false,
                },
                trial: { available: false, status: null },
                upgradeUrl: "https://www.wix.com/apps/upgrade/fixture",
              },
            },
    });
  });
  await context.route("**/api/storefront?*", (route) =>
    route.fulfill({
      json: {
        serverNow: Date.now(),
        drop: {
          id: drop.id,
          name: drop.name,
          phase: Date.now() < drop.startsAt ? "SCHEDULED" : "LIVE",
          startsAt: drop.startsAt,
          endsAt: drop.endsAt,
          waitlist: false,
        },
      },
    }),
  );
  await editor.goto("http://127.0.0.1:5177/?editor", {
    waitUntil: "domcontentloaded",
  });
  await expect(editor.getByRole("status")).toHaveText("This drop opens soon");
  await page.goto("http://127.0.0.1:5177/", { waitUntil: "domcontentloaded" });
  const openStart = async () => {
    await page.getByRole("button", { name: "Actions: Friday launch" }).click();
    await page.getByText("Start now", { exact: true }).click();
    const frame = page.frameLocator('iframe[title="Confirm drop action"]');
    await expect(
      frame.getByText("Start Friday launch now?", { exact: true }),
    ).toBeVisible();
    await expect(
      frame.getByText(
        "Purchasing opens immediately. The configured end date and time stay unchanged.",
      ),
    ).toBeVisible();
    return frame;
  };
  let frame = await openStart();
  await expect(
    page.getByRole("button", { name: "Actions: Friday launch" }),
  ).toBeDisabled();
  await frame.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Actions: Friday launch" }),
  ).toBeEnabled();
  expect(posts).toBe(0);
  fail = true;
  frame = await openStart();
  await frame.getByRole("button", { name: "Start now", exact: true }).click();
  await expect(
    page.getByText(
      "Only scheduled, published drops can be started now. Refresh the page and try again.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actions: Friday launch" }),
  ).toBeEnabled();
  fail = false;
  frame = await openStart();
  await frame.getByRole("button", { name: "Start now", exact: true }).click();
  await expect(page.getByText("Launch started", { exact: true })).toBeVisible();
  await expect(page.locator(".de-badge-live")).toHaveText("Live");
  expect(drop.endsAt).toBe(end);
  await page.getByRole("button", { name: "Actions: Friday launch" }).click();
  await expect(page.getByText("Start now", { exact: true })).toHaveCount(0);
  await page.getByText("Edit drop", { exact: true }).click();
  await expect(page.locator("#localStart")).toHaveValue(drop.localStart);
  await expect(page.locator("#localEnd")).toHaveValue(drop.localEnd);
  await expect(editor.getByRole("status")).toHaveText("The drop is live", {
    timeout: 20000,
  });
  expect(errors).toEqual([]);
  console.log(
    "Manual launch browser checks passed: confirmation, cancellation, busy state, API failure, success refresh, exact form times, storefront polling.",
  );
} finally {
  await browser.close();
}
