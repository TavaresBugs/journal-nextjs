"use client";

import { useMemo } from "react";
import type { Trade } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { GlassCard } from "@/components/ui";
import dayjs from "dayjs";

interface MonthlyPerformanceGridProps {
  trades: Trade[];
  currency: string;
}

export function MonthlyPerformanceGrid({ trades, currency }: MonthlyPerformanceGridProps) {
  const monthlyData = useMemo(() => {
    const data: Record<string, Record<number, number>> = {};
    const years = new Set<string>();

    trades.forEach((trade) => {
      const date = dayjs(trade.entryDate);
      const year = date.format("YYYY");
      const monthIndex = date.month(); // 0-11

      if (!data[year]) data[year] = {};
      if (!data[year][monthIndex]) data[year][monthIndex] = 0;

      data[year][monthIndex] += trade.pnl || 0;
      years.add(year);
    });

    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return { data, sortedYears, months };
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <GlassCard className="overflow-x-auto p-8">
      <h3 className="mb-8 text-base font-medium text-gray-400">Histórico Mensal</h3>
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="bg-zorin-bg-secondary text-xs text-gray-500 uppercase">
          <tr>
            <th className="rounded-tl-lg px-4 py-3">Ano</th>
            {monthlyData.months.map((month) => (
              <th key={month} className="px-4 py-3 text-center">
                {month}
              </th>
            ))}
            <th className="rounded-tr-lg px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.sortedYears.map((year) => {
            const yearTotal = Object.values(monthlyData.data[year] || {}).reduce(
              (a, b) => a + b,
              0
            );
            return (
              <tr key={year} className="border-b border-white/5 transition-colors hover:bg-white/5">
                <td className="px-4 py-4 font-medium text-gray-300">{year}</td>
                {monthlyData.months.map((month, monthIndex) => {
                  const value = monthlyData.data[year]?.[monthIndex] || 0;
                  const hasValue = monthlyData.data[year] && monthIndex in monthlyData.data[year];

                  return (
                    <td key={`${year}-${month}`} className="px-2 py-4 text-center">
                      {hasValue ? (
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            value >= 0
                              ? "bg-zorin-accent/10 text-zorin-accent"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {formatCurrency(value, currency)}
                        </span>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                  );
                })}
                <td
                  className={`px-4 py-4 text-right font-bold ${yearTotal >= 0 ? "text-zorin-accent" : "text-red-400"}`}
                >
                  {formatCurrency(yearTotal, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassCard>
  );
}
