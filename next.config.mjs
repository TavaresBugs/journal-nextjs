import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Previne clickjacking - bloqueia iframe embedding
          { key: "X-Frame-Options", value: "DENY" },

          // Previne MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // XSS Protection (legado, mas ainda útil para browsers antigos)
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // Controla informações enviadas no Referer header
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Desabilita APIs sensíveis não utilizadas
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },

          // HSTS - força HTTPS por 1 ano
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // Content Security Policy - controla origens de recursos
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com https://infird.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://vercel.live",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://va.vercel-scripts.com https://vercel.live https://infird.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps for better error tracking
  // Set SENTRY_AUTH_TOKEN in your environment
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
};

// Bundle Analyzer - only enable when ANALYZE=true
// Usage: ANALYZE=true npm run build
let finalConfig = nextConfig;

// Apply Sentry config
finalConfig = withSentryConfig(finalConfig, sentryWebpackPluginOptions);

// Apply Bundle Analyzer if ANALYZE=true
if (process.env.ANALYZE === "true") {
  const withBundleAnalyzer = (await import("@next/bundle-analyzer")).default({
    enabled: true,
  });
  finalConfig = withBundleAnalyzer(finalConfig);
}

export default finalConfig;
