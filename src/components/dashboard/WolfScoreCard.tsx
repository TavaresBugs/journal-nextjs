"use client";

import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { GlassCard } from "@/components/ui";
import { WolfScoreResult, getWolfScoreRadarData } from "@/lib/wolfScore";
import { Info } from "lucide-react";

interface WolfScoreCardProps {
  wolfScore: WolfScoreResult;
}

/**
 * Wolf Score Card Component
 * Displays a radar chart with trading metrics and overall score
 */
const METRIC_DETAILS = {
  winRate: {
    label: "Win %",
    desc: "Peso: 15% | Objetivo: 60%+ Win Rate. Mede a frequência de acertos.",
  },
  profitFactor: {
    label: "Profit Factor",
    desc: "Peso: 25% | Objetivo: > 2.6 PF. Relação lucro bruto / perda bruta.",
  },
  avgWinLoss: {
    label: "Avg Win/Loss",
    desc: "Peso: 20% | Objetivo: > 2.6. Média de ganho vs média de perda.",
  },
  recovery: {
    label: "Recovery",
    desc: "Peso: 10% | Objetivo: > 3.5. Capacidade de recuperar drawdowns.",
  },
  maxDD: {
    label: "Max DD",
    desc: "Peso: 20% | Menor Drawdown = Maior pontuação. Proteção de capital.",
  },
  consistency: { label: "Consistência", desc: "Peso: 10% | Estabilidade dos resultados diários." },
};

export function WolfScoreCard({ wolfScore }: WolfScoreCardProps) {
  const radarData = getWolfScoreRadarData(wolfScore.metrics);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#00c853";
    if (score >= 60) return "#eab308";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  return (
    <GlassCard className="relative overflow-hidden p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐺</span>
          <h3 className="text-lg font-bold text-gray-100">Wolf Score</h3>
          <div className="group relative">
            <Info className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
            <div className="pointer-events-none absolute top-6 left-0 z-50 w-64 rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              <p className="mb-2 font-semibold text-white">Zella Score System:</p>
              <ul className="space-y-1 text-gray-400">
                <li>
                  Avaliação completa baseada em 6 pilares fundamentais do trading profissional.
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div
          className="rounded-lg px-3 py-1 text-lg font-bold"
          style={{ backgroundColor: `${wolfScore.gradeColor}20`, color: wolfScore.gradeColor }}
        >
          {wolfScore.grade}
        </div>
      </div>

      {/* Radar Chart Area */}
      <div className="h-64 w-full">
        {/* ... radar chart code remains same ... */}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}`, "Score"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Display */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
            Wolf Score
          </span>
          <span className="text-3xl font-bold" style={{ color: getScoreColor(wolfScore.score) }}>
            {wolfScore.score.toFixed(2)}
          </span>
        </div>

        {/* Score Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #00c853)",
            }}
          />
          <div
            className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow-lg transition-all duration-500"
            style={{ left: `calc(${Math.min(wolfScore.score, 100)}% - 3px)` }}
          />
          <div
            className="absolute top-0 right-0 h-full bg-gray-700/80 transition-all duration-500"
            style={{ width: `${100 - Math.min(wolfScore.score, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>

        <p className="text-center text-sm text-gray-400">{wolfScore.description}</p>
      </div>

      {/* Metrics breakdown - Improved Layout */}
      <details className="group/details mt-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm text-gray-400 select-none hover:text-gray-300">
          <span>Ver detalhes das métricas</span>
          <span className="text-xs opacity-50 transition-transform group-open/details:rotate-180">
            ▼
          </span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 text-base">
          <MetricRow detail={METRIC_DETAILS.winRate} value={wolfScore.metrics.winRate} />
          <MetricRow detail={METRIC_DETAILS.profitFactor} value={wolfScore.metrics.profitFactor} />
          <MetricRow detail={METRIC_DETAILS.avgWinLoss} value={wolfScore.metrics.avgWinLossRatio} />
          <MetricRow detail={METRIC_DETAILS.recovery} value={wolfScore.metrics.recoveryFactor} />
          <MetricRow detail={METRIC_DETAILS.maxDD} value={wolfScore.metrics.maxDrawdownScore} />
          <MetricRow detail={METRIC_DETAILS.consistency} value={wolfScore.metrics.consistency} />
        </div>
      </details>
    </GlassCard>
  );
}

function MetricRow({ detail, value }: { detail: { label: string; desc: string }; value: number }) {
  const getMetricColor = (v: number) => {
    if (v >= 80) return "text-[#00c853]";
    if (v >= 60) return "text-yellow-400";
    if (v >= 40) return "text-orange-400";
    return "text-[#ef4444]";
  };

  return (
    <div className="flex items-center justify-between rounded border border-gray-700/30 bg-gray-800/50 px-3 py-2">
      <div className="group relative flex items-center gap-1.5">
        <span className="text-gray-400">{detail.label}</span>
        <Info className="h-3 w-3 cursor-help text-gray-600 hover:text-gray-300" />
        {/* Tooltip */}
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 rounded border border-gray-700 bg-gray-900 p-3 text-sm text-gray-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {detail.desc}
        </div>
      </div>
      <span className={`font-bold ${getMetricColor(value)}`}>{value.toFixed(1)}</span>
    </div>
  );
}
