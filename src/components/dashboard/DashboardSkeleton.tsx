"use client";

/**
 * DashboardSkeleton - Loading skeleton for the main dashboard page
 * Mirrors the structure of the dashboard with animated placeholders
 */
/**
 * Sub-components for granular loading states
 */
export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-6 flex animate-pulse items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Back Button Skeleton */}
        <div className="h-10 w-24 rounded-lg bg-gray-800" />
        <div className="h-6 w-px bg-gray-700" />
        {/* Account Name Skeleton */}
        <div>
          <div className="mb-2 h-7 w-48 rounded bg-gray-800" />
          <div className="h-4 w-32 rounded bg-gray-800/50" />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-gray-800" />
        <div className="h-12 w-12 rounded-xl bg-gray-800" />
        <div className="h-12 w-12 rounded-xl bg-gray-800" />
      </div>
    </div>
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col items-center justify-center rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/80 to-gray-800/40 p-4 text-center backdrop-blur-sm"
        >
          <div className="mb-2 h-6 w-6 rounded bg-gray-700" />
          <div className="mb-2 h-3 w-16 rounded bg-gray-700/50" />
          <div className="h-6 w-20 rounded bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

export function DashboardTabsSkeleton() {
  return (
    <div className="container mx-auto mt-6 px-4" style={{ maxWidth: "1200px" }}>
      <div className="flex animate-pulse gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-10 shrink-0 rounded-lg bg-gray-800 ${
              i === 1 ? "w-28 bg-gray-700" : "w-24"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4" style={{ maxWidth: "1200px" }}>
      <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        {/* Card Header */}
        <div className="border-b border-gray-800 p-6">
          <div className="h-6 w-40 rounded bg-gray-800" />
        </div>

        {/* Card Content */}
        <div className="space-y-6 p-6">
          {/* Form-like content skeleton */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 rounded bg-gray-800/50" />
                <div className="h-10 rounded-lg bg-gray-800" />
              </div>
            ))}
          </div>

          {/* Additional form fields skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-800/50" />
            <div className="h-24 rounded-lg bg-gray-800" />
          </div>

          {/* Submit button skeleton */}
          <div className="flex justify-end">
            <div className="h-12 w-40 rounded-lg bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton - Loading skeleton for the main dashboard page
 * Mirrors the structure of the dashboard with animated placeholders
 */
export function DashboardSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6" style={{ maxWidth: "1200px" }}>
            <h1 className="sr-only">Carregando Dashboard</h1>
            <DashboardHeaderSkeleton />
            <DashboardMetricsSkeleton />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <DashboardTabsSkeleton />

        {/* Content Area Skeleton */}
        <DashboardContentSkeleton />
      </div>
    </div>
  );
}
