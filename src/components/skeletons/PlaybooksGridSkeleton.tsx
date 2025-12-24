export function PlaybooksGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50"
        >
          {/* Header */}
          <div className="border-b border-gray-700/50 p-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-5 w-32 rounded bg-gray-700" />
                  <div className="h-3 w-20 rounded bg-gray-700/50" />
                </div>
              </div>
              <div className="h-8 w-12 rounded-lg bg-gray-700" />
            </div>
          </div>

          {/* Metrics */}
          <div className="p-5">
            <div className="mb-5 flex items-center justify-between gap-6">
              {/* Circle */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-[90px] w-[90px] rounded-full border-8 border-gray-700" />
                <div className="h-3 w-12 rounded bg-gray-700/50" />
              </div>

              {/* PnL */}
              <div className="flex-1 space-y-2">
                <div className="h-3 w-12 rounded bg-gray-700/50" />
                <div className="h-8 w-full rounded bg-gray-700" />
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-3 w-10 rounded bg-gray-700/50" />
                  <div className="h-6 w-16 rounded bg-gray-700" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-16 rounded bg-gray-700/50" />
                  <div className="h-6 w-8 rounded bg-gray-700" />
                </div>
              </div>
            </div>

            {/* Author */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gray-700" />
                <div className="h-4 w-24 rounded bg-gray-700" />
              </div>
              <div className="h-4 w-8 rounded bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
