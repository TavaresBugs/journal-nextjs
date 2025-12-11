import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from '@/components/ui';
import { Trade, Playbook } from '@/types';
import {
    formatCurrency,
    formatTimeMinutes
} from '@/lib/calculations';
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('@/components/reports/Charts').then(mod => mod.Charts), {
    ssr: false,
    loading: () => <div className="text-center py-10 text-gray-500">Carregando gráficos...</div>
});

interface DashboardOverviewProps {
    metrics: any; // Using any for now as metrics type is inferred in page
    advancedMetrics: any;
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
    accountCreatedAt
}: DashboardOverviewProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>📊 Relatórios de Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Unified Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Row 1 - Basic Metrics */}
                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Profit Factor</div>
                            <div className="text-2xl font-bold text-gray-100">{metrics.profitFactor.toFixed(2)}</div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                            </div>
                        </GlassCard>
                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Lucro</div>
                            <div className="text-2xl font-bold text-green-400">
                                {formatCurrency(metrics.avgWin, currency)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            </div>
                        </GlassCard>
                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Perda</div>
                            <div className="text-2xl font-bold text-red-400">
                                {formatCurrency(metrics.avgLoss, currency)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                            </div>
                        </GlassCard>
                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Max Drawdown</div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {formatCurrency(metrics.maxDrawdown, currency)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/></svg>
                            </div>
                        </GlassCard>

                        {/* Row 2 - Advanced Metrics */}
                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Índice Sharpe</div>
                            <div className={`text-2xl font-bold ${
                                advancedMetrics.sharpe >= 2 ? 'text-green-400' :
                                advancedMetrics.sharpe >= 1 ? 'text-cyan-400' :
                                advancedMetrics.sharpe >= 0 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                                {advancedMetrics.sharpe.toFixed(2)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Índice Calmar</div>
                            <div className={`text-2xl font-bold ${
                                advancedMetrics.calmar >= 3 ? 'text-green-400' :
                                advancedMetrics.calmar >= 1 ? 'text-cyan-400' :
                                advancedMetrics.calmar >= 0 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                                {advancedMetrics.calmar.toFixed(2)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo Médio (G/P)</div>
                            <div className={`text-xl font-bold ${
                                advancedMetrics.holdTime.avgWinnerTime > advancedMetrics.holdTime.avgLoserTime ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {formatTimeMinutes(advancedMetrics.holdTime.avgWinnerTime)} / {formatTimeMinutes(advancedMetrics.holdTime.avgLoserTime)}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-4 relative overflow-hidden">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Sequência Atual</div>
                            <div className={`text-2xl font-bold ${
                                advancedMetrics.streaks.currentStreak.type === 'win' ? 'text-green-400' :
                                advancedMetrics.streaks.currentStreak.type === 'loss' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                                {advancedMetrics.streaks.currentStreak.type === 'none' ? '-' :
                                    `${advancedMetrics.streaks.currentStreak.count} ${advancedMetrics.streaks.currentStreak.type === 'win' ? 'Ganhos' : 'Perdas'}`}
                            </div>
                            <div className="absolute top-4 right-4 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Additional Info Row */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400">
                            <div>
                                <span className="font-semibold text-gray-400">Sharpe: </span>
                                {advancedMetrics.sharpe < 1 ? 'Ruim' : advancedMetrics.sharpe < 2 ? 'Bom' : advancedMetrics.sharpe < 3 ? 'Muito Bom' : 'Excepcional'}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-400">Calmar: </span>
                                {advancedMetrics.calmar < 1 ? 'Fraco' : advancedMetrics.calmar < 3 ? 'Aceitável' : 'Bom'}
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
