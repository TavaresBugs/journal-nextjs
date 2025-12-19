import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions (reduce in production)

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode (set to true to troubleshoot)
  debug: false,
});
