"use client";

import { memo } from "react";
import type { Trade } from "@/types";
import { GlassCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/trading";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Total PnL Card */}
      <GlassCard className="bg-zorin-bg/50 flex flex-col items-center justify-center p-6">
        <span className="mb-2 text-sm tracking-wider text-gray-400 uppercase">P/L</span>
        <span
          className={`text-3xl font-bold ${
            totalPnL >= 0 ? "text-zorin-accent" : "text-zorin-danger"
          }`}
        >
          {formatCurrency(totalPnL)}
        </span>
      </GlassCard>

      {/* Trade Count Card */}
      <GlassCard className="bg-zorin-bg/50 flex flex-col items-center justify-center p-6">
        <span className="mb-2 text-sm tracking-wider text-gray-400 uppercase">TRADES COUNT</span>
        <span className="text-3xl font-bold text-gray-100">{tradeCount}</span>
      </GlassCard>
    </div>
  );
};

export const DayStatsCards = memo(DayStatsCardsComponent);
