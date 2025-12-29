"use client";

import { useBasicMetrics, BasicTradeMetricsData, PnLMetrics } from "./useBasicMetrics";
import { AdvancedTradeMetricsData, StreakMetrics, AdvancedMetrics } from "./useAdvancedMetrics";
import type { Trade, JournalEntry } from "@/types";

// Re-export types
export type {
  BasicTradeMetricsData,
  PnLMetrics,
  AdvancedTradeMetricsData,
  StreakMetrics,
  AdvancedMetrics,
};

// Combined type for backwards compatibility
export interface TradeMetricsData extends BasicTradeMetricsData {
  advancedMetrics: AdvancedMetrics;
  streakMetrics: StreakMetrics; // We still might need this in header? "Sequência de Anotação" is in Header Metrics!
}

export interface UseTradeMetricsParams {
  trades: Trade[];
  entries: JournalEntry[];
  initialBalance: number;
  currentBalance?: number;
}

/**
 * OLD MONOLITHIC HOOK - DEPRECATED FOR PERFORMANCE
 * This hook previously calculated EVERYTHING.
 * Now it calculates Basic Metrics + Streak (Streak is in header).
 * EXPENSIVE Advanced Metrics (Sharpe/Calmar) are now faked/defaulted here
 * to prevent blocking, and must be fetched via useAdvancedMetrics in specific components.
 */
export function useTradeMetrics({
  trades,
  entries,
  initialBalance,
}: UseTradeMetricsParams): TradeMetricsData {
  // 1. Calculate Basic Metrics (Fast)
  const { metrics, pnlMetrics } = useBasicMetrics({ trades, initialBalance });

  // 2. Calculate Streak (Fast enough? It iterates dates. Usually fast.)
  // We need streak for the DashboardMetrics header card.
  // So we MUST calculate streak here or in useBasicMetrics optimization.
  // The streak calculation is O(N) on days, which is much smaller than O(N^2) or heavy math of Sharpe.
  // So we can keep streak here or import it.

  // 2. Calculate Streak (Fast enough? It iterates dates. Usually fast.)
  // We need streak for the DashboardMetrics header card.
  // We duplicate the logic here to avoid importing the heavy hook.

  const streakMetricsResult = { daysAccessed: 0, streak: 0 };
  // Logic is fast, I'll put it back:
  const tradeDates = trades.map((t) => t.entryDate.split("T")[0]);
  const journalDates = entries.map((e) => e.date);
  const dates = Array.from(new Set([...tradeDates, ...journalDates])).sort();
  const daysAccessed = dates.length;
  if (dates.length > 0) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const lastDate = dates[dates.length - 1];

    let streak = 0;
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      streak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const current = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diffTime = Math.abs(current.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak++;
        else break;
      }
    }
    streakMetricsResult.streak = streak;
    streakMetricsResult.daysAccessed = daysAccessed;
  }

  return {
    metrics,
    pnlMetrics,
    streakMetrics: streakMetricsResult,
    // Return DEFAULTS for advanced metrics to avoid blocking main thread
    advancedMetrics: {
      sharpe: 0,
      calmar: 0,
      holdTime: {
        avgWinnerTime: 0,
        avgLoserTime: 0,
        avgAllTrades: 0,
        winnerCount: 0,
        loserCount: 0,
      },
      streaks: { maxWinStreak: 0, maxLossStreak: 0, currentStreak: { type: "none", count: 0 } },
    },
  };
}
