/**
 * Prisma Storage Adapter
 *
 * Drop-in replacements for Supabase storage functions using Prisma.
 * These can be used to gradually migrate from Supabase to Prisma.
 *
 * @example
 * // In useTradeStore.ts, change:
 * import { getTradesPaginated } from '@/lib/storage';
 * // To:
 * import { getTradesPaginated } from '@/lib/prisma/storage';
 */

import { prismaTradeRepo, prismaJournalRepo } from "@/lib/repositories/prisma";
import type { Trade, TradeLite, JournalEntry } from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * Get current user ID from Supabase auth.
 */
async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
}

/**
 * Get trades with pagination using Prisma.
 * Same interface as the Supabase version.
 */
export async function getTradesPaginated(
  accountId: string,
  page: number,
  itemsPerPage: number
): Promise<{ data: Trade[]; count: number }> {
  const userId = await getCurrentUserId();

  const [tradesResult, countResult] = await Promise.all([
    prismaTradeRepo.getByAccountId(accountId, userId, {
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
    }),
    prismaTradeRepo.getCount(accountId, userId),
  ]);

  if (tradesResult.error) {
    console.error("Prisma getTradesPaginated error:", tradesResult.error);
    return { data: [], count: 0 };
  }

  return {
    data: tradesResult.data || [],
    count: countResult.data || 0,
  };
}

/**
 * Get lightweight trade history for charts using Prisma.
 * Same interface as the Supabase version.
 */
export async function getTradeHistoryLite(accountId: string): Promise<TradeLite[]> {
  const userId = await getCurrentUserId();

  const result = await prismaTradeRepo.getByAccountId(accountId, userId);

  if (result.error || !result.data) {
    console.error("Prisma getTradeHistoryLite error:", result.error);
    return [];
  }

  // Convert to TradeLite
  return result.data.map((trade) => ({
    id: trade.id,
    entryDate: trade.entryDate,
    entryTime: trade.entryTime,
    exitDate: trade.exitDate,
    exitTime: trade.exitTime,
    pnl: trade.pnl,
    outcome: trade.outcome,
    accountId: trade.accountId,
    symbol: trade.symbol,
    type: trade.type,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    lot: trade.lot,
    tags: trade.tags,
    strategy: trade.strategy,
    setup: trade.setup,
    tfAnalise: trade.tfAnalise,
    tfEntrada: trade.tfEntrada,
    session: trade.session,
    entry_quality: trade.entry_quality,
    market_condition_v2: trade.market_condition_v2,
    commission: trade.commission,
    swap: trade.swap,
  }));
}

/**
 * Save (create or update) a trade using Prisma.
 */
export async function saveTrade(trade: Trade): Promise<Trade | null> {
  const userId = await getCurrentUserId();

  // Check if trade exists
  const existing = await prismaTradeRepo.getById(trade.id);

  if (existing.data) {
    // Update
    const result = await prismaTradeRepo.update(trade.id, userId, trade);
    return result.data;
  } else {
    // Create
    const result = await prismaTradeRepo.create({ ...trade, userId });
    return result.data;
  }
}

/**
 * Delete a trade using Prisma.
 */
export async function deleteTrade(tradeId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const result = await prismaTradeRepo.delete(tradeId, userId);
  return result.data ?? false;
}

/**
 * Get dashboard metrics using Prisma.
 */
export async function getDashboardMetrics(accountId: string) {
  const userId = await getCurrentUserId();
  return prismaTradeRepo.getDashboardMetrics(accountId, userId);
}

/**
 * Get journal entries using Prisma.
 */
export async function getJournalEntries(accountId: string): Promise<JournalEntry[]> {
  const result = await prismaJournalRepo.getByAccountId(accountId);
  return result.data || [];
}

/**
 * Get journal entry by ID using Prisma.
 */
export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const result = await prismaJournalRepo.getById(id);
  return result.data;
}
