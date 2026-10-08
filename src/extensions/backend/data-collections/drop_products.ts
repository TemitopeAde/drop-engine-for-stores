import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "drop_products";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — drop_products",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "productId", displayName: "productId", type: "TEXT" },
    { key: "catalogVersion", displayName: "catalogVersion", type: "TEXT" },
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
