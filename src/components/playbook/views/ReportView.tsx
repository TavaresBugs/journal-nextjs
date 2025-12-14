'use client';

import { formatCurrency } from '@/lib/calculations';
import { getPdArrayIcon, getConditionIcon, getConditionLabel } from '@/lib/utils/playbook';
import type { HtfNestedMetric } from '@/types/playbookTypes';

interface ReportViewProps {
    nestedMetrics: HtfNestedMetric[];
    currency: string;
}

export function ReportView({ nestedMetrics, currency }: ReportViewProps) {
    const allSetups: Array<{
        htf: string;
        condition?: string;
        pdArray?: string;
        tagCombo: string;
        ltf: string;
        stats: { wins: number; losses: number; totalTrades: number; winRate: number; pnl: number; avgRR: number | null };
    }> = [];

    nestedMetrics.forEach(htfMetric => {
        htfMetric.tagBreakdown.forEach(tagData => {
            tagData.ltfBreakdown.forEach(ltfData => {
                allSetups.push({
                    htf: htfMetric.htf,
                    condition: ltfData.condition,
                    pdArray: tagData.pdArray,
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
                                {/* Medal + Win Rate Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                    </span>
                                    <div className="text-base font-bold text-white">
                                        WIN RATE {setup.stats.winRate.toFixed(0)}% ({setup.stats.totalTrades} trades)
                                    </div>
                                </div>
                                
                                {/* Flow Line: HTF → Condição → PD Array → LTF */}
                                <div className="flex flex-wrap items-center gap-2 text-sm mb-3 bg-gray-900/40 rounded-lg px-3 py-2">
                                    <span className="text-indigo-300 font-semibold">🕐 {setup.htf}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-sky-300 font-medium">
                                        {getConditionIcon(setup.condition || '')} {getConditionLabel(setup.condition || '')}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-amber-300 font-medium">
                                        {getPdArrayIcon(setup.pdArray || '')} {setup.pdArray || 'N/A'}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-cyan-300 font-semibold">{setup.ltf}</span>
                                </div>
                                
                                {/* Stats Bar */}
                                <div className="flex items-center gap-4 text-xs bg-gray-900/50 rounded-lg px-3 py-2 mb-3">
                                    <span className="text-gray-400">{setup.stats.totalTrades} trades</span>
                                    <span className="text-emerald-400 font-medium">{setup.stats.wins}W/{setup.stats.losses}L</span>
                                    <span className={`font-medium ${setup.stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(setup.stats.pnl, currency)}
                                    </span>
                                    {setup.stats.avgRR !== null && (
                                        <span className={`font-medium ${setup.stats.avgRR >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {setup.stats.avgRR >= 0 ? '+' : ''}{setup.stats.avgRR.toFixed(2)}R
                                        </span>
                                    )}
                                </div>
                                
                                {/* Execução */}
                                <div className="bg-gray-900/50 rounded-lg p-3 mb-2">
                                    <div className="text-xs font-semibold text-emerald-400 mb-2">🎯 EXECUÇÃO:</div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-400 mt-0.5">✓</span>
                                            <span className="text-gray-300">Confirmar estrutura em <span className="text-indigo-300 font-medium">{setup.htf}</span></span>
                                        </div>
                                        {setup.pdArray && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-emerald-400 mt-0.5">✓</span>
                                                <span className="text-gray-300">Buscar <span className="text-amber-300 font-medium">{setup.pdArray}</span> não mitigado</span>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-400 mt-0.5">✓</span>
                                            <span className="text-gray-300">Refinamento em <span className="text-cyan-300 font-medium">{setup.ltf}</span></span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Regras */}
                                <div className="bg-gray-900/50 rounded-lg p-3 mb-2">
                                    <div className="text-xs font-semibold text-amber-400 mb-2">⚡ REGRAS:</div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5">•</span>
                                            <span className="text-gray-300">Stop além do PD Array</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5">•</span>
                                            <span className="text-gray-300">Mínimo 2R de RR</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5">•</span>
                                            <span className="text-gray-300">Operar a favor do HTF</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Confluências */}
                                <div className="bg-gray-900/50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-purple-400 mb-2">🏷️ CONFLUÊNCIAS:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {setup.tagCombo.split(' + ').map((tag, i) => (
                                            <span 
                                                key={i}
                                                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md text-xs font-medium border border-purple-500/30"
                                            >
                                                {tag}
                                            </span>
                                        ))}
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
}
