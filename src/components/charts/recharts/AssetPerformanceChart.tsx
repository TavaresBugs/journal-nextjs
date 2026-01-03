"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { GlassCard } from "@/components/ui";
import type { Trade } from "@/types";
import { formatCurrency } from "@/lib/utils/trading";

interface AssetPerformanceChartProps {
  trades: Trade[];
  currency: string;
}

export function AssetPerformanceChart({ trades, currency }: AssetPerformanceChartProps) {
  const data = useMemo(() => {
    const performance = trades.reduce(
      (acc, trade) => {
        const asset = trade.symbol || "Outros";
        if (!acc[asset]) {
          acc[asset] = { asset, pnl: 0, trades: 0 };
        }
        acc[asset].pnl += trade.pnl || 0;
        acc[asset].trades += 1;
        return acc;
      },
      {} as Record<string, { asset: string; pnl: number; trades: number }>
    );

    return Object.values(performance)
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <GlassCard className="p-8">
      <h3 className="mb-8 text-base font-medium text-gray-400">Top 10 Ativos</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
          <XAxis dataKey="asset" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          <Tooltip
            cursor={{ fill: "#374151", opacity: 0.2 }}
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "#374151",
              borderRadius: "0.5rem",
              color: "#f3f4f6",
            }}
            formatter={(value) => [formatCurrency(Number(value) || 0, currency), "P&L"]}
          />
          <ReferenceLine y={0} stroke="#6b7280" />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#00c853" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
