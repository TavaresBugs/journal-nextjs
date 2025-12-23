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

import { prismaTradeRepo } from "@/lib/repositories/prisma";
import { getCurrentUserId } from "@/lib/prisma/auth";
import { Trade } from "@/types";
import { revalidatePath } from "next/cache";

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
  pageSize: number = 20
): Promise<{ data: Trade[]; count: number }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], count: 0 };

    const offset = (page - 1) * pageSize;

    const [tradesResult, countResult] = await Promise.all([
      prismaTradeRepo.getByAccountId(accountId, userId, { limit: pageSize, offset }),
      prismaTradeRepo.countByAccountId(accountId, userId),
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
      const existing = await prismaTradeRepo.getById(trade.id);
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

    // Revalidate dashboard
    if (trade.accountId) {
      revalidatePath(`/dashboard/${trade.accountId}`, "page");
    }

    return { success: true, trade: result.data || undefined };
  } catch (error) {
    console.error("[saveTradeAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
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

    const result = await prismaTradeRepo.delete(tradeId, userId);

    if (result.error) {
      console.error("[deleteTradeAction] Error:", result.error);
      return { success: false, error: result.error.message };
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

    // Get all trades for this account first
    const tradesResult = await prismaTradeRepo.getByAccountId(accountId, userId);

    if (tradesResult.error) {
      console.error("[deleteTradesByAccountAction] Error fetching trades:", tradesResult.error);
      return { success: false, deletedCount: 0, error: tradesResult.error.message };
    }

    const trades = tradesResult.data || [];
    let deletedCount = 0;

    // Delete each trade
    for (const trade of trades) {
      const deleteResult = await prismaTradeRepo.delete(trade.id, userId);
      if (!deleteResult.error) {
        deletedCount++;
      }
    }

    // Revalidate dashboard
    revalidatePath(`/dashboard/${accountId}`, "page");

    return { success: true, deletedCount };
  } catch (error) {
    console.error("[deleteTradesByAccountAction] Unexpected error:", error);
    return { success: false, deletedCount: 0, error: "Unexpected error occurred" };
  }
}

/**
 * Get dashboard metrics for an account.
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

    const result = await prismaTradeRepo.getDashboardMetrics(accountId, userId);

    if (result.error) {
      console.error("[getTradeDashboardMetricsAction] Error:", result.error);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error("[getTradeDashboardMetricsAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Get trades associated with a journal entry.
 */
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
