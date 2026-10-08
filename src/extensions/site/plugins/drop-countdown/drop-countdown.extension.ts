import { extensions } from "@wix/astro/builders";
import { DROP_COUNTDOWN_PLUGIN_ID } from "../../../../domain/site-plugin";

export default extensions.sitePlugin({
  id: DROP_COUNTDOWN_PLUGIN_ID,
  name: "drop-countdown",
  marketData: {
    name: "Drop countdown",
    description: "Display launch windows for your products.",
    logoUrl: "{{BASE_URL}}/drop-countdown-logo.svg",
  },
  placements: [
    {
      appDefinitionId: "1380b703-ce81-ff05-f115-39571d94dfcd",
      widgetId: "13a94f09-2766-3c40-4a32-8edb5acdd8bc",
      slotId: "product-page-details-2",
    },
    {
      appDefinitionId: "a0c68605-c2e7-4c8d-9ea1-767f9770e087",
      widgetId: "6a25b678-53ec-4b37-a190-65fcd1ca1a63",
      slotId: "product-page-details-2",
    },
  ],
  installation: { autoAdd: true },
  tagName: "drop-countdown",
  element: "./extensions/site/plugins/drop-countdown/drop-countdown.tsx",
  settings: "./extensions/site/plugins/drop-countdown/drop-countdown.panel.tsx",
});
