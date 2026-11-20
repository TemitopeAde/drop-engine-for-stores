import { app } from "@wix/astro/builders";
import myPage from "./extensions/dashboard/pages/my-page/my-page.extension.ts";
import dropStudio from "./extensions/dashboard/pages/drop-studio/drop-studio.extension.ts";

import dropValidation from "./extensions/backend/service-plugins/drop-validation/drop-validation.extension.ts";

import dataCollections from "./extensions/backend/data-collections/data-collections.extension.ts";

import dropCountdown from "./extensions/site/plugins/drop-countdown/drop-countdown.extension.ts";

import dropEngineTools from "./extensions/backend/app-tools/drop-engine-tools/drop-engine-tools.extension.ts";

import dropToolsProvider from "./extensions/backend/service-plugins/drop-tools-provider/drop-tools-provider.extension.ts";

import dropLaunchCountdown from "./extensions/site/components/drop-launch-countdown/drop-launch-countdown.extension.ts";

import chooseProducts from "./extensions/dashboard/modals/choose-products/choose-products.extension.ts";

import confirmDropAction from "./extensions/dashboard/modals/confirm-drop-action/confirm-drop-action.extension.ts";

import appInstalled from "./extensions/backend/events/app-installed/app-installed.extension.ts";

import paidPlanPurchased from "./extensions/backend/events/paid-plan-purchased/paid-plan-purchased.extension.ts";

import paidPlanChanged from "./extensions/backend/events/paid-plan-changed/paid-plan-changed.extension.ts";

import appRemoved from "./extensions/backend/events/app-removed/app-removed.extension.ts";

import paidPlanAutoRenewalCancelled from "./extensions/backend/events/paid-plan-auto-renewal-cancelled/paid-plan-auto-renewal-cancelled.extension.ts";

import planConvertedToPaid from "./extensions/backend/events/plan-converted-to-paid/plan-converted-to-paid.extension.ts";

import planReactivated from "./extensions/backend/events/plan-reactivated/plan-reactivated.extension.ts";

import planTransferred from "./extensions/backend/events/plan-transferred/plan-transferred.extension.ts";

import launchCountdown from "./extensions/site/widgets/launch-countdown/launch-countdown.extension.ts";

import dropStudio from "./extensions/dashboard/pages/drop-studio/drop-studio.extension.ts";

export default app()
  .use(myPage)
  .use(dropStudio)
  .use(dropValidation)
  .use(dataCollections)
  .use(dropCountdown)
  .use(dropEngineTools)
  .use(dropToolsProvider)
  .use(dropLaunchCountdown)
  .use(chooseProducts)
  .use(confirmDropAction)
  .use(appInstalled)
  .use(paidPlanPurchased)
  .use(paidPlanChanged)
  .use(appRemoved)
  .use(paidPlanAutoRenewalCancelled)
  .use(planConvertedToPaid)
  .use(planReactivated)
  .use(planTransferred)
  .use(launchCountdown)
  .use(dropStudio);
