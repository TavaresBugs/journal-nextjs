'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface StrategyComparisonChartProps {
    trades: Trade[];
    currency: string;
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
    if (winRate >= 60) return '#10b981'; // emerald
    if (winRate >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
};

const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? '#10b981' : '#ef4444';
};

const getRRColor = (rr: number | null) => {
    if (rr === null) return '#6b7280';
    if (rr >= 2) return '#10b981';
    if (rr >= 1) return '#f59e0b';
    return '#ef4444';
};

export function StrategyComparisonChart({ trades, currency }: StrategyComparisonChartProps) {
    const strategyMetrics: StrategyMetric[] = useMemo(() => {
        const strategyStats = trades.reduce((acc, trade) => {
            const strategy = trade.strategy || 'Sem Estratégia';
            if (!acc[strategy]) {
                acc[strategy] = { 
                    strategy, 
                    trades: 0, 
                    wins: 0, 
                    losses: 0, 
                    pnl: 0, 
                    rMultiples: [] as number[]
                };
            }
            acc[strategy].trades += 1;
            acc[strategy].pnl += trade.pnl || 0;
            
            if (trade.outcome === 'win') {
                acc[strategy].wins += 1;
            } else if (trade.outcome === 'loss') {
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
        }, {} as Record<string, { strategy: string; trades: number; wins: number; losses: number; pnl: number; rMultiples: number[] }>);

        return Object.values(strategyStats)
            .map(stat => ({
                strategy: stat.strategy,
                trades: stat.trades,
                wins: stat.wins,
                losses: stat.losses,
                winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
                pnl: stat.pnl,
                avgRR: stat.rMultiples.length > 0 
                    ? stat.rMultiples.reduce((a, b) => a + b, 0) / stat.rMultiples.length 
                    : null
            }))
            .sort((a, b) => b.pnl - a.pnl);
    }, [trades]);

    // Calculate max values for scaling bars
    const maxPnl = Math.max(...strategyMetrics.map(s => Math.abs(s.pnl)), 1);
    const maxRR = Math.max(...strategyMetrics.map(s => Math.abs(s.avgRR || 0)), 3);

    if (trades.length === 0) {
        return (
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
                <h3 className="text-base font-medium text-gray-400 mb-8">Análise Comparativa de Estratégias</h3>
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Nenhum trade registrado ainda
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
            <h3 className="text-base font-medium text-gray-400 mb-6">Análise Comparativa de Estratégias</h3>
            
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-xs text-gray-500 uppercase tracking-wider font-medium border-b border-gray-800 pb-2">
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
                        className="grid grid-cols-4 gap-4 items-center py-3 px-2 rounded-lg hover:bg-gray-800/30 transition-colors group"
                    >
                        {/* Strategy Name */}
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-200">
                                {metric.strategy}
                            </span>
                            <span className="text-xs text-gray-500">
                                {metric.trades}T • {metric.wins}W/{metric.losses}L
                            </span>
                        </div>
                        
                        {/* Win Rate Bar */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded h-6 overflow-hidden">
                                <div 
                                    className="h-full rounded transition-all duration-500"
                                    style={{ 
                                        width: `${metric.winRate}%`,
                                        backgroundColor: getWinRateColor(metric.winRate)
                                    }}
                                />
                            </div>
                            <span 
                                className="text-sm font-bold min-w-[45px] text-right"
                                style={{ color: getWinRateColor(metric.winRate) }}
                            >
                                {metric.winRate.toFixed(0)}%
                            </span>
                        </div>
                        
                        {/* P&L Bar */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded h-6 overflow-hidden relative">
                                {metric.pnl >= 0 ? (
                                    <div 
                                        className="h-full rounded-r transition-all duration-500 absolute left-1/2"
                                        style={{ 
                                            width: `${(metric.pnl / maxPnl) * 50}%`,
                                            backgroundColor: getPnLColor(metric.pnl)
                                        }}
                                    />
                                ) : (
                                    <div 
                                        className="h-full rounded-l transition-all duration-500 absolute right-1/2"
                                        style={{ 
                                            width: `${(Math.abs(metric.pnl) / maxPnl) * 50}%`,
                                            backgroundColor: getPnLColor(metric.pnl)
                                        }}
                                    />
                                )}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
                            </div>
                            <span 
                                className="text-sm font-bold min-w-[80px] text-right"
                                style={{ color: getPnLColor(metric.pnl) }}
                            >
                                {formatCurrency(metric.pnl, currency)}
                            </span>
                        </div>
                        
                        {/* Avg RR Bar */}
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded h-6 overflow-hidden">
                                <div 
                                    className="h-full rounded transition-all duration-500"
                                    style={{ 
                                        width: metric.avgRR !== null ? `${Math.min((metric.avgRR / maxRR) * 100, 100)}%` : '0%',
                                        backgroundColor: getRRColor(metric.avgRR)
                                    }}
                                />
                            </div>
                            <span 
                                className="text-sm font-bold min-w-[45px] text-right"
                                style={{ color: getRRColor(metric.avgRR) }}
                            >
                                {metric.avgRR !== null ? `${metric.avgRR >= 0 ? '+' : ''}${metric.avgRR.toFixed(1)}R` : '—R'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Footer Summary */}
            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                    Total: <span className="text-gray-300 font-medium">{trades.length} trades</span>
                </span>
                {strategyMetrics.length > 0 && (
                    <>
                        <span>
                            Melhor: <span className="text-emerald-400 font-medium">{strategyMetrics[0]?.strategy}</span>
                        </span>
                        {strategyMetrics.length > 1 && strategyMetrics[strategyMetrics.length - 1].pnl < 0 && (
                            <span>
                                Revisar: <span className="text-red-400 font-medium">{strategyMetrics[strategyMetrics.length - 1]?.strategy}</span>
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
