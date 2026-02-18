import * as Sentry from "@sentry/cloudflare";

export const onRequest = [
  Sentry.sentryPagesPlugin((context) => ({
    dsn: "https://1c0890daab27505a25d599734ea55a50@o4510832064593920.ingest.us.sentry.io/4510905573179392",
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 1.0,
    // Post-MVP: uncomment when D1 product pages go SSR
    // integrations: [Sentry.d1Integration(context.env.DB)],
  })),
];
