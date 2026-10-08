import { extensions } from "@wix/astro/builders";
export default extensions.appTools({
  id: "67ca96ff-51dc-4344-89b9-7dd354ca5b7d",
  name: "drop-engine-tools",
  tools: [
    {
      methodName: "list-published-drops",
      displayName: "List published product launches",
      activated: true,
      description:
        "Lists published Drop Engine launches for the current Wix site, including their server-time status and launch window. Use when a site collaborator asks which drops are scheduled, live, or ended. Returns published launches only; it does not include drafts, waitlist emails, orders, or analytics. This tool does not change launch settings.",
      requestSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          offset: { type: "integer", minimum: 0, maximum: 100 },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
      },
      responseSchema: {
        type: "object",
        properties: {
          serverNow: { type: "number" },
          drops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                phase: { type: "string" },
                startsAt: { type: "number" },
                endsAt: { type: "number" },
                blocked: { type: "boolean" },
              },
            },
          },
          nextOffset: { type: ["integer", "null"] },
        },
      },
    },
    {
      methodName: "get-product-launch",
      displayName: "Check product launch availability",
      activated: true,
      description:
        "Checks the published Drop Engine launch controlling a Wix Stores product on the current site. Use when a collaborator asks when a product launches, why its checkout is blocked, or whether its drop has ended. Requires the Wix Stores product UUID. Returns server-time launch status and whether Drop Engine currently blocks purchasing; it does not promise stock availability or change checkout rules.",
      requestSchema: {
        type: "object",
        additionalProperties: false,
        properties: { productId: { type: "string", format: "uuid" } },
        required: ["productId"],
      },
      responseSchema: {
        type: "object",
        properties: {
          serverNow: { type: "number" },
          blocked: { type: "boolean" },
          drop: { type: ["object", "null"] },
        },
      },
    },
  ],
});
