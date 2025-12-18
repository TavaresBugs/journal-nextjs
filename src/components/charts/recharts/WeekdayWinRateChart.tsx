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
import dayjs from "dayjs";

interface WeekdayWinRateChartProps {
  trades: Trade[];
}

export function WeekdayWinRateChart({ trades }: WeekdayWinRateChartProps) {
  const data = useMemo(() => {
    const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const stats = trades.reduce(
      (acc, trade) => {
        const dayIndex = dayjs(trade.entryDate).day();
        const dayName = weekdays[dayIndex];

        if (!acc[dayName]) {
          acc[dayName] = { day: dayName, wins: 0, total: 0, winRate: 0, order: dayIndex };
        }

        acc[dayName].total += 1;
        if ((trade.pnl || 0) > 0) {
          acc[dayName].wins += 1;
        }

        return acc;
      },
      {} as Record<
        string,
        { day: string; wins: number; total: number; winRate: number; order: number }
      >
    );

    // Calculate win rates
    Object.values(stats).forEach((stat) => {
      stat.winRate = (stat.wins / stat.total) * 100;
    });

    return Object.values(stats).sort((a, b) => a.order - b.order);
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <GlassCard className="p-8">
      <h3 className="mb-8 text-base font-medium text-gray-400">Win Rate por Dia</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
          <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            cursor={{ fill: "#374151", opacity: 0.2 }}
            contentStyle={{
              backgroundColor: "#111827",
              borderColor: "#374151",
              borderRadius: "0.5rem",
            }}
            itemStyle={{ color: "#E5E7EB" }}
            labelStyle={{ color: "#9CA3AF" }}
            formatter={(value: number, name: string, props: unknown) => {
              const payload = (props as { payload: { wins: number; total: number } }).payload;
              return [`${value.toFixed(1)}%`, `Win Rate (${payload.wins}/${payload.total})`];
            }}
          />
          <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.winRate >= 50 ? "#00c853" : "#ef4444"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
