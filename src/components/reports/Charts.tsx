"use client";

import type { Trade, PlaybookStats } from "@/types";
import dynamic from "next/dynamic";

// Lightweight Charts (40kb vs 450kb) - Performance optimized, v5 API
// Kept as dynamic imports since they are likely LCP candidates or near top of fold
const EquityCurveLightweight = dynamic(
  () => import("@/components/charts/lightweight").then((m) => m.EquityCurveLightweight),
  { ssr: false }
);

const PerformanceTimelineLightweight = dynamic(
  () => import("@/components/charts/lightweight").then((m) => m.PerformanceTimelineLightweight),
  { ssr: false }
);

// Recharts components - Wrapped in LazyChartWrapper for true on-scroll loading
import { LazyChartWrapper } from "@/components/charts/LazyChartWrapper";

interface ChartsProps {
  trades: Trade[];
  currency: string;
  initialBalance: number;
  accountCreatedAt: string;
  playbookStats?: PlaybookStats[];
}

export function Charts({
  trades,
  currency,
  initialBalance,
  accountCreatedAt,
  playbookStats,
}: ChartsProps) {
  return (
    <div className="space-y-8">
      {/* Hero Chart - Equity Curve */}
      <EquityCurveLightweight
        trades={trades}
        initialBalance={initialBalance}
        currency={currency}
        accountCreatedAt={accountCreatedAt}
      />

      {/* Separator */}
      <div className="border-t border-white/5"></div>

      {/* Section: Distribution Analysis */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          Análise de Distribuição
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LazyChartWrapper
            height={300}
            loader={() =>
              import("@/components/charts/recharts").then((m) => m.StrategyComparisonChart)
            }
            props={{ trades, currency, stats: playbookStats }}
          />
          <LazyChartWrapper
            height={300}
            loader={() =>
              import("@/components/charts/recharts").then((m) => m.WinLossDistributionChart)
            }
            props={{ trades }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/5"></div>

      {/* Section: Performance Over Time */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          Performance ao Longo do Tempo
        </h2>
        <PerformanceTimelineLightweight trades={trades} currency={currency} />
      </div>

      {/* Separator */}
      <div className="border-t border-white/5"></div>

      {/* Section: Asset & Timing Analysis */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          Análise de Ativos e Timing
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LazyChartWrapper
            height={300}
            loader={() =>
              import("@/components/charts/recharts").then((m) => m.AssetPerformanceChart)
            }
            props={{ trades, currency }}
          />
          <LazyChartWrapper
            height={300}
            loader={() => import("@/components/charts/recharts").then((m) => m.WeekdayWinRateChart)}
            props={{ trades }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/5"></div>

      {/* Section: Monthly Performance */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          Histórico Mensal
        </h2>
        <LazyChartWrapper
          height={400}
          loader={() =>
            import("@/components/charts/recharts").then((m) => m.MonthlyPerformanceGrid)
          }
          props={{ trades, currency }}
        />
      </div>

      {/* Separator */}
      <div className="border-t border-white/5"></div>

      {/* Section: Risk Analysis */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
          Análise de Risco
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LazyChartWrapper
            height={300}
            loader={() =>
              import("@/components/charts/lightweight").then((m) => m.DrawdownChartLightweight)
            }
            props={{ trades, initialBalance, accountCreatedAt }}
          />
          <LazyChartWrapper
            height={300}
            loader={() =>
              import("@/components/charts/recharts").then((m) => m.RMultipleDistributionChart)
            }
            props={{ trades }}
          />
        </div>
      </div>
    </div>
  );
}
