import { Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import type { Plan } from "../domain/plans";
import type { MessageKey } from "../locales/en";
import { useTranslation } from "../locales/use-translation";

export const planNames: Record<Plan["id"], MessageKey> = {
  basic: "planBasic",
  pro: "planPro",
  business: "planBusiness",
};

export function usePlanSummary(plan: Plan) {
  const { t, locale } = useTranslation();
  const limit = (value: number | null) =>
    value === null ? t("unlimited") : value.toLocaleString(locale);
  return `${t("limitActiveDrops")}: ${limit(plan.limits.activeDrops)} · ${t("limitProducts")}: ${limit(plan.limits.productsPerDrop)}`;
}

// Wix hosts the pricing page and checkout, including the free trial.
export function PlanBadge({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const summary = usePlanSummary(plan);
  const trialing = plan.trial.status === "IN_PROGRESS";
  const action =
    plan.id === "basic"
      ? plan.trial.available
        ? "startTrial"
        : "upgrade"
      : plan.id === "pro" && !trialing
        ? "upgrade"
        : null;
  return (
    <div className="de-plan">
      <div className="de-plan-name">
        <span className="de-plan-dot" />
        <strong>{t(planNames[plan.id])}</strong>
        {trialing && <span className="de-plan-trial">{t("planTrial")}</span>}
      </div>
      <p>{summary}</p>
      {action && (
        <Button
          variant={action === "startTrial" ? "default" : "outline"}
          onClick={() =>
            window.open(plan.upgradeUrl, "_blank", "noopener,noreferrer")
          }
        >
          <Sparkles size={15} />
          {t(action)}
        </Button>
      )}
    </div>
  );
}
