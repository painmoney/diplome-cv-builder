import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: 0.1,
  });

  initialized = true;
}
