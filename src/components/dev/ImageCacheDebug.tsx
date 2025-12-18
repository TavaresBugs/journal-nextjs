"use client";

import { useEffect, useState } from "react";
import { useImageCache, __debugCache } from "@/hooks/useImageCache";

/**
 * Debug panel for monitoring image cache in development mode.
 * Only renders in development environment.
 *
 * Shows:
 * - Number of cached images
 * - Total cache size in MB
 * - Clear cache button
 *
 * Position: Fixed bottom-right corner
 */
export function ImageCacheDebug() {
  const { getStats, clear, cleanup } = useImageCache();
  const [stats, setStats] = useState({
    count: 0,
    sizeMB: 0,
    oldestKey: null as string | null,
    newestKey: null as string | null,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Update stats periodically
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const updateStats = () => setStats(getStats());
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [getStats]);

  const handleClear = () => {
    const count = clear();
    console.log(`[ImageCacheDebug] Cleared ${count} items`);
    setStats(getStats());
  };

  const handleCleanup = () => {
    cleanup();
    console.log("[ImageCacheDebug] Ran cleanup");
    setStats(getStats());
  };

  return (
    <div
      className="fixed right-4 bottom-4 z-50 rounded-lg border border-cyan-500/30 bg-gray-900/95 font-mono text-xs shadow-lg backdrop-blur-sm"
      style={{ minWidth: isExpanded ? 280 : 160 }}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-t-lg px-3 py-2 transition-colors hover:bg-cyan-500/10"
      >
        <span className="font-semibold text-cyan-400">📷 ImgCache</span>
        <span className="text-gray-300">
          {stats.count} ({stats.sizeMB}MB)
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-2 border-t border-gray-700/50 px-3 pt-2 pb-3">
          {/* Stats */}
          <div className="space-y-1 text-gray-400">
            <div className="flex justify-between">
              <span>Items:</span>
              <span className="text-white">{stats.count}</span>
            </div>
            <div className="flex justify-between">
              <span>Size:</span>
              <span className="text-white">{stats.sizeMB} MB</span>
            </div>
            {stats.oldestKey && (
              <div className="flex justify-between">
                <span>Oldest:</span>
                <span className="max-w-[140px] truncate text-gray-300" title={stats.oldestKey}>
                  {stats.oldestKey.slice(0, 20)}...
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCleanup}
              className="flex-1 rounded bg-cyan-500/20 px-2 py-1 text-cyan-400 transition-colors hover:bg-cyan-500/30"
            >
              Cleanup
            </button>
            <button
              onClick={handleClear}
              className="flex-1 rounded bg-red-500/20 px-2 py-1 text-red-400 transition-colors hover:bg-red-500/30"
            >
              Clear All
            </button>
          </div>

          {/* Raw cache view button */}
          {__debugCache && (
            <button
              onClick={() => {
                if (!__debugCache) return;
                console.group("🖼️ Image Cache Contents");
                console.log("Stats:", getStats());
                console.log("Keys:", Array.from(__debugCache.keys()));
                console.table(
                  Array.from(__debugCache.entries()).map(([k, v]) => ({
                    key: k.slice(0, 30),
                    size: `${(v.size / 1024).toFixed(1)}KB`,
                    age: `${((Date.now() - v.timestamp) / 1000).toFixed(0)}s`,
                  }))
                );
                console.groupEnd();
              }}
              className="w-full rounded bg-gray-700/50 px-2 py-1 text-gray-400 transition-colors hover:bg-gray-700"
            >
              Log to Console
            </button>
          )}
        </div>
      )}
    </div>
  );
}
