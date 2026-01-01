"use client";

import { formatCurrency } from "@/lib/calculations";

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

// Metric card icons
const WalletIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TrendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20v-6M6 20V10M18 20V4" />
  </svg>
);

const FireIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3a9 9 0 0 0 3 3.3z"></path>
  </svg>
);

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
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
      {/* Balance - sempre visível, importante */}
      <div className={cardBaseClass}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-emerald-400 sm:mb-2">
          <WalletIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Saldo Atual
        </div>
        <div className="max-w-full truncate text-sm font-bold text-gray-100 sm:text-base md:text-lg">
          {formatCurrency(currentBalance, currency)}
        </div>
      </div>

      {/* P&L - sempre visível, importante */}
      <div className={cardBaseClass}>
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

      {/* Win Rate - importante */}
      <div className={cardBaseClass}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-cyan-400 sm:mb-2">
          <CheckIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Win Rate
        </div>
        <div className="text-sm font-bold text-cyan-400 sm:text-base md:text-lg">
          {winRate.toFixed(1)}%
        </div>
      </div>

      {/* Total Trades - secundário em mobile */}
      <div className={cardBaseClass}>
        <div className="mb-1.5 text-gray-500 transition-colors group-hover:text-indigo-400 sm:mb-2">
          <ChartIcon />
        </div>
        <div className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
          Total Trades
        </div>
        <div className="text-sm font-bold text-gray-100 sm:text-base md:text-lg">{totalTrades}</div>
      </div>

      {/* Streak - secundário, ocupa 2 colunas em grid de 2 para centralizar */}
      <div className={`${cardBaseClass} col-span-2 sm:col-span-1`}>
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
