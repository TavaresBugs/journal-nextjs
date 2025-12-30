"use client";

import { useState, useEffect, type ComponentType } from "react";

/**
 * Lazy-loaded Vercel Toolbar that only loads in development mode
 * This prevents the toolbar from impacting production performance
 * (vercel.live takes ~1.46s main thread time)
 *
 * NOTE: Requires @vercel/toolbar package to be installed:
 * npm install @vercel/toolbar
 */
export function LazyVercelToolbar() {
  const [ToolbarComponent, setToolbarComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Only load in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Dynamically import the toolbar - fails gracefully if not installed
    // @ts-expect-error - @vercel/toolbar is an optional dependency
    import("@vercel/toolbar")
      .then((mod) => {
        setToolbarComponent(() => mod.VercelToolbar);
      })
      .catch(() => {
        // Package not installed - this is fine, just don't render
        console.debug("@vercel/toolbar not installed, skipping toolbar");
      });
  }, []);

  if (!ToolbarComponent) {
    return null;
  }

  return <ToolbarComponent />;
}
