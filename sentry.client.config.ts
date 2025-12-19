import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions (reduce in production)

  // Session Replay (optional - comment out if not needed)
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode (set to true to troubleshoot)
  debug: false,
});
