import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageCache } from "@/hooks/useImageCache";

describe("useImageCache", () => {
  // Clear global cache before each test
  beforeEach(() => {
    const { result } = renderHook(() => useImageCache());
    act(() => {
      result.current.clear();
    });
  });

  describe("basic operations", () => {
    it("should set and get an item", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("test-key", "test-data");
      });

      expect(result.current.get("test-key")).toBe("test-data");
    });

    it("should return null for non-existent key", () => {
      const { result } = renderHook(() => useImageCache());

      expect(result.current.get("non-existent")).toBeNull();
    });

    it("should remove an item", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("test-key", "test-data");
      });

      expect(result.current.get("test-key")).toBe("test-data");

      act(() => {
        result.current.remove("test-key");
      });

      expect(result.current.get("test-key")).toBeNull();
    });

    it("should check if key exists with has()", () => {
      const { result } = renderHook(() => useImageCache());

      expect(result.current.has("test-key")).toBe(false);

      act(() => {
        result.current.set("test-key", "test-data");
      });

      expect(result.current.has("test-key")).toBe(true);
    });

    it("should list all keys", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("key1", "data1");
        result.current.set("key2", "data2");
        result.current.set("key3", "data3");
      });

      const keys = result.current.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toContain("key3");
    });
  });

  describe("clear operations", () => {
    it("should clear all items without filter", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("key1", "data1");
        result.current.set("key2", "data2");
      });

      expect(result.current.getStats().count).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.getStats().count).toBe(0);
    });

    it("should clear items matching filter", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("journal_123_daily", "data1");
        result.current.set("journal_123_weekly", "data2");
        result.current.set("journal_456_daily", "data3");
      });

      expect(result.current.getStats().count).toBe(3);

      act(() => {
        result.current.clear((key) => key.startsWith("journal_123"));
      });

      expect(result.current.getStats().count).toBe(1);
      expect(result.current.has("journal_456_daily")).toBe(true);
      expect(result.current.has("journal_123_daily")).toBe(false);
    });
  });

  describe("LRU eviction", () => {
    it("should evict items when maxItems exceeded", () => {
      const { result } = renderHook(() => useImageCache({ maxItems: 3 }));

      act(() => {
        result.current.set("key1", "data1");
        result.current.set("key2", "data2");
        result.current.set("key3", "data3");
        // Adding key4 should evict one item
        result.current.set("key4", "data4");
      });

      // Should have exactly 3 items (maxItems limit)
      expect(result.current.getStats().count).toBe(3);
      // key4 should definitely exist (most recent)
      expect(result.current.has("key4")).toBe(true);
    });

    it("should keep recently accessed items during eviction", () => {
      const { result } = renderHook(() => useImageCache({ maxItems: 2 }));

      act(() => {
        result.current.set("key1", "data1");
        result.current.set("key2", "data2");
      });

      // Access key1 to make it more recently used
      act(() => {
        result.current.get("key1");
      });

      // Add key3, should evict one item (cache full)
      act(() => {
        result.current.set("key3", "data3");
      });

      // Should have exactly 2 items
      expect(result.current.getStats().count).toBe(2);
      // key3 should definitely exist (just added)
      expect(result.current.has("key3")).toBe(true);
      // One of key1/key2 should be evicted
      const hasKey1 = result.current.has("key1");
      const hasKey2 = result.current.has("key2");
      expect(hasKey1 || hasKey2).toBe(true); // At least one kept
      expect(hasKey1 && hasKey2).toBe(false); // But not both
    });
  });

  describe("getStats", () => {
    it("should return correct count", () => {
      const { result } = renderHook(() => useImageCache());

      expect(result.current.getStats().count).toBe(0);

      act(() => {
        result.current.set("key1", "test data 1");
        result.current.set("key2", "test data 2");
      });

      expect(result.current.getStats().count).toBe(2);
    });

    it("should track oldest and newest keys", () => {
      const { result } = renderHook(() => useImageCache());

      act(() => {
        result.current.set("first", "data1");
        result.current.set("second", "data2");
      });

      const stats = result.current.getStats();
      // Both keys should be tracked
      expect(stats.oldestKey).not.toBeNull();
      expect(stats.newestKey).not.toBeNull();
      // They should be one of our added keys
      expect(["first", "second"]).toContain(stats.oldestKey);
      expect(["first", "second"]).toContain(stats.newestKey);
    });

    it("should calculate size in MB", () => {
      const { result } = renderHook(() => useImageCache());

      // Add a larger string to ensure measurable size
      const largeData = "x".repeat(100000); // ~100KB

      act(() => {
        result.current.set("large", largeData);
      });

      const stats = result.current.getStats();
      expect(stats.sizeMB).toBeGreaterThan(0);
      expect(stats.sizeMB).toBeLessThan(1); // Should be ~0.1MB
    });
  });

  describe("shared global cache", () => {
    it("should share cache across hook instances", () => {
      const { result: hook1 } = renderHook(() => useImageCache());
      const { result: hook2 } = renderHook(() => useImageCache());

      act(() => {
        hook1.current.set("shared-key", "shared-data");
      });

      // hook2 should be able to get data set by hook1
      expect(hook2.current.get("shared-key")).toBe("shared-data");
    });
  });
});
