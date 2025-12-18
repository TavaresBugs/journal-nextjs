/**
 * Image Cache Hook with LRU eviction and TTL support
 *
 * Provides in-memory caching for image data (base64 strings) with:
 * - LRU (Least Recently Used) eviction when max items reached
 * - TTL (Time-To-Live) for automatic expiration
 * - Size tracking in bytes/MB
 * - Cleanup utilities for modal/component unmount
 *
 * @example
 * const { get, set, remove, clear, getStats } = useImageCache();
 *
 * // Cache an image
 * set('journal_123_daily', base64String);
 *
 * // Retrieve from cache
 * const cached = get('journal_123_daily');
 *
 * // Clear images for a specific journal on modal close
 * clear((key) => key.startsWith('journal_123'));
 */

import { useCallback, useRef, useEffect } from "react";

// ============================================
// Types
// ============================================

interface CacheEntry {
  data: string;
  timestamp: number;
  lastAccess: number;
  size: number; // bytes
}

interface ImageCacheOptions {
  /** Maximum number of items in cache (default: 30) */
  maxItems?: number;
  /** TTL in milliseconds (default: 10 minutes) */
  ttlMs?: number;
  /** Maximum total size in bytes (default: 50MB) */
  maxSizeBytes?: number;
}

interface CacheStats {
  count: number;
  sizeMB: number;
  oldestKey: string | null;
  newestKey: string | null;
}

// ============================================
// Singleton Cache Store
// ============================================

// Global cache store - shared across all hook instances
// This ensures cache persists across component remounts
const globalCache = new Map<string, CacheEntry>();

// Default configuration
const DEFAULT_MAX_ITEMS = 30;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate size of a string in bytes (UTF-8)
 */
function getStringByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Get total cache size in bytes
 */
function getTotalSize(): number {
  let total = 0;
  for (const entry of globalCache.values()) {
    total += entry.size;
  }
  return total;
}

/**
 * Find the least recently used key
 */
function findLRUKey(): string | null {
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of globalCache.entries()) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }

  return oldestKey;
}

/**
 * Remove expired entries based on TTL
 */
function removeExpired(ttlMs: number): number {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of globalCache.entries()) {
    if (now - entry.timestamp > ttlMs) {
      globalCache.delete(key);
      removed++;
    }
  }

  return removed;
}

/**
 * Evict entries until under limits
 */
function enforceLimits(maxItems: number, maxSizeBytes: number): void {
  // Evict by count
  while (globalCache.size > maxItems) {
    const lruKey = findLRUKey();
    if (lruKey) {
      globalCache.delete(lruKey);
    } else {
      break;
    }
  }

  // Evict by size
  while (getTotalSize() > maxSizeBytes && globalCache.size > 0) {
    const lruKey = findLRUKey();
    if (lruKey) {
      globalCache.delete(lruKey);
    } else {
      break;
    }
  }
}

// ============================================
// Hook Implementation
// ============================================

export function useImageCache(options: ImageCacheOptions = {}) {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    ttlMs = DEFAULT_TTL_MS,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  } = options;

  // Store options in ref to avoid stale closures
  const optionsRef = useRef({ maxItems, ttlMs, maxSizeBytes });

  // Update options in effect, not during render
  useEffect(() => {
    optionsRef.current = { maxItems, ttlMs, maxSizeBytes };
  }, [maxItems, ttlMs, maxSizeBytes]);

  /**
   * Get an item from cache
   * Updates lastAccess time on hit
   */
  const get = useCallback((key: string): string | null => {
    const entry = globalCache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > optionsRef.current.ttlMs) {
      globalCache.delete(key);
      return null;
    }

    // Update last access time
    entry.lastAccess = now;

    return entry.data;
  }, []);

  /**
   * Set an item in cache
   * Triggers LRU eviction if limits exceeded
   */
  const set = useCallback((key: string, data: string): void => {
    const now = Date.now();
    const size = getStringByteSize(data);

    // Don't cache if single item exceeds max size
    if (size > optionsRef.current.maxSizeBytes) {
      console.warn(
        `[ImageCache] Item exceeds max size (${(size / 1024 / 1024).toFixed(2)}MB), not caching`
      );
      return;
    }

    globalCache.set(key, {
      data,
      timestamp: now,
      lastAccess: now,
      size,
    });

    // Enforce limits after adding
    enforceLimits(optionsRef.current.maxItems, optionsRef.current.maxSizeBytes);
  }, []);

  /**
   * Remove a specific item from cache
   */
  const remove = useCallback((key: string): boolean => {
    return globalCache.delete(key);
  }, []);

  /**
   * Clear cache items, optionally filtered by a predicate
   *
   * @example
   * // Clear all items for a specific journal
   * clear((key) => key.startsWith('journal_123'));
   *
   * // Clear all items
   * clear();
   */
  const clear = useCallback((filter?: (key: string) => boolean): number => {
    if (!filter) {
      const count = globalCache.size;
      globalCache.clear();
      return count;
    }

    let removed = 0;
    for (const key of globalCache.keys()) {
      if (filter(key)) {
        globalCache.delete(key);
        removed++;
      }
    }

    return removed;
  }, []);

  /**
   * Run garbage collection: remove expired items and enforce limits
   */
  const cleanup = useCallback((): void => {
    removeExpired(optionsRef.current.ttlMs);
    enforceLimits(optionsRef.current.maxItems, optionsRef.current.maxSizeBytes);
  }, []);

  /**
   * Get cache statistics
   */
  const getStats = useCallback((): CacheStats => {
    let oldestKey: string | null = null;
    let newestKey: string | null = null;
    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [key, entry] of globalCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
        newestKey = key;
      }
    }

    return {
      count: globalCache.size,
      sizeMB: Number((getTotalSize() / 1024 / 1024).toFixed(2)),
      oldestKey,
      newestKey,
    };
  }, []);

  /**
   * Check if a key exists in cache (without updating access time)
   */
  const has = useCallback((key: string): boolean => {
    return globalCache.has(key);
  }, []);

  /**
   * Get all keys in cache
   */
  const keys = useCallback((): string[] => {
    return Array.from(globalCache.keys());
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    cleanup,
    getStats,
    has,
    keys,
  };
}

// ============================================
// Utility: Setup periodic cleanup
// ============================================

/**
 * Create a cleanup interval for automatic TTL enforcement
 * Call this once at app initialization
 *
 * @example
 * // In _app.tsx or layout.tsx
 * useEffect(() => {
 *   const stop = startCacheCleanupInterval();
 *   return stop;
 * }, []);
 */
export function startCacheCleanupInterval(intervalMs = 5 * 60 * 1000): () => void {
  const interval = setInterval(() => {
    const removed = removeExpired(DEFAULT_TTL_MS);
    if (removed > 0 && process.env.NODE_ENV === "development") {
      console.log(`[ImageCache] Cleanup: removed ${removed} expired items`);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

// ============================================
// Export cache reference for debugging
// ============================================

export const __debugCache = process.env.NODE_ENV === "development" ? globalCache : null;
