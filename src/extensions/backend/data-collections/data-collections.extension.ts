import { extensions } from "@wix/astro/builders";

import appInstallationsCollection from "./app_installations";

import dropsCollection from "./drops";

import dropProductsCollection from "./drop_products";

import waitlistEntriesCollection from "./waitlist_entries";

import purchaseRecordsCollection from "./purchase_records";

import scheduleJobsCollection from "./schedule_jobs";

import emailDeliveriesCollection from "./email_deliveries";

import processedEventsCollection from "./processed_events";

import dropAuditLogCollection from "./drop_audit_log";

export default extensions.dataCollections({
  id: "8b94ba0f-d3a7-488c-bb3b-38d8d9988f94",
  name: "Data Collections",
  collections: [
    appInstallationsCollection,
    dropsCollection,
    dropProductsCollection,
    waitlistEntriesCollection,
    purchaseRecordsCollection,
    scheduleJobsCollection,
    emailDeliveriesCollection,
    processedEventsCollection,
    dropAuditLogCollection,
  ],
});
