"use client";

/**
 * Prefetch Hook for Account Data
 *
 * Provides prefetching capabilities for account-related data.
 * Used to preload data when user hovers over account links,
 * improving perceived navigation performance.
 *
 * @example
 * const { prefetchAccount, prefetchDashboardData } = usePrefetchAccountData();
 *
 * <Link
 *   href={`/dashboard/${account.id}`}
 *   onMouseEnter={() => prefetchAccount(account.id)}
 * >
 *   {account.name}
 * </Link>
 */

import { useCallback } from "react";

// Server actions for prefetching
import { getAccountById } from "@/app/actions/accounts";
import { getTradeDashboardMetricsAction } from "@/app/actions/trades";

/**
 * Hook to prefetch account data on hover.
 * Silently fetches data in the background to populate cache.
 */
export function usePrefetchAccountData() {
  /**
   * Prefetch basic account data.
   * Useful when hovering over account selector.
   */
  const prefetchAccount = useCallback(async (accountId: string) => {
    if (!accountId) return;

    try {
      // These calls will populate the unstable_cache
      await getAccountById(accountId);
    } catch {
      // Silently fail - prefetch is optional optimization
    }
  }, []);

  /**
   * Prefetch all dashboard data for an account.
   * Useful when user is likely to navigate to that dashboard.
   */
  const prefetchDashboardData = useCallback(async (accountId: string) => {
    if (!accountId) return;

    try {
      // Parallel prefetch of critical dashboard data
      await Promise.all([getAccountById(accountId), getTradeDashboardMetricsAction(accountId)]);
    } catch {
      // Silently fail - prefetch is optional optimization
    }
  }, []);

  /**
   * Prefetch data with delay (debounced hover).
   * Only triggers if user hovers for specified duration.
   */
  const prefetchWithDelay = useCallback(
    (accountId: string, delayMs: number = 150) => {
      let timeoutId: NodeJS.Timeout | null = null;

      const start = () => {
        timeoutId = setTimeout(() => {
          prefetchDashboardData(accountId);
        }, delayMs);
      };

      const cancel = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      return { start, cancel };
    },
    [prefetchDashboardData]
  );

  return {
    prefetchAccount,
    prefetchDashboardData,
    prefetchWithDelay,
  };
}

export default usePrefetchAccountData;
