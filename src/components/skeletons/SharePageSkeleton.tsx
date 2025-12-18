import React from "react";

/**
 * Skeleton loader for the Share Page
 * Mimics the exact layout of the content: Header, Market Conditions (3x3), Images (2x).
 */
export function SharePageSkeleton() {
  return (
    <div className="relative min-h-screen px-4 py-12">
      {/* Fixed Background (Simulated) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(/images/share-bg.jpg)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-12 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-4 h-8 w-48 rounded-full border border-gray-700/50 bg-gray-800/50" />
          {/* Title */}
          <div className="mb-4 h-10 w-3/4 max-w-md rounded-lg bg-gray-700/50" />
          {/* Date/Asset */}
          <div className="h-5 w-40 rounded-full bg-gray-800/50" />
        </div>

        {/* Market Conditions Skeleton (Matches MarketConditionsCard) */}
        <div className="mb-8 rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
          {/* Card Header */}
          <div className="mb-6 h-7 w-56 rounded bg-gray-700/50" />

          {/* Grid: 1 col mobile, 3 cols desktop */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Repeat 9 times for the 3x3 grid items */}
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                {/* Label */}
                <div className="mx-auto h-3 w-24 rounded bg-gray-800" />
                {/* Value Box */}
                <div className="h-[42px] rounded-lg border border-gray-800 bg-gray-900/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Images Skeleton */}
        <div className="mb-8">
          <div className="mb-4 h-7 w-32 rounded bg-gray-700/50" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 2 Image Placeholders */}
            <div className="aspect-video rounded-lg border border-gray-700/50 bg-gray-800/50" />
            <div className="aspect-video rounded-lg border border-gray-700/50 bg-gray-800/50" />
          </div>
        </div>

        {/* Text Content Skeleton */}
        <div className="space-y-6">
          {/* Emotion */}
          <div className="h-32 rounded-lg border border-gray-700/50 bg-gray-800/30 p-6" />
          {/* Analysis */}
          <div className="h-48 rounded-lg border border-gray-700/50 bg-gray-800/30 p-6" />
        </div>
      </div>
    </div>
  );
}
