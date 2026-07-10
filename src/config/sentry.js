import * as Sentry from "@sentry/react";

let initialized = false;

function scrubEvent(event) {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  const headers = event.request?.headers;
  if (headers) {
    delete headers.authorization;
    delete headers.Authorization;
    delete headers.cookie;
    delete headers.Cookie;
  }

  if (event.request) {
    delete event.request.cookies;
  }

  return event;
}

export function initSentry() {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "production",
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubEvent,
  });

  initialized = true;
}
