import type { DataCollection } from "@wix/astro/builders";

export const collectionIdSuffix = "schedule_jobs";
export default {
  idSuffix: collectionIdSuffix,
  displayName: "Drop Engine — schedule_jobs",
  fields: [
    { key: "instanceId", displayName: "instanceId", type: "TEXT" },
    { key: "dropId", displayName: "dropId", type: "TEXT" },
    { key: "version", displayName: "version", type: "NUMBER" },
    { key: "status", displayName: "status", type: "TEXT" },
    {
      key: "job",
      displayName: "job",
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
