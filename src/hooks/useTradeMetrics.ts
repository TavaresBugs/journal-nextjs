"use client";

import { useMemo } from "react";
import type { Trade, JournalEntry } from "@/types";
import {
  calculateTradeMetrics,
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

export interface PnLMetrics {
  pnl: number;
  pnlPercent: number;
  isProfit: boolean;
}

export interface TradeMetricsData {
  metrics: ReturnType<typeof calculateTradeMetrics>;
  advancedMetrics: AdvancedMetrics;
  streakMetrics: StreakMetrics;
  pnlMetrics: PnLMetrics;
}

interface UseTradeMetricsParams {
  trades: Trade[];
  entries: JournalEntry[];
  initialBalance: number;
  currentBalance: number;
}

/**
 * Hook for calculating all trade-related metrics.
 * Includes basic metrics, advanced metrics (Sharpe, Calmar, etc.),
 * streak calculations, and PnL.
 *
 * @param params - Trades, entries, and balance data
 * @returns Calculated metrics
 */
export function useTradeMetrics({
  trades,
  entries,
  initialBalance,
  currentBalance,
}: UseTradeMetricsParams): TradeMetricsData {
  // Basic trade metrics
  const metrics = useMemo(() => calculateTradeMetrics(trades), [trades]);

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

  // PnL calculations
  const pnlMetrics = useMemo(() => {
    const pnl = currentBalance - initialBalance;
    const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
    const isProfit = pnl >= 0;

    return { pnl, pnlPercent, isProfit };
  }, [currentBalance, initialBalance]);

  return {
    metrics,
    advancedMetrics,
    streakMetrics,
    pnlMetrics,
  };
}
