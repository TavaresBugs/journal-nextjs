'use client';

import { useState } from 'react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { GlassCard } from '@/components/ui';
import { formatCurrency } from '@/lib/calculations';
import type { Trade } from '@/types';
import { usePlaybookMetrics } from '@/hooks/usePlaybookMetrics';
import {
    getTimeframePriority,
    getConditionLabel,
    getQualityLabel
} from '@/lib/utils/playbook';
import type {
    PlaybookReviewTabProps,
    ViewMode,
    HtfExpandedMetric,
    SessionMetric,
    ConditionMetric,
    TagExpandedMetric,
    LtfExpandedMetric
} from '@/types/playbookTypes';

const VIEW_FILTERS = [
    { id: 'htf' as ViewMode, label: 'HTF → LTF', icon: '🔍' },
    { id: 'heatmap' as ViewMode, label: 'Heatmap', icon: '🔥' },
    { id: 'report' as ViewMode, label: 'Relatório', icon: '🧠' },
];

export function PlaybookReviewTab({ trades, currency }: PlaybookReviewTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('htf');
    // Drill-down navigation state for expanded hierarchy
    const [drillPath, setDrillPath] = useState<{
        htf?: HtfExpandedMetric;
        session?: SessionMetric;
        condition?: ConditionMetric;
        tag?: TagExpandedMetric;
        ltf?: LtfExpandedMetric;
    }>({});

    const { nestedMetrics, hierarchicalMetrics } = usePlaybookMetrics(trades);

    if (trades.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <p>Nenhum trade encontrado para esta estratégia.</p>
                <p className="text-sm mt-2">Adicione trades para ver análises.</p>
            </div>
        );
    }

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 70) return '#10b981';
        if (winRate >= 50) return '#3b82f6';
        if (winRate > 0) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="space-y-6">
            {/* View Mode Tabs */}
            <GlassCard className="grid grid-cols-3 gap-2 p-1 bg-zorin-bg/30 border-white/5">
                {VIEW_FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setViewMode(filter.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            viewMode === filter.id
                                ? 'bg-zorin-accent/10 text-zorin-accent border border-zorin-accent/30 shadow-[0_0_10px_rgba(0,200,83,0.1)]'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                    </button>
                ))}
            </GlassCard>

            {/* ===== HTF CARDS VIEW with Hierarchical Drill-Down ===== */}
            {viewMode === 'htf' && (
                <div className="space-y-2">
                    {/* Breadcrumb Navigation */}
                    {(drillPath.htf || drillPath.session || drillPath.condition || drillPath.tag || drillPath.ltf) && (
                        <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <button 
                                onClick={() => setDrillPath({})}
                                className="px-3 py-1 bg-gray-700/30 text-gray-400 border border-gray-700 hover:bg-gray-700/50 hover:text-gray-200 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                📊 Início
                            </button>
                            
                            {drillPath.htf && (
                                <>
                                    <span className="text-gray-600 text-xs">→</span>
                                    <button 
                                        onClick={() => setDrillPath({ htf: drillPath.htf })}
                                        className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-full text-xs font-medium transition-colors"
                                    >
                                        {drillPath.htf.htf}
                                    </button>
                                </>
                            )}
                            {drillPath.session && (
                                <>
                                    <span className="text-gray-600 text-xs">→</span>
                                    <button 
                                        onClick={() => setDrillPath({ htf: drillPath.htf, session: drillPath.session })}
                                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        {drillPath.session.icon} {drillPath.session.session}
                                    </button>
                                </>
                            )}
                            {drillPath.condition && (
                                <>
                                    <span className="text-gray-600 text-xs">→</span>
                                    <button 
                                        onClick={() => setDrillPath({ htf: drillPath.htf, session: drillPath.session, condition: drillPath.condition })}
                                        className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        {drillPath.condition.icon} {getConditionLabel(drillPath.condition.condition)}
                                    </button>
                                </>
                            )}
                            {drillPath.tag && (
                                <>
                                    <span className="text-gray-600 text-xs">→</span>
                                    <button 
                                        onClick={() => setDrillPath({ htf: drillPath.htf, session: drillPath.session, condition: drillPath.condition, tag: drillPath.tag })}
                                        className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        🏷️ {drillPath.tag.tagCombo}
                                    </button>
                                </>
                            )}
                            {drillPath.ltf && (
                                <>
                                    <span className="text-gray-600 text-xs">→</span>
                                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                                        📈 {drillPath.ltf.ltf}
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Level 1: HTF Cards */}
                    {!drillPath.htf && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                Timeframe de Análise (HTF) → Timeframe de Entrada (LTF)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {hierarchicalMetrics.map((htf) => (
                                    <GlassCard
                                        key={htf.htf}
                                        onClick={() => setDrillPath({ htf })}
                                        className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-bold border border-indigo-500/30 whitespace-nowrap">
                                                📊 {htf.htf}
                                            </span>
                                            
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{htf.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{htf.wins}</span> / <span className="text-red-400">{htf.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${htf.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(htf.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={htf.winRate} size={50} strokeWidth={5} color={getWinRateColor(htf.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{htf.avgRR ? htf.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
                                                Ver {htf.sessionBreakdown.length} sessões <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                        </GlassCard>
                                    ))}
                            </div>
                        </>
                    )}

                    {/* Level 2: Session Cards */}
                    {drillPath.htf && !drillPath.session && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🕐 Sessões
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {drillPath.htf!.sessionBreakdown.map((sess) => (
                                    <GlassCard
                                        key={sess.session}
                                        onClick={() => setDrillPath({ ...drillPath, session: sess })}
                                        className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-bold border border-emerald-500/30 whitespace-nowrap">
                                                {sess.icon} {sess.session}
                                            </span>
                                            
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{sess.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{sess.wins}</span> / <span className="text-red-400">{sess.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${sess.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(sess.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={sess.winRate} size={50} strokeWidth={5} color={getWinRateColor(sess.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{sess.avgRR ? sess.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                                                Ver {sess.conditionBreakdown.length} condições <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                        </GlassCard>
                                    ))}
                            </div>
                        </>
                    )}

                    {/* Level 3: Condition Cards */}
                    {drillPath.session && !drillPath.condition && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📊 Condições de Mercado
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {drillPath.session!.conditionBreakdown.map((cond) => (
                                    <GlassCard
                                        key={cond.condition}
                                        onClick={() => setDrillPath({ ...drillPath, condition: cond })}
                                        className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-bold border border-amber-500/30 whitespace-nowrap">
                                                {cond.icon} {getConditionLabel(cond.condition)}
                                            </span>
                                            
                                            {/* Info Grid Expanded */}
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{cond.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{cond.wins}</span> / <span className="text-red-400">{cond.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${cond.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(cond.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={cond.winRate} size={50} strokeWidth={5} color={getWinRateColor(cond.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{cond.avgRR ? cond.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                                                Ver {cond.tagBreakdown.length} confluências <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                        </GlassCard>
                                    ))}
                            </div>
                        </>
                    )}

                    {/* Level 4: Tag Combo Cards */}
                    {drillPath.condition && !drillPath.tag && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🏷️ Confluências
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {drillPath.condition!.tagBreakdown.map((tag) => (
                                    <GlassCard
                                        key={tag.tagCombo}
                                        onClick={() => setDrillPath({ ...drillPath, tag })}
                                        className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-bold border border-purple-500/30 whitespace-nowrap truncate max-w-[200px]" title={tag.tagCombo}>
                                                🏷️ {tag.tagCombo}
                                            </span>
                                            
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{tag.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{tag.wins}</span> / <span className="text-red-400">{tag.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${tag.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(tag.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={tag.winRate} size={50} strokeWidth={5} color={getWinRateColor(tag.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{tag.avgRR ? tag.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-purple-400 flex items-center gap-1 transition-colors">
                                                Ver {tag.ltfBreakdown.length} TF entrada <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                        </GlassCard>
                                    ))}
                            </div>
                        </>
                    )}

                    {/* Level 5: LTF Cards */}
                    {drillPath.tag && !drillPath.ltf && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📈 Timeframe de Entrada (LTF)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {drillPath.tag!.ltfBreakdown.map((ltf) => (
                                    <GlassCard
                                        key={ltf.ltf}
                                        onClick={() => setDrillPath({ ...drillPath, ltf })}
                                        className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-bold border border-cyan-500/30 whitespace-nowrap">
                                                📈 {ltf.ltf}
                                            </span>
                                            
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{ltf.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{ltf.wins}</span> / <span className="text-red-400">{ltf.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${ltf.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(ltf.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={ltf.winRate} size={50} strokeWidth={5} color={getWinRateColor(ltf.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{ltf.avgRR ? ltf.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                                                Ver {ltf.qualityBreakdown.length} qualidades <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Level 6: Quality Cards (Final Level) */}
                    {drillPath.ltf && (
                        <>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ⭐ Qualidade de Entrada
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {drillPath.ltf!.qualityBreakdown.map((q) => (
                                    <GlassCard
                                        key={q.quality}
                                        className="bg-zorin-bg/30 border-white/5 cursor-default"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className="px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-bold border border-gray-600 whitespace-nowrap">
                                                {q.icon} {getQualityLabel(q.quality)}
                                            </span>
                                            
                                            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                                                    <div className="text-lg font-medium text-gray-200">{q.totalTrades}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                                                    <div className="text-lg font-medium">
                                                        <span className="text-emerald-400">{q.wins}</span> / <span className="text-red-400">{q.losses}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                                                    <div className={`text-base font-bold whitespace-nowrap ${q.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(q.pnl, currency)}</div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <CircularProgress percentage={q.winRate} size={50} strokeWidth={5} color={getWinRateColor(q.winRate)} backgroundColor="#374151" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                 <span>Avg RR: <span className="text-gray-300 font-medium">{q.avgRR ? q.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                            </div>
                                            {/* End of line, no more drill down */}
                                            <span className="text-xs text-gray-600">
                                                Fim da análise
                                            </span>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ===== HEATMAP VIEW ===== */}
            {viewMode === 'heatmap' && (() => {
                // Build heatmap data: rows = HTF+TagCombo, columns = LTF
                const allLtfs = new Set<string>();
                const rows: { label: string; htf: string; tagCombo: string; cells: Map<string, { winRate: number; avgRR: number | null; totalTrades: number; pnl: number }> }[] = [];
                
                nestedMetrics.forEach(htfData => {
                    htfData.tagBreakdown.forEach(tagData => {
                        const cells = new Map<string, { winRate: number; avgRR: number | null; totalTrades: number; pnl: number }>();
                        tagData.ltfBreakdown.forEach(ltf => {
                            allLtfs.add(ltf.ltf);
                            cells.set(ltf.ltf, { winRate: ltf.winRate, avgRR: ltf.avgRR, totalTrades: ltf.totalTrades, pnl: ltf.pnl });
                        });
                        rows.push({
                            label: `${htfData.htf} → ${tagData.tagCombo}`,
                            htf: htfData.htf,
                            tagCombo: tagData.tagCombo,
                            cells
                        });
                    });
                });
                
                // Sort rows by HTF priority (higher timeframe first)
                rows.sort((a, b) => getTimeframePriority(b.htf) - getTimeframePriority(a.htf));
                
                // Sort LTFs by timeframe hierarchy (smaller first for entry TFs)
                const sortedLtfs = Array.from(allLtfs).sort((a, b) => 
                    getTimeframePriority(a) - getTimeframePriority(b)
                );
                
                return (
                    <div className="space-y-4">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            🔥 Heatmap: Combinações × TF Entrada
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-900/90">
                                        <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium sticky left-0 bg-gray-900/90 z-10">
                                            HTF → Confluências
                                        </th>
                                        {sortedLtfs.map(ltf => (
                                            <th key={ltf} className="px-3 py-2 text-center text-xs font-medium">
                                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                                                    {ltf}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/30">
                                            <td className="px-3 py-2 sticky left-0 bg-gray-900/90 z-10">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-indigo-300 text-xs font-medium">{row.htf}</span>
                                                    <span className="text-purple-300 text-xs truncate max-w-[150px]" title={row.tagCombo}>
                                                        {row.tagCombo}
                                                    </span>
                                                </div>
                                            </td>
                                            {sortedLtfs.map(ltf => {
                                                const cell = row.cells.get(ltf);
                                                if (!cell || cell.totalTrades === 0) {
                                                    return <td key={ltf} className="px-3 py-2 text-center text-gray-700">—</td>;
                                                }
                                                return (
                                                    <td key={ltf} className="px-2 py-1 text-center">
                                                        <div 
                                                            className="inline-flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border text-xs font-medium min-w-[70px]"
                                                            style={{
                                                                backgroundColor: `${getWinRateColor(cell.winRate)}25`,
                                                                borderColor: `${getWinRateColor(cell.winRate)}50`,
                                                                color: getWinRateColor(cell.winRate)
                                                            }}
                                                        >
                                                            <span className="font-bold">{cell.winRate.toFixed(0)}%</span>
                                                            {cell.avgRR !== null && (
                                                                <span className={`text-[10px] ${cell.avgRR >= 1 ? 'text-emerald-400' : cell.avgRR >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                                                    {cell.avgRR >= 0 ? '+' : ''}{cell.avgRR.toFixed(1)}R
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400">{cell.totalTrades}T</span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span>
                                ≥70%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50"></span>
                                ≥50%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span>
                                &lt;50%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></span>
                                0%
                            </span>
                        </div>
                    </div>
                );
            })()}


            {/* ===== REPORT VIEW ===== */}
            {viewMode === 'report' && (() => {
                // Generate best setups from nested metrics
                const allSetups: Array<{
                    htf: string;
                    tagCombo: string;
                    ltf: string;
                    stats: { wins: number; losses: number; totalTrades: number; winRate: number; pnl: number; avgRR: number | null };
                }> = [];

                nestedMetrics.forEach(htfMetric => {
                    htfMetric.tagBreakdown.forEach(tagData => {
                        tagData.ltfBreakdown.forEach(ltfData => {
                            allSetups.push({
                                htf: htfMetric.htf,
                                tagCombo: tagData.tagCombo,
                                ltf: ltfData.ltf,
                                stats: {
                                    wins: ltfData.wins,
                                    losses: ltfData.losses,
                                    totalTrades: ltfData.totalTrades,
                                    winRate: ltfData.winRate,
                                    pnl: ltfData.pnl,
                                    avgRR: ltfData.avgRR
                                }
                            });
                        });
                    });
                });

                // Filter setups with at least 2 trades and sort by win rate
                const bestSetups = allSetups
                    .filter(s => s.stats.totalTrades >= 2)
                    .sort((a, b) => {
                        if (b.stats.winRate !== a.stats.winRate) return b.stats.winRate - a.stats.winRate;
                        if (b.stats.totalTrades !== a.stats.totalTrades) return b.stats.totalTrades - a.stats.totalTrades;
                        return (b.stats.avgRR || 0) - (a.stats.avgRR || 0);
                    });

                const worstSetups = [...allSetups]
                    .filter(s => s.stats.totalTrades >= 2)
                    .sort((a, b) => a.stats.winRate - b.stats.winRate)
                    .slice(0, 3);

                return (
                    <div className="space-y-6">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            🧠 Relatório Inteligente - Melhores Setups
                        </h4>
                        
                        {bestSetups.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>Adicione mais trades para gerar o relatório.</p>
                                <p className="text-sm mt-2">Mínimo: 2 trades por setup</p>
                            </div>
                        ) : (
                            <>
                                {/* Top 5 Best Setups */}
                                <div className="space-y-4">
                                    <div className="text-sm font-semibold text-emerald-400">
                                        🏆 TOP 5 MELHORES SETUPS
                                    </div>
                                    {bestSetups.slice(0, 5).map((setup, idx) => (
                                        <div 
                                            key={`${setup.htf}-${setup.tagCombo}-${setup.ltf}`}
                                            className="bg-linear-to-r from-emerald-500/10 to-transparent rounded-xl p-4 border border-emerald-500/30"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-3xl">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-base font-bold text-white mb-2">
                                                        WIN RATE {setup.stats.winRate.toFixed(0)}% ({setup.stats.totalTrades} trades)
                                                    </div>
                                                    
                                                    {/* Setup Details */}
                                                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                                        <div>
                                                            <span className="text-gray-500">HTF:</span>
                                                            <span className="text-indigo-300 ml-1 font-medium">{setup.htf}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Confluências:</span>
                                                            <span className="text-purple-300 ml-1 font-medium">{setup.tagCombo}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">LTF:</span>
                                                            <span className="text-cyan-300 ml-1 font-medium">{setup.ltf}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Performance Stats */}
                                                    <div className="flex items-center gap-4 text-xs bg-gray-900/50 rounded px-3 py-2">
                                                        <span className="text-gray-500">{setup.stats.totalTrades} trades</span>
                                                        <span className="text-emerald-400">{setup.stats.wins}W/{setup.stats.losses}L</span>
                                                        <span className={setup.stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                            {formatCurrency(setup.stats.pnl, currency)}
                                                        </span>
                                                        {setup.stats.avgRR !== null && (
                                                            <span className={setup.stats.avgRR >= 1 ? 'text-emerald-400' : 'text-amber-400'}>
                                                                {setup.stats.avgRR >= 0 ? '+' : ''}{setup.stats.avgRR.toFixed(2)}R
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Checklist */}
                                                    <div className="bg-gray-900/50 rounded-lg p-3 mt-3">
                                                        <div className="text-xs font-semibold text-gray-400 mb-2">💡 CHECKLIST:</div>
                                                        <div className="space-y-1 text-xs text-gray-300">
                                                            <div>✅ Análise em {setup.htf}</div>
                                                            <div>✅ Buscar confluências: {setup.tagCombo}</div>
                                                            <div>✅ Entrar em {setup.ltf}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Worst Setups */}
                                {worstSetups.length > 0 && worstSetups[0].stats.winRate < 50 && (
                                    <div className="space-y-4">
                                        <div className="text-sm font-semibold text-red-400">
                                            🚨 SETUPS PARA EVITAR
                                        </div>
                                        {worstSetups.filter(s => s.stats.winRate < 50).map((setup) => (
                                            <div 
                                                key={`worst-${setup.htf}-${setup.tagCombo}-${setup.ltf}`}
                                                className="bg-linear-to-r from-red-500/10 to-transparent rounded-xl p-4 border border-red-500/30"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-bold text-white">
                                                        ⚠️ WIN RATE {setup.stats.winRate.toFixed(0)}% ({setup.stats.totalTrades}T)
                                                    </div>
                                                    <span className={setup.stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                        {formatCurrency(setup.stats.pnl, currency)}
                                                    </span>
                                                </div>
                                                
                                                <div className="text-xs text-gray-400">
                                                    {setup.htf} • {setup.tagCombo} • {setup.ltf}
                                                </div>
                                                
                                                <div className="mt-2 text-xs text-red-300 bg-red-500/10 rounded px-2 py-1">
                                                    🚫 Evite este cenário ou revise sua estratégia.
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })()}

            {/* ===== HTF DETAIL MODAL with Confluências Combos ===== */}

        </div>
    );
}
