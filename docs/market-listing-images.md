# App Market images — Drop Engine for Stores

Image brief for **App Info > App icon** and **App Profile > Media**. Listing copy is in [market-listing.md](market-listing.md). Video is skipped.

Templates: [Figma](https://www.figma.com/file/8xtPgazUnfkDIbRDJzwJLB/App-Logo-and-Images---create-a-duplicate-to-edit?node-id=0%3A199) (duplicate it before editing), [Sketch](https://wix.to/UnbCx7N), [PSD](https://www.dropbox.com/s/g77qsff92glt1tp/Mockups_App.psd?dl=0).

## Shared style

- Use one solid background color across all images, taken from the icon's main color.
- For any text on images, use Roboto, size 20, black or white.
- Keep text short. Images must not be mostly text.
- Do not show sales, discounts, or "% off" graphics.
- Every screenshot shows the app in use with realistic sample products, not empty states or login screens.
- Order the images as a story: create, schedule, storefront, waitlist, manage.

Save the files in `docs/market-listing-assets/` using the file names below.

The current files are HTML mockups that use the app's real UI copy and colors, with a sample store ("Ember & Oak"). To change them, edit `docs/market-listing-assets/source/render.mjs` and re-render:

```sh
node docs/market-listing-assets/source/render.mjs
```

If Playwright reports a missing browser, set `DROP_ENGINE_BROWSER` to an installed Chromium, or run `npx playwright install chromium`.

---

## 1. App icon

| | |
|---|---|
| File | `icon.png` |
| Size | 1000 × 1000 px, square (Wix rounds the corners) |
| Format | 24-bit PNG, sRGB |

Concept: a simple timer or stopwatch combined with a shopping tag or bag, on a solid background. Use no more than two shapes, no text, no app name, no frame, and no screenshot.

## 2. Main image (first in Media)

| | |
|---|---|
| File | `01-main.png` |
| Size | at least 1200 × 900 px, 4:3 |
| Format | PNG or JPG |

Must include:

- App name: **Drop Engine**
- Tagline: **Launch products on schedule, with a live countdown.**
- Visual: a product page mockup with the countdown above the Add to Cart button.

## 3. Additional images

All are at least 1200 × 900 px, 4:3, PNG or JPG. Optional caption text is shown in quotes.

| # | File | Shows | Caption |
|---|------|-------|---------|
| 2 | `02-create-drop.png` | Dashboard drop form with a name, selected products, start/end time and time zone | "Schedule a drop in minutes" |
| 3 | `03-product-page.png` | Product page on a Wix Stores template showing the live countdown | "A live countdown on every product page" |
| 4 | `04-checkout-blocked.png` | Cart/checkout showing "This product is not available for purchase until the drop opens." | "Checkout opens exactly on time" |
| 5 | `05-widget-settings.png` | Countdown settings panel in the Editor (fonts, colors, layout) | "Match the countdown to your brand" |
| 6 | `06-waitlist.png` | Dashboard waitlist view with sample entries | "Build a waitlist before launch day" |
| 7 (optional) | `07-mobile.png` | Product page with the countdown on a mobile screen | "Built for mobile shoppers" |

Wix recommends 5–6 images in total. Images 1–6 meet that, and image 7 covers the mobile view.

## 4. Promotional banner (optional)

| | |
|---|---|
| File | `promo-banner.jpg` |
| Size | 540 × 360 px |
| Format | JPG |

Use a colorful background in the icon's main color, not white. Show a simple illustration of a countdown and a product. Do not include text, the app name, or the logo, because those appear below the banner.

---

## Checklist

- [ ] Icon is 1000 × 1000, 24-bit PNG, sRGB, with no text
- [ ] All Media images are 4:3 and at least 1200 × 900
- [ ] All images use the same background color
- [ ] Screenshots come from a real site with realistic sample products
- [ ] Banner has no text, name, or logo
