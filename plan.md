# Drop Engine implementation plan

## Current checkpoint

Stage 0 defaults were approved by the user's “implement” instruction. Core launch controls are implemented and locally verified; live install/checkout acceptance remains pending. The user additionally requested Wix Aria and an Editor React extension; both are implemented using MCP-verified contracts. Notification providers, later stages and production release are still pending.

See [implementation verification](docs/implementation-verification.md), [Aria/Harmony setup](docs/aria-and-harmony.md) and [README](README.md).

- [API verification and open limitations](docs/wix-api-verification.md)
- [Architecture decisions to approve](docs/architecture-decisions.md)
- [Exact permission scope IDs](docs/permissions.md)
- [Acceptance and verification plan](docs/acceptance-plan.md)

## Stage 0 — Research and decisions

- [x] Inspect pasted requirements, project instructions, Wix skills, installed runtime, and available Wix MCP tools.
- [x] Read official documentation for catalog version detection, V1/V3 products and references, inventory, validation, data provisioning, HTTP endpoints, product-page context, editor controls, billing, and lifecycle events.
- [x] Verify `validateInCart` in official configuration and installed builder declarations.
- [x] Record API names, scopes, installed package versions, documentation contradictions, and unsupported/unverified behavior.
- [x] Produce concrete architecture recommendations and staged acceptance criteria.
- [x] Obtain approval for collection/access model, cap and limit semantics, end/downgrade behavior, pricing fallback, notification mechanism pattern, and pricing defaults; provider choice remains deferred.
- [x] Install and pin business SDK packages; verify exact installed signatures against official examples before implementation.
- [ ] Resolve buyer membership identity, callback metadata/locale, outage behavior, and collection concurrency contracts. User approval cannot substitute for technical verification.

## Stage 1 — Foundation and core gating

- [x] Generate extensions with the installed Wix CLI, preserving Astro routing.
- [x] Define nine private, namespace-scoped app collections.
- [ ] Verify actual CMS/Stores provisioning after installing a released version.
- [x] Implement authenticated tenant-bound endpoints and explicit mutation authorization.
- [x] Detect and persist site catalog version/timezone; implement separate V1/V3 catalog adapters.
- [x] Build shadcn/ui dashboard create/edit/list flows with shared Zod validation, localization resources, stable submit labels, and inline spinners.
- [x] Build visible product-page countdown with independent editor settings and live product context. Notifications are explicitly unconfigured; variant inventory and waitlist signup remain later work.
- [x] Implement registered `ECOM_VALIDATIONS` handler with cart validation enabled and authoritative server-time gating.
- [x] Run local unit/contract/form/SSR checks, TypeScript and Wix builds; generate the Harmony manifest.
- [ ] Demonstrate checkout gating on actual V1 and V3 sites after a test release.

## Added request — Aria and Harmony

- [x] Verify App Tools declaration and Tools Provider contracts using Wix MCP.
- [x] Implement activated published-launch listing and product availability tools, with strict input validation and trusted tenant metadata.
- [x] Add native Harmony Editor React countdown, generated data/style panels, named parts, SSR and RTL support.
- [x] Generate and inspect the editor manifest.
- [ ] Verify Aria discovery/invocation and Harmony settings on a released installation.
- [ ] Complete a clean browser rerun; the last rerun was declined after the fixture JSX correction.

## Stage 2 — Waitlist and notifications

- [ ] Consent, normalization, persistent deduplication, abuse protection, unsubscribe, private counts, and Pro CSV export.
- [ ] Implement only the approved trigger/provider: durable jobs, fenced versions, retry/reconciliation, delivery records, and suppression.

## Stage 3 — Purchase limits and analytics

- [ ] Verify membership identity and supported channels before enabling members-only rules.
- [ ] Idempotent order/transaction ingestion, reconciliation, documented best-effort buyer limits, and real inventory display.
- [ ] Explicit sales/conversion definitions and evidence-based attribution.

## Stage 4 — Pricing and billing

- [ ] Server-side Wix App Market entitlements and approved Free/Pro plan behavior.
- [ ] Implement pricing only where safe ownership-aware restoration is verified; otherwise disable it with a clear explanation.
- [ ] Trial/expiry/downgrade handling, including current-plan refresh rather than trusting event order.

## Stage 5 — Hardening and submission

- [ ] Complete and check 20-language resources, English fallback, RTL, accessibility, and all panel sections.
- [ ] Run failure/concurrency/end-to-end acceptance matrix, permission audit, install/uninstall checks, and browser checks.
- [ ] Complete README, `.env.example`, deployment guide, retention policy, runbook, and monitoring/alert setup.
- [ ] Build and preview; report actual outcomes. App Market listing, pricing, consent to new scopes, and release verification remain separate gates.
