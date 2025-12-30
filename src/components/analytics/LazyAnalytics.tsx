"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded analytics components to reduce main thread blocking (~1.5s savings)
 * These are loaded after hydration to avoid impacting LCP
 */
const Analytics = dynamic(() => import("@vercel/analytics/next").then((mod) => mod.Analytics), {
  ssr: false,
});

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false }
);

export function LazyAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
