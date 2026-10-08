import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "purchase_records";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — purchase_records",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "orderId", displayName: "orderId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "buyerKey", displayName: "buyerKey", type: "TEXT" },
    { key: "quantity", displayName: "quantity", type: "NUMBER" },
    { key: "status", displayName: "status", type: "TEXT" },
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
