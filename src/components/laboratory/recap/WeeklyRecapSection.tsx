"use client";

import React, { memo, useMemo } from "react";
import { GlassCard, WeekPicker } from "@/components/ui";
import { CustomCheckbox } from "@/components/checklist/CustomCheckbox";
import type { TradeLite } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyRecapSectionProps {
  trades: TradeLite[];
  selectedWeek: string;
  selectedTradeIds: string[];
  onWeekChange: (week: string) => void;
  onToggleTradeSelection: (id: string) => void;
}

export const WeeklyRecapSection = memo(function WeeklyRecapSection({
  trades,
  selectedWeek,
  selectedTradeIds,
  onWeekChange,
  onToggleTradeSelection,
}: WeeklyRecapSectionProps) {
  // Parse week string to dates
  const weekDates = useMemo(() => {
    try {
      const [year, week] = selectedWeek.split("-W").map(Number);
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToAdd = (week - 1) * 7;
      const weekStart = startOfWeek(
        new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
        { locale: ptBR }
      );
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      return { weekStart, weekEnd };
    } catch {
      return { weekStart: new Date(), weekEnd: new Date() };
    }
  }, [selectedWeek]);

  // Filter trades for the selected week
  const weekTrades = useMemo(() => {
    return trades.filter((trade) => {
      const tradeDate = parseISO(trade.entryDate);
      return tradeDate >= weekDates.weekStart && tradeDate <= weekDates.weekEnd;
    });
  }, [trades, weekDates]);

  // Calculate stats for selected trades
  const weekStats = useMemo(() => {
    const selected = weekTrades.filter((t) => selectedTradeIds.includes(t.id));
    const wins = selected.filter((t) => (t.pnl ?? 0) > 0).length;
    const total = selected.length;
    const totalPnL = selected.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return {
      count: total,
      total: weekTrades.length,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      totalPnL,
    };
  }, [weekTrades, selectedTradeIds]);

  return (
    <GlassCard className="space-y-4 border-white/5 bg-gray-800/30 p-4">
      {/* Week Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Semana de Análise</label>
        <WeekPicker selectedWeek={selectedWeek} onWeekChange={onWeekChange} />
      </div>

      {/* Trades Multi-Select */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Trades da Semana (selecione para incluir)
        </label>

        {weekTrades.length > 0 ? (
          <>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
              {weekTrades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => onToggleTradeSelection(trade.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                    selectedTradeIds.includes(trade.id)
                      ? "bg-zorin-accent/10 border-zorin-accent/50 shadow-[0_0_10px_rgba(0,200,83,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <CustomCheckbox
                      checked={selectedTradeIds.includes(trade.id)}
                      onChange={() => onToggleTradeSelection(trade.id)}
                    />
                  </div>
                  <div className="flex flex-1 items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${trade.type === "Long" ? "text-green-400" : "text-red-400"}`}
                      >
                        {trade.type}
                      </span>
                      <span className="text-white">{trade.symbol}</span>
                      <span className="text-gray-400">
                        {format(parseISO(trade.entryDate), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <span
                      className={
                        (trade.pnl ?? 0) > 0
                          ? "font-medium text-green-400"
                          : "font-medium text-red-400"
                      }
                    >
                      {(trade.pnl ?? 0) > 0 ? "+" : ""}
                      {formatCurrency(trade.pnl ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 p-3 text-sm">
              <span className="text-gray-400">
                {weekStats.count} de {weekStats.total} trades
              </span>
              <span className="text-gray-300">
                Win Rate:{" "}
                <span className={weekStats.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                  {weekStats.winRate.toFixed(0)}%
                </span>
              </span>
              <span
                className={
                  weekStats.totalPnL > 0 ? "font-bold text-green-400" : "font-bold text-red-400"
                }
              >
                {weekStats.totalPnL > 0 ? "+" : ""}
                {formatCurrency(weekStats.totalPnL)}
              </span>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>Nenhum trade encontrado nesta semana</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
});
