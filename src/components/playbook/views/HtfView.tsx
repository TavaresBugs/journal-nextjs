'use client';

import { GlassCard } from '@/components/ui';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { formatCurrency } from '@/lib/calculations';
import { getConditionLabel, getPdArrayLabel } from '@/lib/utils/playbook';
import type {
    HtfExpandedMetric,
    ConditionMetric,
    PdArrayExpandedMetric,
    SessionMetric,
    LtfExpandedMetric,
    TagMetric
} from '@/types/playbookTypes';

export interface DrillPath {
    htf?: HtfExpandedMetric;
    condition?: ConditionMetric;
    pdArray?: PdArrayExpandedMetric;
    session?: SessionMetric;
    ltf?: LtfExpandedMetric;
    tag?: TagMetric;
}

interface HtfViewProps {
    hierarchicalMetrics: HtfExpandedMetric[];
    drillPath: DrillPath;
    setDrillPath: (path: DrillPath) => void;
    currency: string;
}

const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 50) return '#3b82f6';
    if (winRate > 0) return '#f59e0b';
    return '#ef4444';
};

// Reusable metric card row
function MetricCardContent({ 
    totalTrades, wins, losses, pnl, winRate, currency 
}: { 
    totalTrades: number; wins: number; losses: number; pnl: number; winRate: number; avgRR: number | null; currency: string;
}) {
    return (
        <>
            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Trades</div>
                    <div className="text-lg font-medium text-gray-200">{totalTrades}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
                    <div className="text-lg font-medium">
                        <span className="text-emerald-400">{wins}</span> <span className="text-gray-500">/</span> <span className="text-red-400">{losses}</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase">Financeiro</div>
                    <div className={`text-base font-bold whitespace-nowrap ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(pnl, currency)}
                    </div>
                </div>
                <div className="flex justify-end">
                    <CircularProgress percentage={winRate} size={50} strokeWidth={5} color={getWinRateColor(winRate)} backgroundColor="#374151" />
                </div>
            </div>
        </>
    );
}

// Reusable footer for metric cards
function MetricCardFooter({ avgRR, nextLabel, nextCount, color }: { avgRR: number | null; nextLabel: string; nextCount: number; color: string }) {
    return (
        <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-gray-500">
                <span>Avg RR: <span className="text-gray-300 font-medium">{avgRR ? avgRR.toFixed(2) + 'R' : '-'}</span></span>
            </div>
            <span className={`text-sm text-gray-500 group-hover:${color} flex items-center gap-1 transition-colors`}>
                Ver {nextCount} {nextLabel} <span className="text-lg">→</span>
            </span>
        </div>
    );
}

export function HtfView({ hierarchicalMetrics, drillPath, setDrillPath, currency }: HtfViewProps) {
    return (
        <div className="space-y-2">
            {/* Breadcrumb Navigation */}
            {(drillPath.htf || drillPath.condition || drillPath.pdArray || drillPath.session || drillPath.ltf || drillPath.tag) && (
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
                                className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                🕐 {drillPath.htf.htf}
                            </button>
                        </>
                    )}
                    {drillPath.condition && (
                        <>
                            <span className="text-gray-600 text-xs">→</span>
                            <button 
                                onClick={() => setDrillPath({ htf: drillPath.htf, condition: drillPath.condition })}
                                className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                {drillPath.condition.icon} {getConditionLabel(drillPath.condition.condition)}
                            </button>
                        </>
                    )}
                    {drillPath.pdArray && (
                        <>
                            <span className="text-gray-600 text-xs">→</span>
                            <button 
                                onClick={() => setDrillPath({ htf: drillPath.htf, condition: drillPath.condition, pdArray: drillPath.pdArray })}
                                className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                {drillPath.pdArray.icon} {getPdArrayLabel(drillPath.pdArray.pdArray)}
                            </button>
                        </>
                    )}
                    {drillPath.session && (
                        <>
                            <span className="text-gray-600 text-xs">→</span>
                            <button 
                                onClick={() => setDrillPath({ htf: drillPath.htf, condition: drillPath.condition, pdArray: drillPath.pdArray, session: drillPath.session })}
                                className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                {drillPath.session.icon} {drillPath.session.session}
                            </button>
                        </>
                    )}
                    {drillPath.ltf && (
                        <>
                            <span className="text-gray-600 text-xs">→</span>
                            <button
                                onClick={() => setDrillPath({ htf: drillPath.htf, condition: drillPath.condition, pdArray: drillPath.pdArray, session: drillPath.session, ltf: drillPath.ltf })}
                                className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-full text-xs font-medium flex items-center gap-1"
                            >
                                📈 {drillPath.ltf.ltf}
                            </button>
                        </>
                    )}
                    {drillPath.tag && (
                        <>
                            <span className="text-gray-600 text-xs">→</span>
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-medium flex items-center gap-1">
                                🏷️ {drillPath.tag.tagCombo}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Level 1: HTF Cards */}
            {!drillPath.htf && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Timeframe de Análise (HTF)
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
                                        🕐 {htf.htf}
                                    </span>
                                    <MetricCardContent {...htf} currency={currency} />
                                </div>
                                <MetricCardFooter avgRR={htf.avgRR} nextLabel="condições" nextCount={htf.conditionBreakdown.length} color="text-indigo-400" />
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Level 2: Condition Cards */}
            {drillPath.htf && !drillPath.condition && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">📈 Condições de Mercado</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {drillPath.htf.conditionBreakdown.map((cond) => (
                            <GlassCard
                                key={cond.condition}
                                onClick={() => setDrillPath({ ...drillPath, condition: cond })}
                                className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <span className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-bold border border-amber-500/30 whitespace-nowrap">
                                        {cond.icon} {getConditionLabel(cond.condition)}
                                    </span>
                                    <MetricCardContent {...cond} currency={currency} />
                                </div>
                                <MetricCardFooter avgRR={cond.avgRR} nextLabel="PD Arrays" nextCount={cond.pdArrayBreakdown.length} color="text-amber-400" />
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Level 3: PD Array Cards */}
            {drillPath.condition && !drillPath.pdArray && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">📍 PD Arrays</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {drillPath.condition.pdArrayBreakdown.map((pd) => (
                            <GlassCard
                                key={pd.pdArray}
                                onClick={() => setDrillPath({ ...drillPath, pdArray: pd })}
                                className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg text-sm font-bold border border-orange-500/30 whitespace-nowrap">
                                        {pd.icon} {getPdArrayLabel(pd.pdArray)}
                                    </span>
                                    <MetricCardContent {...pd} currency={currency} />
                                </div>
                                <MetricCardFooter avgRR={pd.avgRR} nextLabel="sessões" nextCount={pd.sessionBreakdown.length} color="text-orange-400" />
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Level 4: Session Cards */}
            {drillPath.pdArray && !drillPath.session && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">🕐 Sessões</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {drillPath.pdArray.sessionBreakdown.map((sess) => (
                            <GlassCard
                                key={sess.session}
                                onClick={() => setDrillPath({ ...drillPath, session: sess })}
                                className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-bold border border-emerald-500/30 whitespace-nowrap">
                                        {sess.icon} {sess.session}
                                    </span>
                                    <MetricCardContent {...sess} currency={currency} />
                                </div>
                                <MetricCardFooter avgRR={sess.avgRR} nextLabel="TF entrada" nextCount={sess.ltfBreakdown.length} color="text-emerald-400" />
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Level 5: LTF Cards */}
            {drillPath.session && !drillPath.ltf && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">📈 Timeframe de Entrada (LTF)</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {drillPath.session.ltfBreakdown.map((ltf) => (
                            <GlassCard
                                key={ltf.ltf}
                                onClick={() => setDrillPath({ ...drillPath, ltf })}
                                className="bg-zorin-bg/30 border-white/5 hover:border-zorin-accent/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-bold border border-cyan-500/30 whitespace-nowrap">
                                        📈 {ltf.ltf}
                                    </span>
                                    <MetricCardContent {...ltf} currency={currency} />
                                </div>
                                <MetricCardFooter avgRR={ltf.avgRR} nextLabel="confluências" nextCount={ltf.tagBreakdown.length} color="text-cyan-400" />
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Level 6: Tag Cards (Final Level) */}
            {drillPath.ltf && (
                <>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Confluências</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {drillPath.ltf.tagBreakdown.map((tag) => (
                            <GlassCard key={tag.tagCombo} className="bg-zorin-bg/30 border-white/5 cursor-default">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-wrap gap-2 max-w-[300px]">
                                        {tag.tagCombo.split(' + ').map((t, i) => (
                                            <span 
                                                key={i} 
                                                className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30"
                                            >
                                                🏷️ {t}
                                            </span>
                                        ))}
                                    </div>
                                    <MetricCardContent {...tag} currency={currency} />
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>Avg RR: <span className="text-gray-300 font-medium">{tag.avgRR ? tag.avgRR.toFixed(2) + 'R' : '-'}</span></span>
                                    </div>
                                    <span className="text-xs text-gray-600">Fim da análise</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
