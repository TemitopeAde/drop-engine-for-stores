import { appInstances } from '@wix/app-management';
import { notifyLifecycleEvent } from '../../../../backend/notify-lifecycle-event';
import { recordLifecycleEvent } from '../../../../backend/record-lifecycle-event';
import { runInBackground } from '../../../../backend/run-in-background';

// Wix needs a fast acknowledgement; email and Sheets delivery finish after the response.
export default appInstances.onAppInstanceInstalled((event) => {
  runInBackground('AppInstalled email', () => notifyLifecycleEvent({
    eventType: 'APP_INSTALLED',
    instanceIdHint: event.metadata?.instanceId,
  }));
  runInBackground('AppInstalled Sheets record', () => recordLifecycleEvent('AppInstalled', event));
});
