import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "processed_events";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — processed_events",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "eventId", displayName: "eventId", type: "TEXT" },
    { key: "eventType", displayName: "eventType", type: "TEXT" },
    { key: "processedAt", displayName: "processedAt", type: "DATETIME" },
  ],
  dataPermissions: {
    itemInsert: "PRIVILEGED",
    itemRead: "PRIVILEGED",
    itemRemove: "PRIVILEGED",
    itemUpdate: "PRIVILEGED",
  },
  indexes: [],
  initialData: [],
} satisfies DataCollection;
