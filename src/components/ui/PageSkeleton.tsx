"use client";

/**
 * PageSkeleton - Loading skeleton for internal dashboard pages
 * Provides immediate visual feedback while data loads
 */
export function PageSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] [background-size:20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-8 flex animate-pulse flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 backdrop-blur-sm md:flex-row">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gray-800" />
            <div>
              <div className="mb-2 h-8 w-40 rounded bg-gray-800" />
              <div className="h-4 w-60 rounded bg-gray-800/50" />
            </div>
          </div>
          <div className="h-10 w-40 rounded-lg bg-gray-800" />
        </div>

        {/* Stats Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-4"
            >
              <div className="mb-2 h-8 w-20 rounded bg-gray-800" />
              <div className="h-4 w-32 rounded bg-gray-800/50" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6 flex gap-4 border-b border-gray-700">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
          <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
        </div>

        {/* Content Skeleton */}
        <div className="min-h-[400px] animate-pulse rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-800/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
