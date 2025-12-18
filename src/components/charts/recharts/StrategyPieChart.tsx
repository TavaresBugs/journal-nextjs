"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import type { Trade } from "@/types";

interface StrategyPieChartProps {
  trades: Trade[];
}

const STRATEGY_COLORS = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1"];

export function StrategyPieChart({ trades }: StrategyPieChartProps) {
  const { innerPieData, outerPieData } = useMemo(() => {
    const strategyStats = trades.reduce(
      (acc, trade) => {
        const strategy = trade.strategy || "Sem Estratégia";
        if (!acc[strategy]) {
          acc[strategy] = { name: strategy, total: 0, wins: 0, losses: 0 };
        }
        acc[strategy].total += 1;
        if ((trade.pnl || 0) >= 0) {
          acc[strategy].wins += 1;
        } else {
          acc[strategy].losses += 1;
        }
        return acc;
      },
      {} as Record<string, { name: string; total: number; wins: number; losses: number }>
    );

    const innerData = Object.values(strategyStats).sort((a, b) => b.total - a.total);
    const outerData = innerData
      .flatMap((stat) => [
        { name: "Win", value: stat.wins, color: "#22c55e", strategy: stat.name },
        { name: "Loss", value: stat.losses, color: "#ef4444", strategy: stat.name },
      ])
      .filter((item) => item.value > 0);

    return { innerPieData: innerData, outerPieData: outerData };
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-6 text-lg font-bold text-cyan-400">Desempenho por Estratégia</h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          Nenhum trade registrado ainda
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 p-8 backdrop-blur-sm">
      <h3 className="mb-8 text-base font-medium text-gray-400">Desempenho por Estratégia</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={innerPieData}
            dataKey="total"
            cx="50%"
            cy="50%"
            outerRadius={80}
            stroke="#1f2937"
            strokeWidth={2}
          >
            {innerPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]} />
            ))}
          </Pie>
          <Pie
            data={outerPieData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={120}
            stroke="#1f2937"
            strokeWidth={2}
          >
            {outerPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "#374151",
              borderRadius: "0.5rem",
              color: "#f3f4f6",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
