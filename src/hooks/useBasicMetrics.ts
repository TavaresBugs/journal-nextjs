"use client";

import { useMemo } from "react";
import type { Trade } from "@/types";
import { calculateTradeMetrics } from "@/lib/calculations";

export interface PnLMetrics {
  pnl: number;
  pnlPercent: number;
  isProfit: boolean;
  currentBalance: number;
}

export interface BasicTradeMetricsData {
  metrics: ReturnType<typeof calculateTradeMetrics>;
  pnlMetrics: PnLMetrics;
}

interface UseBasicMetricsParams {
  trades: Trade[];
  // entries: JournalEntry[]; // Unused for basic metrics
  initialBalance: number;
}

/**
 * Hook for calculating BASIC trade metrics (Header, Summary).
 * Optimized for speed - avoids heavy iterations like Sharpe/Calmar.
 *
 * @param params - Trades, entries, and balance data
 * @returns Calculated basic metrics
 */
export function useBasicMetrics({
  trades,
  // entries,
  initialBalance,
}: UseBasicMetricsParams): BasicTradeMetricsData {
  // Basic trade metrics (Win Rate, Total Trades, etc.)
  const metrics = useMemo(() => calculateTradeMetrics(trades), [trades]);

  // PnL calculations
  const pnlMetrics = useMemo(() => {
    const totalPnlFromTrades = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const calculatedCurrentBalance = initialBalance + totalPnlFromTrades;
    const pnl = totalPnlFromTrades;
    const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
    const isProfit = pnl >= 0;

    return { pnl, pnlPercent, isProfit, currentBalance: calculatedCurrentBalance };
  }, [trades, initialBalance]);

  return {
    metrics,
    pnlMetrics,
  };
}
