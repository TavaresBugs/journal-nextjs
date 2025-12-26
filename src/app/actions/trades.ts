"use server";

/**
 * Trade Server Actions
 *
 * Server-side actions for trade operations using Prisma ORM.
 * These actions run exclusively on the server and can be called from client components.
 *
 * @example
 * import { getTradesAction, saveTradeAction } from "@/app/actions/trades";
 *
 * const trades = await getTradesAction(accountId);
 * const success = await saveTradeAction(tradeData);
 */

import { prismaTradeRepo } from "@/lib/database/repositories";
import { prisma } from "@/lib/database"; // Direct access for journal link checks
import { getCurrentUserId } from "@/lib/database/auth";
import { Trade, TradeLite } from "@/types";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Get all trades for an account.
 */
export async function getTradesAction(accountId: string): Promise<Trade[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaTradeRepo.getByAccountId(accountId, userId);

    if (result.error) {
      console.error("[getTradesAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getTradesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a single trade by ID.
 */
export async function getTradeAction(tradeId: string): Promise<Trade | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaTradeRepo.getById(tradeId, userId);

    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getTradeAction] Error:", result.error);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getTradeAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Get multiple trades by IDs.
 */
export async function getTradesByIdsAction(tradeIds: string[]): Promise<Trade[]> {
  try {
    if (!tradeIds || tradeIds.length === 0) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaTradeRepo.getMany({
      where: {
        id: { in: tradeIds },
        user_id: userId,
      },
    });

    if (result.error) {
      console.error("[getTradesByIdsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getTradesByIdsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get trades with pagination.
 */

export async function getTradesPaginatedAction(
  accountId: string,
  page: number = 1,
  pageSize: number = 20,
  sortDirection: "asc" | "desc" = "desc",
  filterAsset?: string
): Promise<{ data: Trade[]; count: number }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], count: 0 };

    const offset = (page - 1) * pageSize;

    // Use entry_date and entry_time for consistent sorting
    const orderBy = [{ entry_date: sortDirection }, { entry_time: sortDirection }];

    const [tradesResult, countResult] = await Promise.all([
      prismaTradeRepo.getByAccountId(accountId, userId, {
        limit: pageSize,
        offset,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: orderBy as any, // Cast to any to avoid complex Prisma type matching issues in action
        symbol: filterAsset,
      }),
      prismaTradeRepo.countByAccountId(accountId, userId, filterAsset),
    ]);

    if (tradesResult.error || countResult.error) {
      console.error("[getTradesPaginatedAction] Error:", tradesResult.error || countResult.error);
      return { data: [], count: 0 };
    }

    return {
      data: tradesResult.data || [],
      count: countResult.data || 0,
    };
  } catch (error) {
    console.error("[getTradesPaginatedAction] Unexpected error:", error);
    return { data: [], count: 0 };
  }
}

/**
 * Save (create or update) a trade.
 */
export async function saveTradeAction(
  trade: Partial<Trade>
): Promise<{ success: boolean; trade?: Trade; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const tradeWithUser = { ...trade, userId };

    let result;
    if (trade.id) {
      // Check if exists for update vs create
      const existing = await prismaTradeRepo.getById(trade.id, userId);
      if (existing.data) {
        result = await prismaTradeRepo.update(trade.id, userId, tradeWithUser);
      } else {
        result = await prismaTradeRepo.create(tradeWithUser);
      }
    } else {
      result = await prismaTradeRepo.create(tradeWithUser);
    }

    if (result.error) {
      console.error("[saveTradeAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard and cache tags
    if (trade.accountId) {
      // NOTE: Balance sync is now handled automatically by SQL trigger
      // See: prisma/migrations/add_balance_sync_trigger.sql

      // SYNC JOURNAL DATE: If trade date changed, check/update linked journal
      if (trade.id && trade.entryDate && userId) {
        // Run in background (fire and forget) to not block UI
        syncJournalDates(trade.id, trade.entryDate, userId, trade.accountId).catch((err) =>
          console.error("[saveTradeAction] Journal sync failed:", err)
        );
      }

      // Invalidate cached metrics and history (Next.js 15 requires profile arg)
      revalidateTag(`trades:${trade.accountId}`, "max");
      revalidatePath(`/dashboard/${trade.accountId}`, "page");
    }

    return { success: true, trade: result.data || undefined };
  } catch (error) {
    console.error("[saveTradeAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Save multiple trades in batch.
 * Optimized for imports to reduce overhead.
 */
export async function saveTradesBatchAction(
  trades: Partial<Trade>[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, count: 0, error: "Not authenticated" };
    }

    if (trades.length === 0) {
      return { success: true, count: 0 };
    }

    // Attach userId to all trades
    const tradesWithUser = trades.map((t) => ({ ...t, userId }));

    // Assume all trades belong to the same account for optimization
    const accountId = trades[0].accountId;

    // Use createMany for bulk insertion (much faster)
    const result = await prismaTradeRepo.createMany(tradesWithUser);

    if (result.error) {
      console.error("[saveTradesBatchAction] Error:", result.error);
      return { success: false, count: 0, error: result.error.message };
    }

    // Revalidate cache (balance sync is handled by SQL trigger)
    if (accountId) {
      revalidateTag(`trades:${accountId}`, "max");
      revalidatePath(`/dashboard/${accountId}`, "page");
    }

    return { success: true, count: result.data?.count || 0 };
  } catch (error) {
    console.error("[saveTradesBatchAction] Unexpected error:", error);
    return { success: false, count: 0, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a trade.
 */
export async function deleteTradeAction(
  tradeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Get trade info first to know the accountId for sync
    const tradeCheck = await prismaTradeRepo.getById(tradeId, userId);
    const accountId = tradeCheck.data?.accountId;

    const result = await prismaTradeRepo.delete(tradeId, userId);

    if (result.error) {
      console.error("[deleteTradeAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    if (accountId) {
      // NOTE: Balance sync is handled by SQL trigger
      // Invalidate cached metrics and history
      revalidateTag(`trades:${accountId}`, "max");
      // Revalidate to reflect changes
      revalidatePath(`/dashboard/${accountId}`, "page");
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteTradeAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete all trades for an account.
 */
export async function deleteTradesByAccountAction(
  accountId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, deletedCount: 0, error: "Not authenticated" };
    }

    // Use optimized bulk deletion
    const deleteResult = await prismaTradeRepo.deleteByAccountId(accountId, userId);

    if (deleteResult.error) {
      console.error("[deleteTradesByAccountAction] Error deleting trades:", deleteResult.error);
      return { success: false, deletedCount: 0, error: deleteResult.error.message };
    }

    const deletedCount = deleteResult.data || 0;

    // NOTE: Balance sync is handled by SQL trigger for each deleted trade
    // Invalidate cached metrics and history
    revalidateTag(`trades:${accountId}`, "max");
    // Revalidate dashboard
    revalidatePath(`/dashboard/${accountId}`, "page");

    return { success: true, deletedCount };
  } catch (error) {
    console.error("[deleteTradesByAccountAction] Unexpected error:", error);
    return { success: false, deletedCount: 0, error: "Unexpected error occurred" };
  }
}

// NOTE: syncAccountBalance helper removed - now handled by SQL trigger
// See: prisma/migrations/add_balance_sync_trigger.sql

/**
 * Get dashboard metrics for an account.
 * CACHED: 60 seconds TTL, invalidated when trades change.
 */
export async function getTradeDashboardMetricsAction(accountId: string): Promise<{
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
} | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Use unstable_cache for time-based caching
    const getCachedMetrics = unstable_cache(
      async (accId: string, uId: string) => {
        const result = await prismaTradeRepo.getDashboardMetrics(accId, uId);
        if (result.error) {
          console.error("[getTradeDashboardMetricsAction] Error:", result.error);
          return null;
        }
        return result.data || null;
      },
      [`dashboard-metrics-${accountId}`],
      {
        revalidate: 60, // 60 seconds TTL
        tags: [`trades:${accountId}`, `metrics:${accountId}`],
      }
    );

    return await getCachedMetrics(accountId, userId);
  } catch (error) {
    console.error("[getTradeDashboardMetricsAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Get lightweight trade history for analytics.
 * CACHED: 60 seconds TTL, invalidated when trades change.
 *
 * @param accountId - Account to fetch trades for
 * @param options - Optional filters:
 *   - dateFrom: Start date (YYYY-MM-DD) to filter trades (inclusive)
 *   - dateTo: End date (YYYY-MM-DD) to filter trades (inclusive)
 *   - limit: Maximum number of trades to return (for pagination)
 */
export async function getTradeHistoryLiteAction(
  accountId: string,
  options?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<TradeLite[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Build date range if provided
    const dateRange = options?.dateFrom
      ? {
          start: new Date(options.dateFrom),
          end: options?.dateTo ? new Date(options.dateTo) : new Date(),
        }
      : undefined;

    // Build cache key based on options
    const cacheKey = dateRange
      ? `trade-history-${accountId}-${options?.dateFrom}-${options?.dateTo}`
      : `trade-history-${accountId}`;

    // Use unstable_cache for time-based caching
    const getCachedHistory = unstable_cache(
      async (accId: string, uId: string) => {
        const result = await prismaTradeRepo.getHistoryLite(accId, uId, dateRange);
        if (result.error) {
          console.error("[getTradeHistoryLiteAction] Error:", result.error);
          return [];
        }

        // Apply limit if specified
        if (options?.limit && result.data) {
          return result.data.slice(0, options.limit);
        }

        return result.data || [];
      },
      [cacheKey],
      {
        revalidate: 60, // 60 seconds TTL
        tags: [`trades:${accountId}`, `history:${accountId}`],
      }
    );

    return await getCachedHistory(accountId, userId);
  } catch (error) {
    console.error("[getTradeHistoryLiteAction] Unexpected error:", error);
    return [];
  }
}
export async function getTradesByJournalAction(journalId: string): Promise<Trade[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaTradeRepo.getByJournalId(journalId);

    if (result.error) {
      console.error("[getTradesByJournalAction] Error:", result.error);
      return [];
    }

    // Filter for user ownership
    return (result.data || []).filter((t) => t.userId === userId);
  } catch (error) {
    console.error("[getTradesByJournalAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get advanced metrics for analytics (Sharpe, Calmar, streaks, etc).
 * CACHED: 60 seconds TTL, invalidated when trades change.
 * OPTIMIZED: Calculated server-side using SQL instead of client-side JS.
 */
export async function getAdvancedMetricsAction(
  accountId: string,
  initialBalance: number
): Promise<{
  avgPnl: number;
  pnlStdDev: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  calmarRatio: number;
  currentStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
} | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Use unstable_cache for time-based caching
    const getCachedAdvancedMetrics = unstable_cache(
      async (accId: string, uId: string, balance: number) => {
        const result = await prismaTradeRepo.getAdvancedMetrics(accId, uId, balance);
        if (result.error) {
          console.error("[getAdvancedMetricsAction] Error:", result.error);
          return null;
        }
        return result.data || null;
      },
      [`advanced-metrics-${accountId}`],
      {
        revalidate: 60, // 60 seconds TTL
        tags: [`trades:${accountId}`, `metrics:${accountId}`],
      }
    );

    return await getCachedAdvancedMetrics(accountId, userId, initialBalance);
  } catch (error) {
    console.error("[getAdvancedMetricsAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Helper to sync journal date with trade date.
 * If a trade date changes and it's linked to a journal:
 * 1. If it's the ONLY trade in that journal -> Update journal date to match.
 * 2. If there are other trades -> Do nothing (safety).
 */
async function syncJournalDates(
  tradeId: string,
  newDate: Date | string,
  userId: string,
  accountId: string
) {
  try {
    // 1. Find journals linked to this trade
    const links = await prisma.journal_entry_trades.findMany({
      where: { trade_id: tradeId },
      include: {
        journal_entries: {
          include: {
            journal_entry_trades: true,
          },
        },
      },
    });

    if (links.length === 0) return;

    for (const link of links) {
      const journal = link.journal_entries;
      if (!journal) continue;

      // Security check
      if (journal.user_id !== userId) continue;

      // Check for other trades
      const otherTrades = journal.journal_entry_trades.filter((t) => t.trade_id !== tradeId);

      // Only auto-update if this is the exclusive trade defining this journal
      if (otherTrades.length === 0) {
        const dateObj = new Date(newDate);
        // Compare dates (ignoring time for safety, though journal date is usually date-only)
        const journalDateStr = journal.date.toISOString().split("T")[0];
        const newDateStr = dateObj.toISOString().split("T")[0];

        if (journalDateStr !== newDateStr) {
          console.log(
            `[Sync] Updating journal ${journal.id} date from ${journalDateStr} to ${newDateStr}`
          );

          await prisma.journal_entries.update({
            where: { id: journal.id },
            data: { date: dateObj },
          });

          // Invalidate journal cache
          revalidateTag(`journals:${accountId}`, "max");
        }
      }
    }
  } catch (error) {
    console.error("[syncJournalDates] Error syncing dates:", error);
    // Don't throw, just log. This is a background maintenance task.
  }
}
