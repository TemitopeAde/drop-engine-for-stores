# Drop Engine acceptance and release evidence

Status: test plan only. No implementation tests, live checkout tests, release, collection provisioning, email sends, or paid plan changes were run in Stage 0.

Read-only checks actually completed: inspected installed package versions/types, existing Astro configuration, CLI instructions and extension templates; ran installed CLI schema generation for SERVICE_PLUGIN and SITE_PLUGIN. Both schema commands succeeded, confirming ECOM_VALIDATIONS and old/new product-page slots. Official Wix APIs were researched through MCP. No app implementation has been generated at this checkpoint.

## Stage 1 production gate

Before claiming the visible-product rule works, capture evidence on actual V1 and V3 sites with the service plugin built/released and relevant scopes approved. Verify the applicable old/new product-page placements separately; page version is not catalog version.

| Scenario | Required behavior / evidence |
| --- | --- |
| Visible product before launch | Product page and normal catalog still show product. Countdown uses actual launchUTC. Native checkout returns item-specific ERROR and cannot place order; cart blocks progression when validateInCart is enabled. Record Add to Cart behavior without promising it disables. |
| Exact launch boundary | Fixed-clock unit test at launchUTC-1ms blocks; at launchUTC allows. Live checkout after launch succeeds without any scheduled job execution or status-update tick. Recalculation may be needed for previously displayed cart errors; verify rather than promising immediate native UI refresh. |
| End boundary | Before end allows active rules; at end restores normal purchasing by default. Explicit continued-blocking mode must clearly explain the restriction and have a working restore action. |
| Unrelated/multiple products | Only affected Wix Stores items are targeted, with correct IDs; other catalogs/items remain eligible. Test 300-line maximum, repeated product lines, mixed variants and multi-product drops. |
| Cancel/release/reschedule/restore | Mutation persists; future requests use changed server timestamps/control state. Old versions/jobs cannot reactivate a canceled/restored rule. Duplicate is a draft with no copied subscriptions. |
| Identity and tenant isolation | Anonymous/member callers cannot mutate merchant rules/export PII. A user authorized on one site cannot access another installation by changing IDs. Collaborator role permissions are checked before elevation. |
| Concurrent drop publication | Two parallel activations cannot create overlapping product gates or exceed Free active quota. Multi-record partial failures are recoverable. No process-local lock masquerades as distributed atomicity. |
| Storage/outage | Inject query timeout, permission denied, missing schema and transient failure. App returns defined ERROR on observed inability to establish eligibility, and diagnostic status is visible to merchant. Confirm how Wix handles callback failure/timeout; this is still unverified. |
| DST/timezone | Reject nonexistent local time; explicit earlier/later choice for repeated time; persist UTC/local/timezone. Changing site timezone does not silently move existing launch instants. |
| Widget rendering | Real countdown, loading/error/no-drop/ended states, selected variant and unknown/untracked inventory. No fake signup counts or stock. Scope-safe public endpoint projections. |
| Editor persistence | Every content/type/color/countdown/form/layout/border/responsive/advanced setting works; serialized confirmed writes persist across editor reload/publish. Complete font preload list, custom/theme/reset and font CSS in isolated rendering verified. Two instances preserve independent settings. |
| Forms | Shared Zod client/server validation; noValidate on forms. Labels unchanged during pending submit, inline spinner, aria-busy, duplicate submission prevention and retry/error recovery. |

## Later-stage acceptance matrix

| Area | Required cases |
| --- | --- |
| Waitlist | Normalization, dedupe, simultaneous identical signups, persistent rate limit, bot protection, consent withdrawal, pending confirmation, subscription cap races, export entitlement, CSV formula injection and no public PII. |
| Emails/jobs | Real approved provider: authentication, suppression, unsubscribe, double opt-in if enabled, due jobs, partial recipient failure, retry/backoff, uncertain send success, duplicate callback, provider outage, reschedule/cancel fencing, uninstall and missed-trigger reconciliation. |
| Buyer limits | Cart lines summed across drop products/variants; previously counted orders; guest identifier missing; logged-in member proof; pending/unpaid/canceled/refunded orders; concurrent carts; email/contact changes; non-native channels. State best-effort limitations explicitly. |
| Events/analytics | Duplicate/out-of-order created/updated/canceled/transaction events; deterministic receipts; line refunds; partial failure recovery; backfill from real order/transaction API. Net units and conversion follow disclosed definitions; no invented email attribution. |
| Billing | Free/Pro server checks; trials if later approved; purchased event at trial start without assumed end event; monthly expiry not inferred from missing expirationDate; auto-renew cancellation retains access; duplicate/delayed plan change, expiry, resubscription, downgrade grace and safe restoration. |
| Pricing | Only if enabled: both catalog contracts, variant array integrity, revision conflicts, merchant price edits during drop, currency/automatic discount/coupon interaction, owned-write restoration and failed restoration diagnostics. Unsupported combinations remain disabled. |
| Install/uninstall | Provisioning readiness, missing CMS/Stores, new scopes/major schema update, originInstanceId clone behavior, removal and loss of API access, no lingering app-enforced purchasing rule, retention and suppression policy. |
| Localization/accessibility | 20-language key completeness and translation quality, English fallback, locale dates/numbers, RTL; keyboard/accordion/focus/error announcements, countdown announcement throttling, responsive design, offline/reconnect, browser and light/dark site-theme matrix. |

## Build, deploy, and operational gate

After code exists: install exact declared dependencies, run TypeScript and relevant unit/SDK contract tests, build with Wix CLI, then create preview and report actual URL or failure. A preview is not evidence of service-plugin activation. Use the documented test-release/install flow for callbacks and live tests; production submission remains a separate decision.

Monitor only implemented metrics: callback latency/error rates, authoritative-read failures, overdue jobs, event reconciliation lag, email delivery/suppression failure, entitlement refresh failure, quota breaches and restoration conflicts. Numeric latency/alert thresholds must be derived from measured platform behavior, not invented callback deadlines.

README, environment example, deployment guide and runbook must include exact generated routes/collections, permission and app-dependency setup, provider secret handling, callback auth, reconciliation/backup procedures, approved retention, uninstall limitations, and tested browser/site compatibility. Never place example subscriber data or a demo enforcing rule on a production installation.
