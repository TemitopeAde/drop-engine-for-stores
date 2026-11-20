import { appInstances } from '@wix/app-management';
import { recordLifecycleEvent } from '../../../../backend/record-lifecycle-event';
import { runInBackground } from '../../../../backend/run-in-background';

// Wix needs a fast acknowledgement; email and Sheets delivery finish after the response.
export default appInstances.onAppInstancePlanReactivated((event) => {
  runInBackground('PlanReactivated Sheets record', () => recordLifecycleEvent('PlanReactivated', event));
});
