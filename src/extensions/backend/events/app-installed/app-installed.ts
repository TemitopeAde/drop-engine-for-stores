import { appInstances } from "@wix/app-management";
import { notifyLifecycleEvent } from "../../../../backend/notify-lifecycle-event";

export default appInstances.onAppInstanceInstalled(async (event) => {
  try {
    await notifyLifecycleEvent({
      eventType: "APP_INSTALLED",
      instanceIdHint: event.metadata?.instanceId,
    });
  } catch (error) {
    console.error(
      "[Drop Engine for Stores] Failed to handle app installed event",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});
