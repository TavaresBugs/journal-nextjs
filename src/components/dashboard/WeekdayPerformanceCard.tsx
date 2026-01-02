"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { GlassCard } from "@/components/ui";
import { Trade } from "@/types";
import { formatCurrency } from "@/lib/utils/trading";
import { CalendarDays } from "lucide-react";

interface WeekdayPerformanceCardProps {
  trades: Trade[];
}

export function WeekdayPerformanceCard({ trades }: WeekdayPerformanceCardProps) {
  const data = useMemo(() => {
    const days = [
      { name: "Dom", full: "Domingo", pnl: 0, count: 0 },
      { name: "Seg", full: "Segunda", pnl: 0, count: 0 },
      { name: "Ter", full: "Terça", pnl: 0, count: 0 },
      { name: "Qua", full: "Quarta", pnl: 0, count: 0 },
      { name: "Qui", full: "Quinta", pnl: 0, count: 0 },
      { name: "Sex", full: "Sexta", pnl: 0, count: 0 },
      { name: "Sáb", full: "Sábado", pnl: 0, count: 0 },
    ];

    trades.forEach((trade) => {
      if (!trade.entryDate) return;
      // entryDate is YYYY-MM-DD
      const date = new Date(trade.entryDate + "T12:00:00");
      const dayIndex = date.getDay(); // 0 = Sunday

      if (dayIndex >= 0 && dayIndex < 7) {
        days[dayIndex].pnl += trade.pnl || 0;
        days[dayIndex].count += 1;
      }
    });

    // Filter out weekends if no trades
    const hasWeekendData = days[0].count > 0 || days[6].count > 0;
    if (!hasWeekendData) {
      return days.slice(1, 6);
    }
    return days;
  }, [trades]);

  return (
    <GlassCard className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-100">Performance Semanal</h3>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 min-h-[250px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(val) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(val)
              }
            />
            <Tooltip
              cursor={{ fill: "#1f2937", opacity: 0.4 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isPositive = data.pnl >= 0;
                  return (
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-xl">
                      <p className="mb-1 text-sm font-semibold text-gray-200">
                        {data.full}{" "}
                        <span className="text-xs text-gray-400">({data.count} trades)</span>
                      </p>
                      <p
                        className={`text-sm font-bold ${isPositive ? "text-[#04df73]" : "text-[#ff6467]"}`}
                      >
                        PnL: {formatCurrency(data.pnl)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#4b5563" />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "#00c853" : "#ef4444"}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#00c853" }} />
          <span>Dia Lucrativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span>Dia Prejuízo</span>
        </div>
      </div>
    </GlassCard>
  );
}
