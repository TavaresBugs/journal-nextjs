import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui";
import { Trade, TradeMetrics } from "@/types";
import { formatCurrency, formatTimeMinutes } from "@/lib/calculations";
import { calculateWolfScore } from "@/lib/wolfScore";
import { WolfScoreCard } from "@/components/dashboard/WolfScoreCard";
import { WeekdayPerformanceCard } from "@/components/dashboard/WeekdayPerformanceCard";
import dynamic from "next/dynamic";

interface AdvancedMetrics {
  sharpe: number;
  calmar: number;
  holdTime: {
    avgWinnerTime: number;
    avgLoserTime: number;
    avgAllTrades: number;
  };
  streaks: {
    maxWinStreak: number;
    maxLossStreak: number;
    currentStreak: { type: "win" | "loss" | "none"; count: number };
  };
}

const Charts = dynamic(() => import("@/components/reports/Charts").then((mod) => mod.Charts), {
  ssr: false,
  loading: () => <div className="py-10 text-center text-gray-500">Carregando gráficos...</div>,
});

interface DashboardOverviewProps {
  metrics: TradeMetrics;
  advancedMetrics: AdvancedMetrics;
  allHistory: Trade[];
  currency: string;
  initialBalance: number;
  accountCreatedAt: string;
}

export function DashboardOverview({
  metrics,
  advancedMetrics,
  allHistory,
  currency,
  initialBalance,
  accountCreatedAt,
}: DashboardOverviewProps) {
  // Calculate Wolf Score
  const wolfScore = useMemo(
    () => calculateWolfScore(allHistory, metrics, initialBalance),
    [allHistory, metrics, initialBalance]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Relatórios de Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Unified Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Row 1 - Basic Metrics */}
            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Profit Factor
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {!isFinite(metrics.profitFactor) ? "∞" : metrics.profitFactor.toFixed(2)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4" />
                </svg>
              </div>
            </GlassCard>
            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Média de Lucro
              </div>
              <div className="text-2xl font-bold text-[#04df73]">
                {formatCurrency(metrics.avgWin, currency)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </GlassCard>
            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Média de Perda
              </div>
              <div className="text-2xl font-bold text-[#ff6467]">
                {formatCurrency(metrics.avgLoss, currency)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
              </div>
            </GlassCard>
            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Max Drawdown
              </div>
              <div className="text-2xl font-bold text-[#ff6467]">
                {formatCurrency(metrics.maxDrawdown, currency)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 8 12 12 16 14" />
                </svg>
              </div>
            </GlassCard>

            {/* Row 2 - Advanced Metrics */}
            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Índice Sharpe
              </div>
              <div
                className={`text-2xl font-bold ${
                  advancedMetrics.sharpe >= 2
                    ? "text-[#00c853]"
                    : advancedMetrics.sharpe >= 1
                      ? "text-[#00c853]"
                      : advancedMetrics.sharpe >= 0
                        ? "text-yellow-400"
                        : "text-[#ef4444]"
                }`}
              >
                {advancedMetrics.sharpe.toFixed(2)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Índice Calmar
              </div>
              <div
                className={`text-2xl font-bold ${
                  advancedMetrics.calmar >= 3
                    ? "text-[#00c853]"
                    : advancedMetrics.calmar >= 1
                      ? "text-[#00c853]"
                      : advancedMetrics.calmar >= 0
                        ? "text-yellow-400"
                        : "text-[#ef4444]"
                }`}
              >
                {advancedMetrics.calmar.toFixed(2)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Tempo Médio (G/P)
              </div>
              <div
                className={`text-xl font-bold ${
                  advancedMetrics.holdTime.avgWinnerTime > advancedMetrics.holdTime.avgLoserTime
                    ? "text-[#00c853]"
                    : "text-[#ef4444]"
                }`}
              >
                {formatTimeMinutes(advancedMetrics.holdTime.avgWinnerTime)} /{" "}
                {formatTimeMinutes(advancedMetrics.holdTime.avgLoserTime)}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden p-4">
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                Sequência Atual
              </div>
              <div
                className={`text-2xl font-bold ${
                  advancedMetrics.streaks.currentStreak.type === "win"
                    ? "text-[#00c853]"
                    : advancedMetrics.streaks.currentStreak.type === "loss"
                      ? "text-[#ef4444]"
                      : "text-gray-400"
                }`}
              >
                {advancedMetrics.streaks.currentStreak.type === "none"
                  ? "-"
                  : `${advancedMetrics.streaks.currentStreak.count} ${advancedMetrics.streaks.currentStreak.type === "win" ? "Ganhos" : "Perdas"}`}
              </div>
              <div className="absolute top-4 right-4 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            </GlassCard>
          </div>

          {/* Additional Info Row */}
          <div className="mt-4 border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 sm:grid-cols-4">
              <div>
                <span className="font-semibold text-gray-400">Sharpe: </span>
                {advancedMetrics.sharpe < 1
                  ? "Ruim"
                  : advancedMetrics.sharpe < 2
                    ? "Bom"
                    : advancedMetrics.sharpe < 3
                      ? "Muito Bom"
                      : "Excepcional"}
              </div>
              <div>
                <span className="font-semibold text-gray-400">Calmar: </span>
                {advancedMetrics.calmar < 1
                  ? "Fraco"
                  : advancedMetrics.calmar < 3
                    ? "Aceitável"
                    : "Bom"}
              </div>
              <div>
                <span className="font-semibold text-gray-400">Tempo Médio: </span>
                {formatTimeMinutes(advancedMetrics.holdTime.avgAllTrades)}
              </div>
              <div>
                <span className="font-semibold text-gray-400">Sequências: </span>
                {advancedMetrics.streaks.maxWinStreak}G / {advancedMetrics.streaks.maxLossStreak}P
              </div>
            </div>
          </div>

          {/* Wolf Score */}
          {/* Advanced Performance Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WolfScoreCard wolfScore={wolfScore} />
            <WeekdayPerformanceCard trades={allHistory} />
          </div>

          <Charts
            trades={allHistory}
            currency={currency}
            initialBalance={initialBalance}
            accountCreatedAt={accountCreatedAt}
          />
        </div>
      </CardContent>
    </Card>
  );
}
