import { app } from '@wix/astro/builders';
import myPage from './extensions/dashboard/pages/my-page/my-page.extension.ts';

import dropValidation from './extensions/backend/service-plugins/drop-validation/drop-validation.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import dropCountdown from './extensions/site/plugins/drop-countdown/drop-countdown.extension.ts';

import dropEngineTools from './extensions/backend/app-tools/drop-engine-tools/drop-engine-tools.extension.ts';

import dropToolsProvider from './extensions/backend/service-plugins/drop-tools-provider/drop-tools-provider.extension.ts';

import dropLaunchCountdown from './extensions/site/components/drop-launch-countdown/drop-launch-countdown.extension.ts';

export default app()
  .use(myPage).use(dropValidation).use(dataCollections).use(dropCountdown).use(dropEngineTools).use(dropToolsProvider).use(dropLaunchCountdown);
