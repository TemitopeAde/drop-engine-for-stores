import { validations } from "@wix/ecom/service-plugins";
import { blocked } from "../../../../domain/drop";
import { t } from "../../../../locales/en";
import { readForValidation } from "../../../../server/storage";
const STORES_CATALOG = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
validations.provideHandlers({
  getValidationViolations: async ({ request, metadata }) => {
    try {
      if (!metadata.instanceId)
        throw new Error("Missing trusted installation context");
      const installation = await readForValidation(metadata.instanceId);
      const now = Date.now();
      const violations: validations.Violation[] = [];
      for (const item of request.validationInfo?.lineItems || []) {
        const reference = item.catalogReference;
        if (
          reference?.appId !== STORES_CATALOG ||
          !reference.catalogItemId ||
          !item._id
        )
          continue;
        const productId = reference.catalogItemId;
        const drop = installation?.state.drops.find(
          (d) => d.productIds.includes(productId) && blocked(d, now),
        );
        if (drop)
          violations.push({
            severity: validations.Severity.ERROR,
            target: {
              lineItem: {
                _id: item._id,
                name: validations.NameInLineItem.LINE_ITEM_DEFAULT,
              },
            },
            description: t(
              now < drop.startsAt ? "beforeViolation" : "afterViolation",
              metadata.languages?.[0],
            ),
          });
      }
      return { violations };
    } catch {
      return {
        violations: [
          {
            severity: validations.Severity.ERROR,
            target: { other: { name: validations.NameInOther.OTHER_DEFAULT } },
            description: t("outageViolation"),
          },
        ],
      };
    }
  },
});
