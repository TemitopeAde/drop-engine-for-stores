import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "waitlist_entries";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — waitlist_entries",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "email", displayName: "email", type: "TEXT" },
    { key: "status", displayName: "status", type: "TEXT" },
    {
      key: "consent",
      displayName: "consent",
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
