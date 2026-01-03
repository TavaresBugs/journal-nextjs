"use client";

import { formatCurrency } from "@/lib/utils/trading";
import { MetricCard } from "@/components/ui/MetricCard";

interface DashboardMetricsProps {
  currentBalance: number;
  currency: string;
  pnl: number;
  pnlPercent: number;
  isProfit: boolean;
  winRate: number;
  totalTrades: number;
  streak: number;
}

/**
 * Dashboard summary metrics cards.
 * Uses the reusable MetricCard component.
 *
 * Layout:
 * - lg: 5 cards in one row
 * - sm/md: 3 cards first row + 2 cards second row (50% each)
 * - mobile: 2-2-1 pattern (Sequência spans full width)
 */
export function DashboardMetrics({
  currentBalance,
  currency,
  pnl,
  pnlPercent,
  isProfit,
  winRate,
  totalTrades,
  streak,
}: DashboardMetricsProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-6 sm:gap-3 lg:grid-cols-5">
      {/* Balance */}
      <MetricCard
        icon="dollar"
        label="Saldo Atual"
        value={formatCurrency(currentBalance, currency)}
        colorVariant="green"
        className="sm:col-span-2 lg:col-span-1"
      />

      {/* P&L */}
      <MetricCard
        icon="trend"
        label="P&L Total"
        value={`${isProfit ? "+" : ""}${formatCurrency(pnl, currency)}`}
        subValue={`(${isProfit ? "+" : ""}${pnlPercent.toFixed(2)}%)`}
        colorVariant={isProfit ? "green" : "red"}
        colorBehavior="persistent"
        valueColorBehavior="colored"
        className="sm:col-span-2 lg:col-span-1"
      />

      {/* Win Rate */}
      <MetricCard
        icon="check"
        label="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        colorVariant="cyan"
        className="sm:col-span-2 lg:col-span-1"
      />

      {/* Total Trades - spans 3 cols on sm (50% of 6-col grid) */}
      <MetricCard
        icon="chart"
        label="Total Trades"
        value={totalTrades}
        colorVariant="indigo"
        className="sm:col-span-3 lg:col-span-1"
      />

      {/* Streak - spans 2 cols on mobile, 3 cols on sm */}
      <MetricCard
        icon="fire"
        label="Sequência"
        value={streak}
        colorVariant="orange"
        valueColorBehavior="colored"
        className="col-span-2 sm:col-span-3 lg:col-span-1"
      />
    </div>
  );
}
