"use server";

/**
 * Prisma Trade Server Actions
 *
 * Server-side actions for trade operations using Prisma.
 * These can be called from client-side stores safely.
 *
 * @example
 * import { fetchTrades } from '@/actions/trades';
 * const trades = await fetchTrades(accountId, 1, 10);
 */

import { prismaTradeRepo } from "@/lib/database/repositories";
import { createClient } from "@/lib/supabase/server";
import type { Trade, TradeLite } from "@/types";

/**
 * Get current user ID from Supabase auth.
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Fetch paginated trades for an account.
 */
export async function fetchTrades(
  accountId: string,
  page: number,
  itemsPerPage: number,
  sortDirection: "asc" | "desc" = "desc",
  filterAsset?: string
): Promise<{ data: Trade[]; count: number }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("[fetchTrades] User not authenticated");
    return { data: [], count: 0 };
  }

  const orderBy = [{ entry_date: sortDirection }, { entry_time: sortDirection }];

  const [tradesResult, countResult] = await Promise.all([
    prismaTradeRepo.getByAccountId(accountId, userId, {
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: orderBy as any,
      symbol: filterAsset,
    }),
    prismaTradeRepo.countByAccountId(accountId, userId, filterAsset),
  ]);

  if (tradesResult.error) {
    console.error("[fetchTrades] Error:", tradesResult.error);
    return { data: [], count: 0 };
  }

  return {
    data: tradesResult.data || [],
    count: countResult.data || 0,
  };
}

/**
 * Fetch lightweight trade history for charts.
 */
export async function fetchTradeHistory(accountId: string): Promise<TradeLite[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("[fetchTradeHistory] User not authenticated");
    return [];
  }

  // Use the optimized repository method that selects only necessary fields
  const result = await prismaTradeRepo.getHistoryLite(accountId, userId);

  if (result.error || !result.data) {
    console.error("[fetchTradeHistory] Error:", result.error);
    return [];
  }

  return result.data;
}

/**
 * Fetch trades by date range for calendar/charts.
 */
export async function fetchTradesByDateRange(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<TradeLite[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("[fetchTradesByDateRange] User not authenticated");
    return [];
  }

  const result = await prismaTradeRepo.getHistoryLite(accountId, userId, {
    start: startDate,
    end: endDate,
  });

  if (result.error || !result.data) {
    console.error("[fetchTradesByDateRange] Error:", result.error);
    return [];
  }

  return result.data;
}

/**
 * Create a new trade.
 */
export async function createTrade(trade: Partial<Trade>): Promise<Trade> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const result = await prismaTradeRepo.create({ ...trade, userId });

  if (result.error) {
    console.error("[createTrade] Error:", result.error);
    throw new Error(result.error.message || "Failed to create trade");
  }

  return result.data!;
}

/**
 * Update an existing trade.
 */
export async function updateTrade(tradeId: string, data: Partial<Trade>): Promise<Trade> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const result = await prismaTradeRepo.update(tradeId, userId, data);

  if (result.error) {
    console.error("[updateTrade] Error:", result.error);
    throw new Error(result.error.message || "Failed to update trade");
  }

  return result.data!;
}

/**
 * Delete a trade.
 */
export async function deleteTradePrisma(tradeId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("[deleteTrade] User not authenticated");
    return false;
  }

  const result = await prismaTradeRepo.delete(tradeId, userId);
  return result.data ?? false;
}

/**
 * Get dashboard metrics.
 */
export async function fetchDashboardMetrics(accountId: string) {
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("[fetchDashboardMetrics] User not authenticated");
    return null;
  }

  const result = await prismaTradeRepo.getDashboardMetrics(accountId, userId);

  if (result.error) {
    console.error("[fetchDashboardMetrics] Error:", result.error);
    return null;
  }

  return result.data;
}
