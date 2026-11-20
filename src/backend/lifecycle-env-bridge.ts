// Backend event extensions are bundled separately from the Astro app: they cannot import
// `astro:env/server`, and their copy of Astro's env getter is never filled. The Astro
// middleware (src/middleware.ts) reads the secrets per request and publishes them here;
// both bundles share the worker's globalThis.
const KEY = Symbol.for('lifecycle-sheets-env');

export type LifecycleSheetsEnv = {
  LIFECYCLE_SHEETS_WEBHOOK_URL?: string | undefined;
  LIFECYCLE_SHEETS_WEBHOOK_SECRET?: string | undefined;
};

type Holder = typeof globalThis & { [KEY]?: LifecycleSheetsEnv };

export function publishLifecycleSheetsEnv(env: LifecycleSheetsEnv): void {
  (globalThis as Holder)[KEY] = env;
}

export function readLifecycleSheetsEnv(): LifecycleSheetsEnv {
  return (globalThis as Holder)[KEY] ?? {};
}
