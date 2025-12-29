"use client";

import { useMemo } from "react";
import type { Trade, JournalEntry } from "@/types";
import {
  calculateSharpeRatio,
  calculateCalmarRatio,
  calculateAverageHoldTime,
  calculateConsecutiveStreaks,
} from "@/lib/calculations";

export interface StreakMetrics {
  daysAccessed: number;
  streak: number;
}

export interface AdvancedMetrics {
  sharpe: ReturnType<typeof calculateSharpeRatio>;
  calmar: ReturnType<typeof calculateCalmarRatio>;
  holdTime: ReturnType<typeof calculateAverageHoldTime>;
  streaks: ReturnType<typeof calculateConsecutiveStreaks>;
}

export interface AdvancedTradeMetricsData {
  advancedMetrics: AdvancedMetrics;
  streakMetrics: StreakMetrics;
}

interface UseAdvancedMetricsParams {
  trades: Trade[];
  entries: JournalEntry[];
  initialBalance: number;
}

/**
 * Hook for calculating ADVANCED trade metrics (Reports, Charts).
 * SHOULD BE LAZY LOADED: These calculations are expensive (O(n) iterations).
 *
 * @param params - Trades, entries, and balance data
 * @returns Calculated advanced metrics
 */
export function useAdvancedMetrics({
  trades,
  entries,
  initialBalance,
}: UseAdvancedMetricsParams): AdvancedTradeMetricsData {
  // Advanced metrics (Sharpe, Calmar, Hold Time, Streaks)
  const advancedMetrics = useMemo(
    () => ({
      sharpe: calculateSharpeRatio(trades),
      calmar: calculateCalmarRatio(trades, initialBalance),
      holdTime: calculateAverageHoldTime(trades),
      streaks: calculateConsecutiveStreaks(trades),
    }),
    [trades, initialBalance]
  );

  // Streak metrics based on trade and journal activity
  const streakMetrics = useMemo(() => {
    const tradeDates = trades.map((t) => t.entryDate.split("T")[0]);
    const journalDates = entries.map((e) => e.date);

    const dates = Array.from(new Set([...tradeDates, ...journalDates])).sort();
    const daysAccessed = dates.length;

    if (dates.length === 0) return { daysAccessed: 0, streak: 0 };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const lastDate = dates[dates.length - 1];

    if (lastDate !== todayStr && lastDate !== yesterdayStr) {
      return { daysAccessed, streak: 0 };
    }

    let streak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const current = new Date(dates[i]);
      const prev = new Date(dates[i - 1]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) streak++;
      else break;
    }

    return { daysAccessed, streak };
  }, [trades, entries]);

  return {
    advancedMetrics,
    streakMetrics,
  };
}
