/**
 * Prefetch Hook for Calendar Data
 *
 * Provides lazy loading capabilities for calendar interactions.
 * When user hovers over a day, preloads the data needed for DayDetailModal.
 * When DayDetailModal opens, preloads journal entry content for visible entries.
 *
 * This creates a "instant feel" navigation experience similar to MenteeDayDetailModal.
 *
 * @example
 * const { prefetchDayData, prefetchJournalContent, dayDataCache } = usePrefetchCalendarData(accountId);
 *
 * // In calendar cell onMouseEnter
 * onMouseEnter={() => prefetchDayData(dateStr, 150)}
 */

import { useCallback, useRef, useState } from "react";
import { getJournalEntriesAction } from "@/app/actions/journal";
import type { JournalEntry, DailyRoutine } from "@/types";

interface DayDataCache {
  entries: JournalEntry[];
  routines: DailyRoutine[];
  loadedAt: number;
}

interface PrefetchCalendarDataReturn {
  /**
   * Prefetch data for a specific day.
   * Call on hover with delay to avoid over-fetching.
   */
  prefetchDayData: (
    date: string,
    delayMs?: number
  ) => {
    start: () => void;
    cancel: () => void;
  };

  /**
   * Check if data for a date is already cached
   */
  isDayCached: (date: string) => boolean;

  /**
   * Get cached entries for a date (if available)
   */
  getCachedEntries: (date: string) => JournalEntry[] | null;

  /**
   * Prefetch data for days near a specific date (background loading)
   * Loads today ±3 days for instant navigation
   */
  prefetchNearbyDays: (centerDate: string) => void;

  /**
   * The internal cache (for debugging)
   */
  cache: Record<string, DayDataCache>;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function usePrefetchCalendarData(accountId: string): PrefetchCalendarDataReturn {
  const [cache, setCache] = useState<Record<string, DayDataCache>>({});
  const pendingRequests = useRef<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Internal function to actually load data for a date
   */
  const loadDayData = useCallback(
    async (date: string) => {
      // Skip if already loading or recently cached
      if (pendingRequests.current.has(date)) return;

      const cached = cache[date];
      if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
        return; // Still valid
      }

      pendingRequests.current.add(date);

      try {
        // Fetch journal entries for this date
        // NOTE: Routines are loaded separately via store, but we cache entries here
        const entries = await getJournalEntriesAction(accountId);
        const dayEntries = entries.filter((e) => e.date === date);

        setCache((prev) => ({
          ...prev,
          [date]: {
            entries: dayEntries,
            routines: [], // Routines loaded via store separately
            loadedAt: Date.now(),
          },
        }));
      } catch (error) {
        console.error(`[usePrefetchCalendarData] Error loading ${date}:`, error);
      } finally {
        pendingRequests.current.delete(date);
      }
    },
    [accountId, cache]
  );

  /**
   * Prefetch with delay (for hover events)
   */
  const prefetchDayData = useCallback(
    (date: string, delayMs: number = 150) => {
      const start = () => {
        // Cancel any existing timeout for this date
        const existingTimeout = timeoutRefs.current.get(date);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeoutId = setTimeout(() => {
          loadDayData(date);
          timeoutRefs.current.delete(date);
        }, delayMs);

        timeoutRefs.current.set(date, timeoutId);
      };

      const cancel = () => {
        const timeoutId = timeoutRefs.current.get(date);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutRefs.current.delete(date);
        }
      };

      return { start, cancel };
    },
    [loadDayData]
  );

  /**
   * Check if a date is cached
   */
  const isDayCached = useCallback(
    (date: string): boolean => {
      const cached = cache[date];
      return cached !== undefined && Date.now() - cached.loadedAt < CACHE_TTL_MS;
    },
    [cache]
  );

  /**
   * Get cached entries for a date
   */
  const getCachedEntries = useCallback(
    (date: string): JournalEntry[] | null => {
      const cached = cache[date];
      if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
        return cached.entries;
      }
      return null;
    },
    [cache]
  );

  /**
   * Prefetch nearby days in background
   * Prioritizes today, then spreads outward
   */
  const prefetchNearbyDays = useCallback(
    (centerDate: string) => {
      const center = new Date(centerDate);
      const daysToLoad = [0, -1, 1, -2, 2, -3, 3]; // Today first, then spread

      // Stagger loads to avoid overwhelming the server
      daysToLoad.forEach((offset, index) => {
        const targetDate = new Date(center);
        targetDate.setDate(targetDate.getDate() + offset);
        const dateStr = targetDate.toISOString().split("T")[0];

        // Delay each request by 100ms * index
        setTimeout(() => {
          if (!isDayCached(dateStr) && !pendingRequests.current.has(dateStr)) {
            loadDayData(dateStr);
          }
        }, 100 * index);
      });
    },
    [isDayCached, loadDayData]
  );

  return {
    prefetchDayData,
    isDayCached,
    getCachedEntries,
    prefetchNearbyDays,
    cache,
  };
}

export default usePrefetchCalendarData;
