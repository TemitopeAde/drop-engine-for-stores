const LOG_PREFIX = '[Drop Engine for Stores]';

// Loaded dynamically: the Wix build also evaluates backend modules in Node, where
// `cloudflare:workers` does not exist. Started at module load so it is ready per request.
const workers = import('cloudflare:workers').catch(() => null);

/** Lets the webhook respond immediately; the worker stays alive until the task settles. */
export function runInBackground(label: string, task: () => Promise<unknown>): void {
  const settled = Promise.resolve()
    .then(task)
    .catch((error) => console.error(`${LOG_PREFIX} ${label} failed`,
      error instanceof Error ? error.message : 'Unknown error'));
  void workers.then((module) => module?.waitUntil(settled));
}
