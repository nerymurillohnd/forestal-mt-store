import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://1c0890daab27505a25d599734ea55a50@o4510832064593920.ingest.us.sentry.io/4510905573179392",
  sendDefaultPii: false,
  // No Replay/Tracing/Feedback integrations — bundle size reduction (~300KB saved)
  // Re-enable tracing when performance budget allows: browserTracingIntegration()
  // Re-enable replay when session recording is needed: replayIntegration()
  integrations: [],
  // Error-only monitoring — no transaction traces in production
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
