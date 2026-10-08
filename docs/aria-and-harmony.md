# Wix Aria and Harmony extensions

Verified using Wix MCP against the official [App Tools CLI workflow](https://dev.wix.com/docs/build-apps/develop-your-app/develop-an-app-with-the-cli/supported-extensions/backend/schema-plugins/add-app-tools-extensions-with-the-wix-cli), [Run Tool schema](https://dev.wix.com/docs/api-reference/app-management/app-tools/tools-provider-v1/run-tool?apiView=SDK) and [Editor React documentation](https://dev.wix.com/docs/build-apps/develop-your-app/extensions/site-extensions/editor-react-components/about-editor-react-components).

Aria needs both App Tools declarations and a Tools Provider plugin. The two activated methods have matching handler names and strict server-side payload validation; Wix's declaration schemas are advisory. Callback installation and collaborator identity come from registered SPI metadata. The tools return public, published launch summaries without drafts, email addresses, purchase records or internal installation data. They do not mutate drops.

The Harmony extension is separate from the product-page custom element. Its authored `productId` connects to the same tenant-bound storefront endpoint, so its time display reflects the authoritative server rule. It suppresses network/timers in editor design mode, keeps deterministic SSR, and exposes heading/status/countdown named parts to the generated native design panels. Height follows content and only horizontal resizing is offered.

Aria tools are not live merely because a preview exists. Build, release and update the app installation, then ask the actual assistant a matching question. Editor React components are currently documented as alpha and Harmony-specific. Do not replace existing other-editor widgets with this extension.
