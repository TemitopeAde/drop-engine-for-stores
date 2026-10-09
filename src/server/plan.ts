import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { describePlan } from "../domain/plans";
import type { Tenant } from "./storage";

// Server-side entitlement, read live so upgrades and trials apply immediately.
// If Wix can't be reached the merchant is treated as Basic.
export async function currentPlan(scope: Tenant) {
  try {
    const { instance } = await auth.elevate(appInstances.getAppInstance)();
    return describePlan(instance, scope.instanceId);
  } catch {
    return describePlan(undefined, scope.instanceId);
  }
}
