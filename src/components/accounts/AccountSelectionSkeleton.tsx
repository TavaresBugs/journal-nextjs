"use client";

/**
 * AccountSelectionSkeleton - Loading skeleton for the account selection page
 * Mirrors the structure of the home page with animated placeholders
 */
export function AccountSelectionSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] [background-size:20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-6">
        {/* Header Box Skeleton */}
        <div className="mb-8 flex animate-pulse flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur-sm md:flex-row">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gray-800" />
            <div>
              <div className="mb-2 h-8 w-48 rounded bg-gray-800" />
              <div className="h-4 w-40 rounded bg-gray-800/50" />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-48 rounded-lg bg-gray-800/50 md:block" />
            <div className="h-12 w-12 rounded-lg bg-gray-800" />
            <div className="h-12 w-12 rounded-lg bg-gray-800" />
          </div>
        </div>

        {/* Summary Section Skeleton - 3 cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 h-4 w-24 rounded bg-gray-800/50" />
              <div className="h-9 w-32 rounded bg-gray-800" />
            </div>
          ))}
        </div>

        {/* Section Title Skeleton */}
        <div className="mb-8 flex animate-pulse items-center justify-between">
          <div className="h-7 w-40 rounded bg-gray-800" />
        </div>

        {/* Account Cards Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm"
            >
              {/* Card Header */}
              <div className="mb-6 h-6 w-32 rounded bg-gray-800" />

              {/* Balance Section */}
              <div className="mb-4">
                <div className="mb-2 h-4 w-20 rounded bg-gray-800/50" />
                <div className="h-8 w-36 rounded bg-gray-800" />
              </div>

              {/* P&L Section */}
              <div className="mb-4">
                <div className="mb-2 h-4 w-16 rounded bg-gray-800/50" />
                <div className="h-6 w-28 rounded bg-gray-800" />
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-2 gap-2 border-t border-gray-700 pt-4">
                <div>
                  <div className="mb-1 h-3 w-16 rounded bg-gray-800/30" />
                  <div className="h-5 w-12 rounded bg-gray-800/50" />
                </div>
                <div>
                  <div className="mb-1 h-3 w-14 rounded bg-gray-800/30" />
                  <div className="h-5 w-10 rounded bg-gray-800/50" />
                </div>
              </div>
            </div>
          ))}

          {/* New Wallet Card Skeleton */}
          <div className="flex h-full min-h-[300px] animate-pulse flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 bg-gray-900/20">
            <div className="mb-4 h-16 w-16 rounded-full bg-gray-800" />
            <div className="h-5 w-28 rounded bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
