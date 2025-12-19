"use client";

import React, { useMemo } from "react";
import { DEFAULT_ASSETS } from "@/types";
import { formatRMultiple, getRMultipleColor } from "@/lib/timeframeUtils";

interface TradeResultBadgeProps {
  entryPrice: string;
  exitPrice: string;
  type: "Long" | "Short" | "";
  lot: string;
  symbol: string;
  commission: string;
  swap: string;
  rMultiplePreview: number | null;
}

export const TradeResultBadge = React.memo(function TradeResultBadge({
  entryPrice,
  exitPrice,
  type,
  lot,
  symbol,
  commission,
  swap,
  rMultiplePreview,
}: TradeResultBadgeProps) {
  const { resultLabel, resultClasses } = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lotSize = parseFloat(lot) || 1;
    const assetMultiplier = DEFAULT_ASSETS[symbol.toUpperCase()] || 1;

    let calculatedPnl =
      type === "Long"
        ? (exit - entry) * lotSize * assetMultiplier
        : (entry - exit) * lotSize * assetMultiplier;

    calculatedPnl +=
      (commission ? -Math.abs(parseFloat(commission)) : 0) + (swap ? parseFloat(swap) : 0);

    let label: "WIN" | "LOSS" | "BE";
    let classes: string;

    if (calculatedPnl > 0) {
      label = "WIN";
      classes = "border border-green-500/30 bg-green-900/30 text-green-400";
    } else if (calculatedPnl < 0) {
      label = "LOSS";
      classes = "border border-red-500/30 bg-red-900/30 text-red-400";
    } else {
      label = "BE";
      classes = "border border-yellow-500/30 bg-yellow-900/30 text-yellow-400";
    }

    return { resultLabel: label, resultClasses: classes };
  }, [entryPrice, exitPrice, type, lot, symbol, commission, swap]);

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between">
        <div className={`flex-1 rounded-lg py-2 text-center text-lg font-bold ${resultClasses}`}>
          {resultLabel}
        </div>
        {rMultiplePreview !== null && (
          <div
            className={`ml-3 rounded-lg px-3 py-2 font-bold ${getRMultipleColor(rMultiplePreview)} border border-gray-700 bg-gray-900/50`}
          >
            {formatRMultiple(rMultiplePreview)}
          </div>
        )}
      </div>
    </div>
  );
});
