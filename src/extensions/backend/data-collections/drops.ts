import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "drops";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — drops",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "name", displayName: "name", type: "TEXT" },
    { key: "version", displayName: "version", type: "NUMBER" },
    { key: "status", displayName: "status", type: "TEXT" },
    {
      key: "definition",
      displayName: "definition",
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
