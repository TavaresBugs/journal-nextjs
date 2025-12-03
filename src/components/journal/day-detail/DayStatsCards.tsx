'use client';

import { memo } from 'react';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface DayStatsCardsProps {
  trades: Trade[];
  totalPnL: number;
}

/**
 * Component for displaying day trading statistics
 * Shows total PnL and trade count in card format
 * Memoized to prevent unnecessary re-renders
 */
const DayStatsCardsComponent = ({ trades, totalPnL }: DayStatsCardsProps) => {
  const tradeCount = trades.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total PnL Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
        <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">
          P/L
        </span>
        <span
          className={`text-3xl font-bold ${
            totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {formatCurrency(totalPnL)}
        </span>
      </div>

      {/* Trade Count Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
        <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">
          TRADES COUNT
        </span>
        <span className="text-3xl font-bold text-gray-100">
          {tradeCount}
        </span>
      </div>
    </div>
  );
};

export const DayStatsCards = memo(DayStatsCardsComponent);
