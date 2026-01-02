"use client";

import { useMemo } from "react";
import type { Trade, PlaybookStats } from "@/types";
import { formatCurrency } from "@/lib/utils/trading";
import { GlassCard } from "@/components/ui";

interface StrategyComparisonChartProps {
  trades: Trade[];
  currency: string;
  stats?: PlaybookStats[];
}

interface StrategyMetric {
  strategy: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  avgRR: number | null;
}

// Color functions based on thresholds
const getWinRateColor = (winRate: number) => {
  if (winRate >= 60) return "#00c853"; // zorin-accent
  if (winRate >= 40) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

const getPnLColor = (pnl: number) => {
  return pnl >= 0 ? "#00c853" : "#ef4444";
};

const getRRColor = (rr: number | null) => {
  if (rr === null) return "#6b7280";
  if (rr >= 2) return "#00c853";
  if (rr >= 1) return "#f59e0b";
  return "#ef4444";
};

export function StrategyComparisonChart({ trades, currency, stats }: StrategyComparisonChartProps) {
  const strategyMetrics: StrategyMetric[] = useMemo(() => {
    // Priority: use pre-aggregated stats if available (Server-Side Optimization)
    if (stats && stats.length > 0) {
      return stats
        .map((s) => ({
          strategy: s.name,
          trades: s.totalTrades,
          wins: s.wins,
          losses: s.losses,
          winRate: s.winRate,
          pnl: s.netPnL,
          avgRR: s.avgRR,
        }))
        .sort((a, b) => b.pnl - a.pnl);
    }

    // Fallback: Client-Side Calculation (for legacy or when stats not loaded)
    const strategyStats = trades.reduce(
      (acc, trade) => {
        const strategy = trade.strategy || "Sem Estratégia";
        if (!acc[strategy]) {
          acc[strategy] = {
            strategy,
            trades: 0,
            wins: 0,
            losses: 0,
            pnl: 0,
            rMultiples: [] as number[],
          };
        }
        acc[strategy].trades += 1;
        acc[strategy].pnl += trade.pnl || 0;

        if (trade.outcome === "win") {
          acc[strategy].wins += 1;
        } else if (trade.outcome === "loss") {
          acc[strategy].losses += 1;
        }

        // Calculate R-Multiple if available
        let rMultiple = trade.rMultiple;
        if (rMultiple === undefined || rMultiple === null) {
          if (trade.entryPrice && trade.stopLoss && trade.lot && trade.pnl) {
            const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
            if (riskInPoints > 0) {
              const expectedRisk = riskInPoints * trade.lot;
              if (expectedRisk > 0) {
                rMultiple = trade.pnl / expectedRisk;
              }
            }
          }
        }

        if (rMultiple !== undefined && rMultiple !== null && !isNaN(rMultiple)) {
          acc[strategy].rMultiples.push(rMultiple);
        }

        return acc;
      },
      {} as Record<
        string,
        {
          strategy: string;
          trades: number;
          wins: number;
          losses: number;
          pnl: number;
          rMultiples: number[];
        }
      >
    );

    return Object.values(strategyStats)
      .map((stat) => ({
        strategy: stat.strategy,
        trades: stat.trades,
        wins: stat.wins,
        losses: stat.losses,
        winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
        pnl: stat.pnl,
        avgRR:
          stat.rMultiples.length > 0
            ? stat.rMultiples.reduce((a, b) => a + b, 0) / stat.rMultiples.length
            : null,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades, stats]);

  // Calculate max values for scaling bars
  const maxPnl = Math.max(...strategyMetrics.map((s) => Math.abs(s.pnl)), 1);
  const maxRR = Math.max(...strategyMetrics.map((s) => Math.abs(s.avgRR || 0)), 3);

  if (trades.length === 0 && (!stats || stats.length === 0)) {
    return (
      <GlassCard className="p-8">
        <h3 className="mb-8 text-base font-medium text-gray-400">
          Análise Comparativa de Estratégias
        </h3>
        <div className="flex h-[300px] items-center justify-center text-gray-500">
          Nenhum trade registrado ainda
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="mb-6 text-base font-medium text-gray-400">
        Análise Comparativa de Estratégias
      </h3>

      {/* Header */}
      <div className="mb-4 grid grid-cols-4 gap-4 border-b border-white/5 pb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
        <div>Estratégia</div>
        <div>Win Rate</div>
        <div>P&L</div>
        <div className="hidden md:block">Avg RR</div>
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {strategyMetrics.map((metric) => (
          <div
            key={metric.strategy}
            className="group grid grid-cols-4 items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-white/5"
          >
            {/* Strategy Name */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-200">{metric.strategy}</span>
              <span className="text-xs text-gray-500">
                {metric.trades}T • {metric.wins}W/{metric.losses}L
              </span>
            </div>

            {/* Win Rate Bar */}
            <div className="flex items-center gap-2">
              <div className="h-6 flex-1 overflow-hidden rounded bg-gray-800">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${metric.winRate}%`,
                    backgroundColor: getWinRateColor(metric.winRate),
                  }}
                />
              </div>
              <span
                className="min-w-[45px] text-right text-sm font-bold"
                style={{ color: getWinRateColor(metric.winRate) }}
              >
                {metric.winRate.toFixed(0)}%
              </span>
            </div>

            {/* P&L Bar */}
            <div className="flex items-center gap-2">
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-gray-800">
                {metric.pnl >= 0 ? (
                  <div
                    className="absolute left-1/2 h-full rounded-r transition-all duration-500"
                    style={{
                      width: `${(metric.pnl / maxPnl) * 50}%`,
                      backgroundColor: getPnLColor(metric.pnl),
                    }}
                  />
                ) : (
                  <div
                    className="absolute right-1/2 h-full rounded-l transition-all duration-500"
                    style={{
                      width: `${(Math.abs(metric.pnl) / maxPnl) * 50}%`,
                      backgroundColor: getPnLColor(metric.pnl),
                    }}
                  />
                )}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
              </div>
              <span
                className="min-w-[80px] text-right text-sm font-bold"
                style={{ color: getPnLColor(metric.pnl) }}
              >
                {formatCurrency(metric.pnl, currency)}
              </span>
            </div>

            {/* Avg RR Bar */}
            <div className="hidden items-center gap-2 md:flex">
              <div className="h-6 flex-1 overflow-hidden rounded bg-gray-800">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width:
                      metric.avgRR !== null
                        ? `${Math.min((metric.avgRR / maxRR) * 100, 100)}%`
                        : "0%",
                    backgroundColor: getRRColor(metric.avgRR),
                  }}
                />
              </div>
              <span
                className="min-w-[45px] text-right text-sm font-bold"
                style={{ color: getRRColor(metric.avgRR) }}
              >
                {metric.avgRR !== null
                  ? `${metric.avgRR >= 0 ? "+" : ""}${metric.avgRR.toFixed(1)}R`
                  : "—R"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 flex flex-wrap gap-4 border-t border-white/5 pt-4 text-xs text-gray-500">
        <span>
          Total:{" "}
          <span className="font-medium text-gray-300">
            {stats && stats.length > 0
              ? stats.reduce((acc, s) => acc + s.totalTrades, 0)
              : trades.length}{" "}
            trades
          </span>
        </span>
        {strategyMetrics.length > 0 && (
          <>
            <span>
              Melhor:{" "}
              <span className="text-zorin-accent font-medium">{strategyMetrics[0]?.strategy}</span>
            </span>
            {strategyMetrics.length > 1 && strategyMetrics[strategyMetrics.length - 1].pnl < 0 && (
              <span>
                Revisar:{" "}
                <span className="font-medium text-red-400">
                  {strategyMetrics[strategyMetrics.length - 1]?.strategy}
                </span>
              </span>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
