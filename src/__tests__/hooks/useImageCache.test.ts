import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useImageCache, startCacheCleanupInterval } from "../../hooks/useImageCache";

describe("useImageCache", () => {
  // Helper to clear cache
  const clearCache = () => {
    const { result } = renderHook(() => useImageCache());
    result.current.clear();
  };

  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should set and get values", () => {
    const { result } = renderHook(() => useImageCache());
    const key = "k1";
    const val = "data";

    result.current.set(key, val);
    expect(result.current.has(key)).toBe(true);
    expect(result.current.get(key)).toBe(val);
  });

  it("should expire items after TTL", () => {
    const { result: hook } = renderHook(() => useImageCache({ ttlMs: 100 }));
    hook.current.set("k1", "data");

    expect(hook.current.get("k1")).toBe("data");

    // Advance time past TTL
    vi.advanceTimersByTime(150);

    expect(hook.current.get("k1")).toBeNull();
  });

  it("should evict LRU items when maxItems reached", () => {
    const { result: hook } = renderHook(() => useImageCache({ maxItems: 2 }));

    // Ensure distinct timestamps
    hook.current.set("k1", "d1");
    vi.advanceTimersByTime(10);

    hook.current.set("k2", "d2");
    vi.advanceTimersByTime(10);

    // Access k1 to make it recent
    hook.current.get("k1");
    vi.advanceTimersByTime(10);

    // k1 lastAccess > k2 lastAccess
    // k2 is LRU

    // Add k3, should evict k2
    hook.current.set("k3", "d3");

    expect(hook.current.has("k2"), "k2 should be evicted").toBe(false);
    expect(hook.current.has("k1"), "k1 should remain").toBe(true);
    expect(hook.current.has("k3"), "k3 should remain").toBe(true);
  });

  it("should evict LRU items when maxSizeBytes reached", () => {
    const { result: hook } = renderHook(() => useImageCache({ maxSizeBytes: 2 }));

    hook.current.set("k1", "a");
    vi.advanceTimersByTime(10);

    hook.current.set("k2", "b");
    vi.advanceTimersByTime(10);

    // k1 is LRU
    hook.current.set("k3", "c");

    expect(hook.current.has("k1")).toBe(false);
    expect(hook.current.has("k2")).toBe(true);
    expect(hook.current.has("k3")).toBe(true);
  });

  it("should return null for non-existent keys", () => {
    const { result } = renderHook(() => useImageCache());
    expect(result.current.get("missing")).toBeNull();
  });

  it("should remove specific key", () => {
    const { result } = renderHook(() => useImageCache());
    result.current.set("k1", "d1");
    expect(result.current.remove("k1")).toBe(true);
    expect(result.current.has("k1")).toBe(false);
  });

  it("should clear with filter", () => {
    const { result } = renderHook(() => useImageCache());
    result.current.set("a1", "d");
    result.current.set("a2", "d");
    result.current.set("b1", "d");

    const removed = result.current.clear((k) => k.startsWith("a"));

    expect(removed).toBe(2);
    expect(result.current.has("a1")).toBe(false);
    expect(result.current.has("b1")).toBe(true);
  });

  it("should cleanup manually", () => {
    const { result: hook } = renderHook(() => useImageCache({ ttlMs: 100 }));
    hook.current.set("k1", "d");
    vi.advanceTimersByTime(150);

    hook.current.cleanup();
    expect(hook.current.has("k1")).toBe(false);
  });

  it("should report stats", () => {
    const { result } = renderHook(() => useImageCache());
    result.current.set("k1", "d1");
    const stats = result.current.getStats();
    expect(stats.count).toBe(1);
    expect(stats.newestKey).toBe("k1");
  });

  it("should provide keys", () => {
    const { result } = renderHook(() => useImageCache());
    result.current.set("k1", "d");
    expect(result.current.keys()).toContain("k1");
  });

  it("should not cache if item exceeds max size", () => {
    const { result: hook } = renderHook(() => useImageCache({ maxSizeBytes: 1 }));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    hook.current.set("k1", "aa"); // 2 bytes

    expect(hook.current.has("k1")).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("startCacheCleanupInterval", () => {
  // Need to clear cache here too or ensure clean slate
  const clearCache = () => {
    const { result } = renderHook(() => useImageCache());
    result.current.clear();
  };

  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should clean periodically", () => {
    const { result: hook } = renderHook(() => useImageCache());
    hook.current.set("k1", "d");

    // Start cleanup every 1s
    const stop = startCacheCleanupInterval(1000);

    // Default TTL is 10 min (600,000 ms)
    // Advance slightly past it
    vi.advanceTimersByTime(600000 + 1000);

    // Now it should be gone
    expect(hook.current.has("k1")).toBe(false);

    stop();
  });
});
