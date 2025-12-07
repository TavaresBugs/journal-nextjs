'use client';

import type { Trade } from '@/types';
import dynamic from 'next/dynamic';

// Lightweight Charts (40kb vs 450kb) - Performance optimized, v5 API
const EquityCurveLightweight = dynamic(
    () => import('@/components/charts/lightweight').then(m => m.EquityCurveLightweight),
    { ssr: false }
);

const PerformanceTimelineLightweight = dynamic(
    () => import('@/components/charts/lightweight').then(m => m.PerformanceTimelineLightweight),
    { ssr: false }
);

const DrawdownChartLightweight = dynamic(
    () => import('@/components/charts/lightweight').then(m => m.DrawdownChartLightweight),
    { ssr: false }
);

// Recharts components (modular)
const StrategyComparisonChart = dynamic(() => import('@/components/charts/recharts').then(m => m.StrategyComparisonChart), { ssr: false });
const WinLossDistributionChart = dynamic(() => import('@/components/charts/recharts').then(m => m.WinLossDistributionChart), { ssr: false });
const AssetPerformanceChart = dynamic(() => import('@/components/charts/recharts').then(m => m.AssetPerformanceChart), { ssr: false });
const MonthlyPerformanceGrid = dynamic(() => import('@/components/charts/recharts').then(m => m.MonthlyPerformanceGrid), { ssr: false });
const WeekdayWinRateChart = dynamic(() => import('@/components/charts/recharts').then(m => m.WeekdayWinRateChart), { ssr: false });
const RMultipleDistributionChart = dynamic(() => import('@/components/charts/recharts').then(m => m.RMultipleDistributionChart), { ssr: false });

interface ChartsProps {
    trades: Trade[];
    currency: string;
    initialBalance: number;
    accountCreatedAt: string;
}

export function Charts({ trades, currency, initialBalance, accountCreatedAt }: ChartsProps) {
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
            <div className="border-t border-gray-800/50"></div>

            {/* Section: Distribution Analysis */}
            <div className="space-y-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Análise de Distribuição
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StrategyComparisonChart trades={trades} currency={currency} />
                    <WinLossDistributionChart trades={trades} />
                </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-800/50"></div>

            {/* Section: Performance Over Time */}
            <div className="space-y-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Performance ao Longo do Tempo
                </h2>
                <PerformanceTimelineLightweight
                    trades={trades}
                    currency={currency}
                />
            </div>

            {/* Separator */}
            <div className="border-t border-gray-800/50"></div>

            {/* Section: Asset & Timing Analysis */}
            <div className="space-y-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Análise de Ativos e Timing
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AssetPerformanceChart trades={trades} currency={currency} />
                    <WeekdayWinRateChart trades={trades} />
                </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-800/50"></div>

            {/* Section: Monthly Performance */}
            <div className="space-y-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Histórico Mensal
                </h2>
                <MonthlyPerformanceGrid trades={trades} currency={currency} />
            </div>

            {/* Separator */}
            <div className="border-t border-gray-800/50"></div>

            {/* Section: Risk Analysis */}
            <div className="space-y-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Análise de Risco
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DrawdownChartLightweight
                        trades={trades}
                        initialBalance={initialBalance}
                        accountCreatedAt={accountCreatedAt}
                    />
                    <RMultipleDistributionChart trades={trades} />
                </div>
            </div>
        </div>
    );
}
