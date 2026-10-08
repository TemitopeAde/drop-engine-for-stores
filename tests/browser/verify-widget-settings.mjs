import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
const output = await build({
  stdin: {
    contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import Plugin from './src/extensions/site/plugins/drop-countdown/drop-countdown';
    import Countdown from './src/extensions/site/components/drop-launch-countdown/drop-launch-countdown';
    import { defaultWidgetSettings } from './src/domain/widget-settings';
    customElements.define('test-countdown', Plugin);
    const plugin = document.createElement('test-countdown');
    plugin.style.display = 'block';
    plugin.style.width = '480px';
    plugin.setAttribute('product-id', 'product');
    plugin.setAttribute('drop-settings', JSON.stringify({ ...defaultWidgetSettings, font: 'italic 700 24px Georgia', textColor: '#ffffff', background: '#102030', padding: 40, gap: 30, radius: 20, maxWidth: 800, compact: true }));
    document.body.append(plugin);
    const host = document.createElement('div');
    host.style.width = '480px';
    document.body.append(host);
    createRoot(host).render(<Countdown id="react-countdown" productId="product" headline="Heading" elementProps={{ number: { className: 'selected-number' }, label: { className: 'selected-label' }, countdown: { className: 'selected-countdown' } }} />);
  `,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  jsx: "automatic",
  bundle: true,
  write: false,
  format: "esm",
  outfile: "/tmp/widget-check.js",
  alias: {
    "@wix/essentials": new URL("./essentials.ts", import.meta.url).pathname,
  },
});
const script = output.outputFiles.find((file) =>
  file.path.endsWith(".js"),
).text;
const css = output.outputFiles.find((file) => file.path.endsWith(".css")).text;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.DROP_ENGINE_BROWSER
    ? { executablePath: process.env.DROP_ENGINE_BROWSER }
    : {}),
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  await page.route("**/*", (route) =>
    route.fulfill(
      route.request().url().includes("/api/storefront")
        ? {
            json: {
              serverNow: 1000,
              drop: {
                id: "drop",
                name: "Launch",
                phase: "SCHEDULED",
                startsAt: 86401000,
                endsAt: 90001000,
              },
            },
          }
        : {
            contentType: "text/html",
            body: `<style>${css}\n.selected-number { font: italic 400 36px Georgia; color: rgb(170, 0, 0); } .selected-label { font: 18px Georgia; color: rgb(0, 0, 170); } .selected-countdown { gap: 32px; padding: 12px; border: 3px solid purple; border-radius: 8px; } #react-countdown { display: var(--display); }</style><script type="module">${script.replaceAll("</script", "<\\/script")}</script>`,
          },
    ),
  );
  await page.goto("http://widget-check.test");
  await page.locator("test-countdown h3").waitFor();
  await page.locator("#react-countdown .selected-number").first().waitFor();
  const styles = await page.evaluate(() => {
    const plugin = document.querySelector("test-countdown section");
    const heading = plugin.querySelector("h3");
    const number = document.querySelector(".selected-number");
    const label = document.querySelector(".selected-label");
    const countdown = document.querySelector(".selected-countdown");
    const read = (node) => {
      const s = getComputedStyle(node);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        color: s.color,
        background: s.backgroundColor,
        padding: s.padding,
        gap: s.gap,
        borderRadius: s.borderRadius,
      };
    };
    return {
      plugin: read(plugin),
      heading: read(heading),
      number: read(number),
      label: read(label),
      countdown: read(countdown),
    };
  });
  assert.equal(styles.plugin.background, "rgb(16, 32, 48)");
  assert.equal(styles.heading.fontFamily, "Georgia");
  assert.ok(Number.parseFloat(styles.heading.fontSize) >= 24);
  assert.equal(styles.heading.color, "rgb(255, 255, 255)");
  assert.equal(styles.number.fontSize, "36px");
  assert.equal(styles.number.color, "rgb(170, 0, 0)");
  assert.equal(styles.label.fontSize, "18px");
  assert.equal(styles.countdown.gap, "32px");
  assert.equal(styles.countdown.borderRadius, "8px");
  for (const width of [320, 240, 800]) {
    await page.evaluate((width) => {
      document.querySelector("test-countdown").style.width = `${width}px`;
      document.querySelector("#react-countdown").parentElement.style.width =
        `${width}px`;
    }, width);
    await page.waitForFunction(
      (width) =>
        getComputedStyle(document.querySelector("test-countdown section"))
          .padding === (width < 360 ? "16px" : "40px"),
      width,
    );
    const fits = await page
      .locator("#react-countdown")
      .evaluate((root) => root.scrollWidth <= root.clientWidth + 1);
    assert.ok(fits, `Countdown overflowed at ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: selected typography, colors, spacing, borders, and resizing at 240/320/800px.",
  );
} finally {
  await browser.close();
}
