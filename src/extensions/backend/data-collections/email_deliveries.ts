import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "email_deliveries";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — email_deliveries",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "entryId", displayName: "entryId", type: "TEXT" },
    { key: "status", displayName: "status", type: "TEXT" },
    {
      key: "delivery",
      displayName: "delivery",
      type: "OBJECT",
      objectOptions: { fields: [] },
    },
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
