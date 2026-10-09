import { appInstances } from "@wix/app-management";
import { notifyLifecycleEvent } from "../../../../backend/notify-lifecycle-event";

export default appInstances.onAppInstancePaidPlanChanged(async (event) => {
  try {
    const data = event.data;

    await notifyLifecycleEvent({
      eventType: "PAID_PLAN_CHANGED",
      vendorProductId: data.vendorProductId,
      previousVendorProductId: data.previousVendorProductId,
      cycle: data.cycle,
      invoiceId: data.invoiceId,
      occurredAt: data.operationTimeStamp,
      instanceIdHint: event.metadata?.instanceId,
    });
  } catch (error) {
    console.error(
      "[Drop Engine for Stores] Failed to handle paid plan changed event",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
