import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "drop_audit_log";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — drop_audit_log",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "actorId", displayName: "actorId", type: "TEXT" },
    { key: "action", displayName: "action", type: "TEXT" },
    {
      key: "details",
      displayName: "details",
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
