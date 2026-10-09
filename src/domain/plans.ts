import { z } from "zod";
import { MAX_PRODUCTS_PER_DROP } from "./limits";

// Must match the app ID in wix.config.json; Wix's pricing page is keyed by it.
export const APP_ID = "8d450f0a-51d0-44d1-9f99-8fca22fe3a03";

export const planIdSchema = z.enum(["basic", "pro", "business"]);
export type PlanId = z.infer<typeof planIdSchema>;

export const planLimitsSchema = z.object({
  // null means unlimited.
  activeDrops: z.number().int().positive().nullable(),
  waitlistSignups: z.number().int().positive().nullable(),
  productsPerDrop: z.number().int().positive(),
  csvExport: z.boolean(),
});
export type PlanLimits = z.infer<typeof planLimitsSchema>;

// Every plan number lives here. Basic is the free plan.
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  basic: {
    activeDrops: 1,
    waitlistSignups: 200,
    // Basic is for trying the app out.
    productsPerDrop: 1,
    csvExport: false,
  },
  pro: {
    activeDrops: 3,
    waitlistSignups: 5_000,
    productsPerDrop: 50,
    csvExport: true,
  },
  business: {
    activeDrops: null,
    waitlistSignups: null,
    productsPerDrop: MAX_PRODUCTS_PER_DROP,
    csvExport: true,
  },
};

// Dev Center package names → plans. Update if the plans use different IDs.
export const PLAN_PACKAGES: Record<string, PlanId> = {
  pro: "pro",
  business: "business",
};

export const trialStatusSchema = z.enum([
  "IN_PROGRESS",
  "ENDED",
  "NOT_AVAILABLE",
]);
export type InstanceSummary = {
  isFree?: boolean;
  billing?: {
    packageName?: string;
    freeTrialInfo?: { status?: string } | null;
  } | null;
  freeTrialAvailable?: boolean;
};

export function planFromInstance(
  instance: InstanceSummary | undefined,
): PlanId {
  if (instance?.isFree !== false) return "basic";
  const name = instance.billing?.packageName?.trim().toLowerCase() ?? "";
  // A renamed or unknown paid package must never drop a paying merchant to Basic.
  return PLAN_PACKAGES[name] ?? "pro";
}

export const upgradeUrl = (instanceId: string) =>
  `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${encodeURIComponent(instanceId)}`;

export const planSchema = z.object({
  id: planIdSchema,
  limits: planLimitsSchema,
  trial: z.object({
    available: z.boolean(),
    status: trialStatusSchema.nullable(),
  }),
  upgradeUrl: z.string().url(),
});
export type Plan = z.infer<typeof planSchema>;

export function describePlan(
  instance: InstanceSummary | undefined,
  instanceId: string,
): Plan {
  const id = planFromInstance(instance);
  const status = trialStatusSchema.safeParse(
    instance?.billing?.freeTrialInfo?.status,
  );
  return {
    id,
    limits: PLAN_LIMITS[id],
    trial: {
      available: instance?.freeTrialAvailable === true,
      status: id !== "basic" && status.success ? status.data : null,
    },
    upgradeUrl: upgradeUrl(instanceId),
  };
}
