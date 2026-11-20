interface ImportMetaEnv {
  readonly LIFECYCLE_SHEETS_WEBHOOK_URL?: string;
  readonly LIFECYCLE_SHEETS_WEBHOOK_SECRET?: string;
}

declare module 'cloudflare:workers' {
  export function waitUntil(promise: Promise<unknown>): void;
}
