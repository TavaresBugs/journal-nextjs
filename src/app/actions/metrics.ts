"use server";

/**
 * Account Metrics Server Actions
 *
 * Server-side actions for fetching pre-calculated account metrics.
 * These metrics are stored in the account_metrics table and updated
 * automatically via SQL trigger when trades change.
 */

import { prisma } from "@/lib/database";
import { getCurrentUserId } from "@/lib/database/auth";

export interface AccountMetrics {
  accountId: string;
  userId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  sharpeRatio: number;
  avgPnl: number;
  pnlStdDev: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: number;
  currentStreakType: "win" | "loss" | "none";
  weekdayStats: Record<string, { trades: number; wins: number; pnl: number }>;
  updatedAt: string;
}

/**
 * Get pre-calculated metrics for an account.
 * These are updated automatically via SQL trigger when trades change.
 * Response time: ~5-10ms (vs 200-500ms calculating on demand)
 */
export async function getAccountMetricsAction(accountId: string): Promise<AccountMetrics | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const metrics = await prisma.account_metrics.findUnique({
      where: { account_id: accountId },
    });

    if (!metrics) {
      // Return empty metrics if none exist yet
      return {
        accountId,
        userId,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
        winRate: 0,
        totalPnl: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        sharpeRatio: 0,
        avgPnl: 0,
        pnlStdDev: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        currentStreak: 0,
        currentStreakType: "none",
        weekdayStats: {
          "0": { trades: 0, wins: 0, pnl: 0 },
          "1": { trades: 0, wins: 0, pnl: 0 },
          "2": { trades: 0, wins: 0, pnl: 0 },
          "3": { trades: 0, wins: 0, pnl: 0 },
          "4": { trades: 0, wins: 0, pnl: 0 },
          "5": { trades: 0, wins: 0, pnl: 0 },
          "6": { trades: 0, wins: 0, pnl: 0 },
        },
        updatedAt: new Date().toISOString(),
      };
    }

    // Security check - user must own the account
    if (metrics.user_id !== userId) {
      console.warn(
        `[getAccountMetricsAction] User ${userId} tried to access metrics for account ${accountId}`
      );
      return null;
    }

    return {
      accountId: metrics.account_id,
      userId: metrics.user_id,
      totalTrades: metrics.total_trades,
      wins: metrics.wins,
      losses: metrics.losses,
      breakeven: metrics.breakeven,
      winRate: Number(metrics.win_rate),
      totalPnl: Number(metrics.total_pnl),
      profitFactor: Number(metrics.profit_factor),
      avgWin: Number(metrics.avg_win),
      avgLoss: Number(metrics.avg_loss),
      largestWin: Number(metrics.largest_win),
      largestLoss: Number(metrics.largest_loss),
      sharpeRatio: Number(metrics.sharpe_ratio),
      avgPnl: Number(metrics.avg_pnl),
      pnlStdDev: Number(metrics.pnl_std_dev),
      maxWinStreak: metrics.max_win_streak,
      maxLossStreak: metrics.max_loss_streak,
      currentStreak: metrics.current_streak,
      currentStreakType: metrics.current_streak_type as "win" | "loss" | "none",
      weekdayStats: metrics.weekday_stats as Record<
        string,
        { trades: number; wins: number; pnl: number }
      >,
      updatedAt: metrics.updated_at.toISOString(),
    };
  } catch (error) {
    console.error("[getAccountMetricsAction] Error:", error);
    return null;
  }
}

/**
 * Force refresh of account metrics.
 * Use this when you need to ensure metrics are up-to-date
 * after a batch operation that might not trigger individual triggers.
 */
export async function refreshAccountMetricsAction(accountId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Verify ownership
    const account = await prisma.accounts.findUnique({
      where: { id: accountId },
      select: { user_id: true },
    });

    if (!account || account.user_id !== userId) {
      return false;
    }

    // Call the helper function to recalculate metrics
    await prisma.$executeRaw`
      SELECT update_account_metrics_for_account(${accountId}::uuid, ${userId}::uuid)
    `;

    return true;
  } catch (error) {
    console.error("[refreshAccountMetricsAction] Error:", error);
    return false;
  }
}
