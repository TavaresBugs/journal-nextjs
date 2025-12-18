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
} from "recharts";
import { GlassCard } from "@/components/ui";
import type { Trade } from "@/types";
import { DEFAULT_ASSETS } from "@/types";

interface RMultipleDistributionChartProps {
  trades: Trade[];
}

export function RMultipleDistributionChart({ trades }: RMultipleDistributionChartProps) {
  const data = useMemo(() => {
    const distribution: Record<string, number> = {
      "<-2R": 0,
      "-2R a -1R": 0,
      "-1R a 0R": 0,
      "0R a 1R": 0,
      "1R a 2R": 0,
      "2R a 3R": 0,
      ">3R": 0,
    };

    const order = ["<-2R", "-2R a -1R", "-1R a 0R", "0R a 1R", "1R a 2R", "2R a 3R", ">3R"];

    trades.forEach((trade) => {
      // Skip if missing critical data
      if (!trade.entryPrice || !trade.stopLoss || trade.pnl === undefined) return;

      // Calculate Risk
      const priceDiff = Math.abs(trade.entryPrice - trade.stopLoss);
      if (priceDiff === 0) return; // Avoid division by zero

      const multiplier = DEFAULT_ASSETS[trade.symbol] || 1;
      const risk = priceDiff * trade.lot * multiplier;

      if (risk <= 0) return;

      const r = trade.pnl / risk;

      if (r < -2) distribution["<-2R"]++;
      else if (r < -1) distribution["-2R a -1R"]++;
      else if (r < 0) distribution["-1R a 0R"]++;
      else if (r < 1) distribution["0R a 1R"]++;
      else if (r < 2) distribution["1R a 2R"]++;
      else if (r < 3) distribution["2R a 3R"]++;
      else distribution[">3R"]++;
    });

    return order.map((range) => ({
      range,
      count: distribution[range],
      color: range.includes("-") ? "#ef4444" : "#00c853",
    }));
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <GlassCard className="p-8">
      <h3 className="mb-2 text-base font-medium text-gray-400">Múltiplos R</h3>
      <p className="mb-6 text-xs text-gray-500">
        Mostra a eficiência dos seus trades em relação ao risco inicial.
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="range"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            interval={0}
          />
          <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#374151", opacity: 0.2 }}
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "#374151",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#f3f4f6" }}
            itemStyle={{ color: "#f3f4f6" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
