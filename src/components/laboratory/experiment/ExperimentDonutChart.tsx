"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ExperimentLinkedTrade } from "@/lib/database/repositories";

interface ExperimentDonutChartProps {
  trades: ExperimentLinkedTrade[];
}

const COLORS = {
  win: "#22c55e",
  loss: "#ef4444",
  breakeven: "#facc15",
  pending: "#6b7280",
};

/**
 * Donut chart showing the ratio of wins/losses/breakeven trades linked to an experiment.
 * Displays win rate percentage in the center.
 */
export function ExperimentDonutChart({ trades }: ExperimentDonutChartProps) {
  const { chartData, winRate, totalTrades } = useMemo(() => {
    const counts = {
      win: 0,
      loss: 0,
      breakeven: 0,
      pending: 0,
    };

    trades.forEach((trade) => {
      const outcome = trade.outcome || "pending";
      if (outcome in counts) {
        counts[outcome as keyof typeof counts]++;
      }
    });

    const data = [
      { name: "Wins", value: counts.win, color: COLORS.win },
      { name: "Losses", value: counts.loss, color: COLORS.loss },
      { name: "Breakeven", value: counts.breakeven, color: COLORS.breakeven },
    ].filter((item) => item.value > 0);

    // Calculate win rate (wins / (wins + losses))
    const completedTrades = counts.win + counts.loss;
    const rate = completedTrades > 0 ? (counts.win / completedTrades) * 100 : 0;

    return {
      chartData: data,
      winRate: rate,
      totalTrades: trades.length,
    };
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center">
        <p className="text-sm text-gray-500 italic">Nenhum trade vinculado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text - Win Rate */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{winRate.toFixed(0)}%</span>
        <span className="text-xs text-gray-400">Win Rate</span>
      </div>

      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-400">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Trade count */}
      <p className="mt-1 text-center text-xs text-gray-500">
        Total: {totalTrades} trade{totalTrades !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
