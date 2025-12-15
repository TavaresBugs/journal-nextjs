'use client';

import { formatCurrency } from '@/lib/calculations';

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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
);

const TrendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20v-6M6 20V10M18 20V4" />
    </svg>
);

const FireIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3a9 9 0 0 0 3 3.3z"></path>
    </svg>
);

const cardBaseClass = "bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors";

/**
 * Dashboard summary metrics cards.
 * Displays Balance, P&L, Win Rate, Total Trades, and Streak.
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {/* Balance */}
            <div className={cardBaseClass}>
                <div className="text-gray-500 mb-2 group-hover:text-emerald-400 transition-colors">
                    <WalletIcon />
                </div>
                <div className="text-xs text-gray-400 mb-1">Saldo Atual</div>
                <div className="text-lg font-bold text-gray-100">
                    {formatCurrency(currentBalance, currency)}
                </div>
            </div>

            {/* P&L */}
            <div className={cardBaseClass}>
                <div className={`mb-2 transition-colors ${isProfit ? 'text-green-500 group-hover:text-green-400' : 'text-red-500 group-hover:text-red-400'}`}>
                    <TrendIcon />
                </div>
                <div className="text-xs text-gray-400 mb-1">P&L Total</div>
                <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(pnl, currency)}
                </div>
                <div className={`text-xs ${isProfit ? 'text-green-500/70' : 'text-red-500/70'}`}>
                    ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </div>
            </div>

            {/* Win Rate */}
            <div className={cardBaseClass}>
                <div className="text-gray-500 mb-2 group-hover:text-cyan-400 transition-colors">
                    <CheckIcon />
                </div>
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className="text-lg font-bold text-cyan-400">
                    {winRate.toFixed(1)}%
                </div>
            </div>

            {/* Total Trades */}
            <div className={cardBaseClass}>
                <div className="text-gray-500 mb-2 group-hover:text-indigo-400 transition-colors">
                    <ChartIcon />
                </div>
                <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                <div className="text-lg font-bold text-gray-100">
                    {totalTrades}
                </div>
            </div>

            {/* Streak */}
            <div className={cardBaseClass}>
                <div className="text-orange-500/80 mb-2 group-hover:text-orange-400 transition-colors">
                    <FireIcon />
                </div>
                <div className="text-xs text-gray-400 mb-1">Sequência de Anotação</div>
                <div className="text-lg font-bold text-orange-400">
                    {streak}
                </div>
            </div>
        </div>
    );
}
