import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "app_installations";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — app_installations",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "siteId", displayName: "siteId", type: "TEXT" },
    { key: "revision", displayName: "revision", type: "NUMBER" },
    { key: "catalogVersion", displayName: "catalogVersion", type: "TEXT" },
    { key: "timeZone", displayName: "timeZone", type: "TEXT" },
    {
      key: "state",
      displayName: "state",
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
