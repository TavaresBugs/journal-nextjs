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
import { WolfScoreResult, getWolfScoreRadarData } from "@/lib/utils/trading";
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
          <svg
            className="h-6 w-6"
            viewBox="0 0 512 512"
            fill="currentColor"
            style={{ color: "#8b5cf6" }}
          >
            <path d="M483.009,360.176c-1.424-13.064-3.35-25.629-5.698-37.614c-5.947-30.987-14.822-58.301-23.956-81.165c-19.686-48.919-41.045-77.566-41.045-77.566s9.886-14.242,12.484-67.52c0.248-3.682,0.331-7.453,0.417-11.478c1.088-43.307-15.412-71.954-28.398-81.337c-5.861-4.352-10.973-4.688-13.404-0.753c-3.096,4.778-14.238,21.195-27.138,39.789c-1.174,1.596-2.348,3.273-3.518,5.031c-21.028,30.406-45.07,64.748-45.07,64.748H256h-51.684c0,0-24.042-34.341-45.069-64.748c-1.17-1.758-2.344-3.435-3.517-5.031C142.829,23.94,131.687,7.522,128.591,2.744c-2.429-3.935-7.542-3.599-13.404,0.753c-12.986,9.383-29.486,38.03-28.398,81.337c0.086,4.025,0.168,7.796,0.417,11.478c2.597,53.278,12.483,67.52,12.483,67.52s-21.359,28.648-41.045,77.566c-9.133,22.864-18.009,50.178-23.956,81.165c-2.347,11.984-4.274,24.55-5.697,37.614c-0.086,0.589-0.086,1.26-0.168,1.849l1.174-0.09l0.667-0.081h1.006l47.078-2.928l-6.282,50.758l49.589-7.706l8.377,36.272l36.309-19.142c11.607,31.143,26.868,70.678,33.257,81.075c10.938,17.85,35.02,12.754,52.534,2.561c1.297-0.761,2.376-1.448,3.346-2.103c0.969,0.654,2.041,1.342,3.354,2.103c17.51,10.193,41.585,15.289,52.526-2.561c6.389-10.406,21.743-49.974,33.424-81.116l36.386,19.184l8.377-36.272l49.589,7.706l-6.283-50.758l47.078,2.928h1.007l0.666,0.081l1.174,0.09C483.094,361.436,483.094,360.765,483.009,360.176z M128.845,146.056c-12.823-14.814-18.21-50.93-13.866-67.839c2.724-10.66,13.182-15.068,19.727-7.542c6.56,7.534,29.568,49.638,29.568,49.638S132.072,144.445,128.845,146.056z M168.045,329.386c0,0-13.96-29.318-16.753-40.484c34.901,0,48.865,19.543,54.448,25.13l8.376,18.152L168.045,329.386z M283.638,456.066c-10.671,13.596-20.635,14.022-27.642,14.022c-7.006,0-16.962-0.426-27.646-14.022c-8.561-10.888-1.559-24.14,9.35-24.14c3.89,0,18.295,0,18.295,0s14.414,0,18.303,0C285.212,431.926,292.218,445.178,283.638,456.066z M343.955,329.386l-46.072,2.798l8.377-18.152c5.583-5.587,19.547-25.13,54.448-25.13C357.915,300.067,343.955,329.386,343.955,329.386z M383.143,146.056c-3.223-1.611-35.42-25.743-35.42-25.743s23.003-42.104,29.555-49.638c6.548-7.526,17.003-3.117,19.739,7.542C401.365,95.126,395.965,131.241,383.143,146.056z" />
          </svg>
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
