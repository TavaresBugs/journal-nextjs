"use server";

/**
 * Batch Dashboard Init Action
 *
 * Combines multiple server actions into a single call to reduce roundtrips.
 * This optimizes the dashboard init by making a single database connection
 * that fetches all critical data in parallel.
 *
 * @example
 * import { batchDashboardInitAction } from "@/app/actions/_batch/dashboardInit";
 * const data = await batchDashboardInitAction(accountId);
 */

import { prismaTradeRepo, prismaAccountRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { unstable_cache } from "next/cache";
import type { Trade, Account } from "@/types";

export interface DashboardInitResult {
  account: Account | null;
  metrics: {
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    totalPnl: number;
  } | null;
  trades: {
    data: Trade[];
    count: number;
  };
}

/**
 * Batch action to initialize dashboard data in a single request.
 * Reduces 3+ roundtrips to 1, saving ~100-200ms on dashboard init.
 *
 * @param accountId - The account ID to load data for
 * @param page - Page number for trades pagination (default: 1)
 * @param pageSize - Number of trades per page (default: 10)
 */
export async function batchDashboardInitAction(
  accountId: string,
  page: number = 1,
  pageSize: number = 10,
  skipAccount: boolean = false
): Promise<DashboardInitResult | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error("[batchDashboardInitAction] User not authenticated");
      return null;
    }

    const perfStart = performance.now();

    // Execute all queries in parallel with a single auth check
    const [accountResult, metricsResult, tradesResult, countResult] = await Promise.all([
      // 1. Get account (skip if already available)
      skipAccount
        ? Promise.resolve({ data: null, error: null })
        : prismaAccountRepo.getById(accountId, userId),

      // 2. Get cached metrics (60s TTL)
      unstable_cache(
        async (accId: string, uId: string) => {
          const result = await prismaTradeRepo.getDashboardMetrics(accId, uId);
          return result.error ? null : result.data;
        },
        [`dashboard-metrics-${accountId}`],
        {
          revalidate: 60,
          tags: [`trades:${accountId}`, `metrics:${accountId}`],
        }
      )(accountId, userId),

      // 3. Get paginated trades
      prismaTradeRepo.getByAccountId(accountId, userId, {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }] as any,
      }),

      // 4. Get total count
      prismaTradeRepo.countByAccountId(accountId, userId),
    ]);

    console.log(`✅ [Batch] Dashboard init: ${(performance.now() - perfStart).toFixed(0)}ms`);

    // Handle errors gracefully
    if (accountResult.error) {
      console.error("[batchDashboardInitAction] Account error:", accountResult.error);
      return null;
    }

    return {
      account: accountResult.data || null,
      metrics: metricsResult || null,
      trades: {
        data: tradesResult.data || [],
        count: countResult.data || 0,
      },
    };
  } catch (error) {
    console.error("[batchDashboardInitAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Lightweight version that only fetches account and metrics.
 * Use when trades are already cached client-side.
 */
export async function batchDashboardRefreshAction(
  accountId: string
): Promise<Pick<DashboardInitResult, "account" | "metrics"> | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const [accountResult, metricsResult] = await Promise.all([
      prismaAccountRepo.getById(accountId, userId),
      unstable_cache(
        async (accId: string, uId: string) => {
          const result = await prismaTradeRepo.getDashboardMetrics(accId, uId);
          return result.error ? null : result.data;
        },
        [`dashboard-metrics-${accountId}`],
        {
          revalidate: 60,
          tags: [`trades:${accountId}`, `metrics:${accountId}`],
        }
      )(accountId, userId),
    ]);

    return {
      account: accountResult.data || null,
      metrics: metricsResult || null,
    };
  } catch (error) {
    console.error("[batchDashboardRefreshAction] Unexpected error:", error);
    return null;
  }
}
