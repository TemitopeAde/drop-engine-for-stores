# Implementation verification

## Local checks (2026-10-08)

- 30 tests pass across timing boundaries, DST rejection, active quota, tenant guards, conditional concurrent writes, body validation, registered validation behavior, Aria privacy/input validation, form submissions and Editor React SSR/data fetching.
- TypeScript compilation passes, and Wix builds the dashboard, both SPI handlers, custom element/panel and Harmony React client/editor/server bundles.
- `wix generate manifest` completes. The generated manifest contains `productId` and `headline`, and all three intended named parts: heading, status and countdown. Source defaults feed both the component and extension.
- A Wix preview including Aria/Harmony changes completed successfully (override `d1a7f9a9-8831-47b2-8692-668efc35d8f1`). The subsequent publication-validation fix requires a refreshed preview; do not confuse preview deployment with a live release.
- Browser fixture: no horizontal overflow at 240, 320, 480 and 800 px for the React countdown, in LTR and RTL with long/unbroken headline text. Dashboard form has no horizontal overflow at a 390 px viewport. Completed run found no axe violations (color contrast excluded).
- That browser run recorded three `React is not defined` errors before a test-only Vite JSX configuration correction triggered reload. A clean rerun was declined. Do not treat this as a clean full browser pass. Vitest component tests and the Wix build pass with the source components.
- Wix skill accessibility scanner: ESLint and semantic checks passed initially; its render loader failed with `exports is not defined in ES module scope` under Node 24. A second attempt disabling experimental require could not load ESM Babel/jsdom dependencies. These are tooling limitations; SSR was independently verified by the Vitest render test. The scanner is not a clean pass.

## Dependency audit

The online npm audit reports 17 findings: 2 critical, 9 high, 2 moderate and 4 low. Direct affected packages include the scaffold's Astro 5, Wix CLI and Wix hosting adapter. Most automated remedies require major changes, including Astro 7, hosting adapter 3 or a CLI downgrade incompatible with the current extension workflow. No forced upgrades were applied. Resolve and revalidate these before production release; the offline audit's empty result is not authoritative.

## Acceptance still required on installed sites

- CMS/Stores dependency provisioning and approval of actual scopes.
- Allowed/denied collaborator roles, visitor projection identity and cross-site isolation in the managed runtime.
- Cart and checkout calls for V1/V3 products and selected variants, exact start/end behavior, cancellation and storage outage response.
- Actual platform enforcement when the validation plugin itself times out or Wix Data is unavailable. Returning an error from our handler does not establish Wix's platform timeout behavior.
- Native product-page context, independent panel persistence, theme font preload and Harmony generated panels after installation.
- Aria discovery and invocation after a release. Tool declarations and mocked handler tests do not establish a live assistant connection.

## Storage deviation from the original proposal

This stage uses a single installation record as the canonical source for both dashboard definitions and checkout rules. The conditional revision update provides an atomic Free quota/publication boundary without asserting cross-collection transactions. The `drops` and association/audit/job collections are reserved for subsequent scalable projections; no incomplete projection write can currently produce a gate different from the dashboard's canonical definition. Capacity is bounded and documented until that work ships.

## Follow-up build fixes

The expired-publication check was previously nested inside a condition that excluded ended RESTORE drops. It now runs explicitly on publication, using fresh server time after catalog verification. Its regression test covers an end before, exactly at, and after server time. App-owned API URL warnings are suppressed with Vite’s documented ignore annotation because those routes are resolved at runtime.
