"use client";

import { formatCurrency } from "@/lib/calculations";
import {
  DollarIcon,
  TrendIcon,
  CheckCircleIcon,
  BarChartIcon,
  FireIcon,
} from "@/components/ui/MetricIcons";

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
 * REFATORADO: Mobile-first responsive grid
 *
 * MUDANÇAS:
 * - Grid: grid-cols-2 em mobile, cresce progressivamente
 * - Em telas muito pequenas (< 375px), últimos 2 cards ocupam 2 colunas cada (col-span-2)
 * - Padding reduzido em mobile: p-3 sm:p-4
 * - Font sizes responsivos: text-sm sm:text-base, text-base sm:text-lg
 * - Gap responsivo: gap-2 sm:gap-3
 * - Ícones menores em mobile (20px vs 24px)
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
  // Classes base do card - responsivas
  const cardBaseClass =
    "bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-3 sm:p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors min-h-[100px] sm:min-h-[120px]";

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-6 sm:gap-3 lg:grid-cols-5">
      {/* Balance */}
      <div className={`${cardBaseClass} sm:col-span-2 lg:col-span-1`}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-green-500 sm:mb-2">
          <DollarIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Saldo Atual
        </div>
        <div className="max-w-full truncate text-sm font-bold text-gray-100 sm:text-base md:text-lg">
          {formatCurrency(currentBalance, currency)}
        </div>
      </div>

      {/* P&L */}
      <div className={`${cardBaseClass} sm:col-span-2 lg:col-span-1`}>
        <div
          className={`mb-1.5 transition-colors sm:mb-2 ${
            isProfit
              ? "text-green-500 group-hover:text-green-400"
              : "text-red-500 group-hover:text-red-400"
          }`}
        >
          <TrendIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          P&L Total
        </div>
        <div
          className={`max-w-full truncate text-sm font-bold sm:text-base md:text-lg ${
            isProfit ? "text-green-400" : "text-red-400"
          }`}
        >
          {isProfit ? "+" : ""}
          {formatCurrency(pnl, currency)}
        </div>
        <div
          className={`text-[10px] sm:text-xs ${isProfit ? "text-green-500/70" : "text-red-500/70"}`}
        >
          ({isProfit ? "+" : ""}
          {pnlPercent.toFixed(2)}%)
        </div>
      </div>

      {/* Win Rate */}
      <div className={`${cardBaseClass} sm:col-span-2 lg:col-span-1`}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-cyan-400 sm:mb-2">
          <CheckCircleIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Win Rate
        </div>
        <div className="text-sm font-bold text-cyan-400 sm:text-base md:text-lg">
          {winRate.toFixed(1)}%
        </div>
      </div>

      {/* Total Trades - spans 3 cols on sm (50% of 6-col grid) */}
      <div className={`${cardBaseClass} sm:col-span-3 lg:col-span-1`}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-indigo-400 sm:mb-2">
          <BarChartIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Total Trades
        </div>
        <div className="text-sm font-bold text-gray-100 sm:text-base md:text-lg">{totalTrades}</div>
      </div>

      {/* Streak - spans 2 cols on mobile, 3 cols on sm (50% of 6-col grid) */}
      <div className={`${cardBaseClass} col-span-2 sm:col-span-3 lg:col-span-1`}>
        <div className="mb-1.5 text-orange-500/80 transition-colors group-hover:text-orange-400 sm:mb-2">
          <FireIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Sequência
        </div>
        <div className="text-sm font-bold text-orange-400 sm:text-base md:text-lg">{streak}</div>
      </div>
    </div>
  );
}
