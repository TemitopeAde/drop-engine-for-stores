# Drop Engine for Stores

A Wix CLI/Astro app for time-based product launches. The current implementation covers the core launch stage, plus Wix Aria App Tools and a Harmony Editor React countdown. It is not yet an App Market submission-ready release.

## Implemented

- Dashboard create/edit, publish, cancel, duplicate, archive and restore, with React Hook Form, shared Zod validation, Radix/shadcn button composition, lucide icons and Sonner feedback.
- Separate V1/V3 product adapters, live catalog-version detection, product verification and site time zone detection.
- Private app-owned collection definitions; authenticated dashboard operations use Wix's PRIVILEGED permissions without elevation. Public widget responses contain only published launch information.
- A canonical, versioned installation item commits launch changes using a conditional revision filter. Checkout reads this same item with a consistent read; publication does not depend on a scheduler.
- Registered eCommerce validations with `validateInCart: true`, server-time launch boundaries, cancellation restoration and an explicit error response on storage failures.
- A product-page custom element for both Stores page versions, with instance-specific persisted settings and native Wix font/color controls.
- A native Harmony Editor React component with generated data/style panels, editable named parts, intrinsic height, RTL support and a server-synchronized countdown for an authored product UUID.
- Aria declarations and a Tools Provider: `list-published-drops` and `get-product-launch`. They validate payloads, bind installation identity to Wix callback metadata and expose published launch summaries only.

## Local checks

```sh
npm install
npm run check:types
npm test
npm run build
npm run generate -- manifest
npm run build
npm run preview
```

The second build includes the newly generated editor manifest. Never edit `*.generated.ts` manually.

The browser fixture is isolated from production. It aliases Wix HTTP authentication only in its test configuration and supplies fixture responses through Playwright request interception:

```sh
npx vite --config tests/browser/vite.config.ts
# In a second terminal, after installing a Playwright Chromium browser:
node tests/browser/verify.mjs
```

`DROP_ENGINE_BROWSER` may point to an existing Chromium executable. The fixture checks countdown container widths independently of viewport width, RTL, long text, mobile overflow and axe findings. It does not establish Wix authorization or real checkout behavior.

## Wix setup and activation

1. Apply the shipped-feature scopes in [permissions](docs/permissions.md), and confirm CMS/Stores dependencies. Required scopes and app dependencies are separate settings.
2. Install a version containing the collection definitions. Definitions are local until installation of a released version provisions them; allow Wix's propagation delay.
3. Use a V1 and a V3 test site to verify actual collaborator permissions, product selection, widget context, cart and checkout behavior. No development site is currently selected in this repository.
4. Build and create a Wix preview to review UI extensions. A preview does not activate new SPI registrations or Aria tools.
5. Release an app version and update its installation before asking Aria: “Which published Drop Engine drops are scheduled?” or “Is this product blocked by a launch?” with a valid Stores product UUID. Only the real assistant can verify discovery and invocation.
6. On a Harmony site, add **Drop launch countdown** and set its product ID in the generated data panel. The React component is Harmony-specific; the product-page custom element remains the route for the other supported editors.

## Current limits

The core MVP enforces the Free allowance of one active drop. All drafts/history and canonical launch definitions currently fit in one installation item, bounded to 100 records and 200 KB; this is an explicit implementation capacity limit, not a Pro unlimited entitlement. The other eight collections are defined for later features and are not yet written by this stage.

Notifications, purchase limits, order analytics, billing/Pro entitlements, promotional pricing and the full 20-language resource set remain later stages. No fake signup, stock, conversion, billing or delivery data is shown. All current UI copy uses the English resource with fallback.

Platform timeout/outage enforcement, real cart/checkout, Aria discovery and Harmony editor persistence require live-site acceptance. Dependency audit and browser scanner limitations are recorded in [implementation verification](docs/implementation-verification.md).
