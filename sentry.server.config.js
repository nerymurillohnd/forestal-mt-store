import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://1c0890daab27505a25d599734ea55a50@o4510832064593920.ingest.us.sentry.io/4510905573179392",
  sendDefaultPii: true,
  // Enable logs to be sent to Sentry
  enableLogs: true,
  // 100% in dev/early launch — reduce to ~0.1 in production at scale
  tracesSampleRate: 1.0,
});
