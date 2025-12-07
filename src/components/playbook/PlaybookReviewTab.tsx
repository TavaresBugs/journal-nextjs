'use client';

import { useState, useMemo } from 'react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { formatCurrency } from '@/lib/calculations';
import type { Trade } from '@/types';

interface PlaybookReviewTabProps {
    trades: Trade[];
    currency: string;
}

type ViewMode = 'htf' | 'heatmap';

const VIEW_FILTERS = [
    { id: 'htf' as ViewMode, label: 'HTF → LTF', icon: '🔍' },
    { id: 'heatmap' as ViewMode, label: 'Heatmap', icon: '🔥' },
];

// Timeframe priority: higher value = higher priority (longer timeframe first)
const getTimeframePriority = (tf: string): number => {
    const normalized = tf.toLowerCase().replace(/\s/g, '');
    if (normalized.includes('mensal') || normalized === 'mn' || normalized === 'm1' && tf.includes('M')) return 100;
    if (normalized.includes('semanal') || normalized === 'w1' || normalized === 'w') return 90;
    if (normalized.includes('diario') || normalized.includes('diário') || normalized === 'd1' || normalized === 'd') return 80;
    if (normalized === 'h4' || normalized === '4h') return 70;
    if (normalized === 'h1' || normalized === '1h') return 60;
    if (normalized === 'm30' || normalized === '30m') return 50;
    if (normalized === 'm15' || normalized === '15m') return 40;
    if (normalized === 'm5' || normalized === '5m') return 30;
    if (normalized === 'm3' || normalized === '3m') return 20;
    if (normalized === 'm1' || normalized === '1m') return 10;
    return 0;
};

// Nested metrics interface: HTF -> Tag Combo -> LTF
interface LtfMetric {
    ltf: string;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
}

interface TagComboMetric {
    tagCombo: string;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
    ltfBreakdown: LtfMetric[];
}

interface HtfNestedMetric {
    htf: string;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
    tagBreakdown: TagComboMetric[];
}

// Build nested metrics: HTF -> Tag Combination -> LTF
function buildNestedMetrics(trades: Trade[]): HtfNestedMetric[] {
    const htfMap = new Map<string, Map<string, Map<string, { wins: number; losses: number; pnl: number; rMultiples: number[] }>>>();
    
    trades.forEach(trade => {
        const htf = trade.tfAnalise || 'N/A';
        const ltf = trade.tfEntrada || 'N/A';
        // Treat full tag combination as single unit (sorted alphabetically)
        const tagCombo = trade.tags 
            ? trade.tags.split(',').map(t => t.trim()).filter(Boolean).sort().join(' + ')
            : 'Sem Tags';
        const pnl = trade.pnl || 0;
        const isWin = trade.outcome === 'win';
        const isLoss = trade.outcome === 'loss';
        
        if (!htfMap.has(htf)) htfMap.set(htf, new Map());
        const tagMap = htfMap.get(htf)!;
        if (!tagMap.has(tagCombo)) tagMap.set(tagCombo, new Map());
        const ltfMap = tagMap.get(tagCombo)!;
        if (!ltfMap.has(ltf)) ltfMap.set(ltf, { wins: 0, losses: 0, pnl: 0, rMultiples: [] });
        
        const stats = ltfMap.get(ltf)!;
        if (isWin) stats.wins++;
        else if (isLoss) stats.losses++;
        stats.pnl += pnl;
        
        // Calculate R-Multiple: use rMultiple if available, otherwise calculate from stopLoss
        let rMultiple = trade.rMultiple;
        if (rMultiple === undefined || rMultiple === null) {
            // Calculate R based on entry/stop and pnl
            if (trade.entryPrice && trade.stopLoss && trade.lot && pnl !== 0) {
                const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
                if (riskInPoints > 0) {
                    // Risk in same unit as pnl (simplified: assume pnl is already in account currency)
                    // R-Multiple = actual return / expected risk (using pnl sign)
                    const expectedRisk = riskInPoints * trade.lot;
                    if (expectedRisk > 0) {
                        rMultiple = pnl / expectedRisk;
                    }
                }
            }
        }
        
        if (rMultiple !== undefined && rMultiple !== null && !isNaN(rMultiple)) {
            stats.rMultiples.push(rMultiple);
        }
    });
    
    const result: HtfNestedMetric[] = [];
    
    htfMap.forEach((tagMap, htf) => {
        let htfWins = 0, htfLosses = 0, htfPnl = 0;
        const htfRMultiples: number[] = [];
        const tagBreakdown: TagComboMetric[] = [];
        
        tagMap.forEach((ltfMap, tagCombo) => {
            let tagWins = 0, tagLosses = 0, tagPnl = 0;
            const tagRMultiples: number[] = [];
            const ltfBreakdown: LtfMetric[] = [];
            
            ltfMap.forEach((stats, ltf) => {
                tagWins += stats.wins;
                tagLosses += stats.losses;
                tagPnl += stats.pnl;
                tagRMultiples.push(...stats.rMultiples);
                
                const total = stats.wins + stats.losses;
                const avgRR = stats.rMultiples.length > 0 
                    ? stats.rMultiples.reduce((a, b) => a + b, 0) / stats.rMultiples.length 
                    : null;
                
                ltfBreakdown.push({
                    ltf,
                    wins: stats.wins,
                    losses: stats.losses,
                    pnl: stats.pnl,
                    winRate: total > 0 ? (stats.wins / total) * 100 : 0,
                    avgRR,
                    totalTrades: total
                });
            });
            
            ltfBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
            
            htfWins += tagWins;
            htfLosses += tagLosses;
            htfPnl += tagPnl;
            htfRMultiples.push(...tagRMultiples);
            
            const tagTotal = tagWins + tagLosses;
            const tagAvgRR = tagRMultiples.length > 0 
                ? tagRMultiples.reduce((a, b) => a + b, 0) / tagRMultiples.length 
                : null;
            
            tagBreakdown.push({
                tagCombo,
                wins: tagWins,
                losses: tagLosses,
                pnl: tagPnl,
                winRate: tagTotal > 0 ? (tagWins / tagTotal) * 100 : 0,
                avgRR: tagAvgRR,
                totalTrades: tagTotal,
                ltfBreakdown
            });
        });
        
        tagBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
        
        const htfTotal = htfWins + htfLosses;
        const htfAvgRR = htfRMultiples.length > 0 
            ? htfRMultiples.reduce((a, b) => a + b, 0) / htfRMultiples.length 
            : null;
        
        result.push({
            htf,
            wins: htfWins,
            losses: htfLosses,
            pnl: htfPnl,
            winRate: htfTotal > 0 ? (htfWins / htfTotal) * 100 : 0,
            avgRR: htfAvgRR,
            totalTrades: htfTotal,
            tagBreakdown
        });
    });
    
    result.sort((a, b) => getTimeframePriority(b.htf) - getTimeframePriority(a.htf));
    return result;
}

export function PlaybookReviewTab({ trades, currency }: PlaybookReviewTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('htf');
    const [selectedHtf, setSelectedHtf] = useState<HtfNestedMetric | null>(null);
    const [modalExpandedTags, setModalExpandedTags] = useState<Set<string>>(new Set());

    const nestedMetrics = useMemo(() => buildNestedMetrics(trades), [trades]);

    const toggleModalTag = (tag: string) => {
        setModalExpandedTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const openHtfModal = (htf: HtfNestedMetric) => {
        setSelectedHtf(htf);
        setModalExpandedTags(new Set()); // Reset expanded tags when opening modal
    };

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
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-xl">
                {VIEW_FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setViewMode(filter.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            viewMode === filter.id
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        }`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== HTF CARDS VIEW ===== */}
            {viewMode === 'htf' && (
                <div className="space-y-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeframe de Análise (HTF)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nestedMetrics.map((htf) => (
                            <div
                                key={htf.htf}
                                onClick={() => openHtfModal(htf)}
                                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-indigo-500/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-bold border border-indigo-500/30">
                                        📊 {htf.htf}
                                    </span>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-400">
                                            {htf.totalTrades} trade{htf.totalTrades !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            <span className="text-emerald-400">{htf.wins}W</span>
                                            <span className="text-gray-500">/</span>
                                            <span className="text-red-400">{htf.losses}L</span>
                                        </div>
                                    </div>
                                    <CircularProgress
                                        percentage={htf.winRate}
                                        size={50}
                                        strokeWidth={6}
                                        color={getWinRateColor(htf.winRate)}
                                        backgroundColor="#374151"
                                    />
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                                    <span className={`text-sm font-bold ${htf.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(htf.pnl, currency)}
                                    </span>
                                    <span className="text-xs text-gray-500 group-hover:text-indigo-400 transition-colors">
                                        Ver detalhes →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                            HTF → Tags
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

            {/* ===== HTF DETAIL MODAL with Tag Combos ===== */}
            {selectedHtf && (
                <div 
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedHtf(null)}
                >
                    <div 
                        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header - HTF Level */}
                        <div className="p-5 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-lg font-bold border border-indigo-500/30">
                                        📊 {selectedHtf.htf}
                                    </span>
                                    {/* 5 Standardized Metrics */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-400">{selectedHtf.totalTrades}T</span>
                                        <span className="text-gray-600">|</span>
                                        <span>
                                            <span className="text-emerald-400 font-medium">{selectedHtf.wins}W</span>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-red-400 font-medium">{selectedHtf.losses}L</span>
                                        </span>
                                        <span className="text-gray-600">|</span>
                                        <span className="font-bold" style={{ color: getWinRateColor(selectedHtf.winRate) }}>
                                            {selectedHtf.winRate.toFixed(0)}%
                                        </span>
                                        <span className="text-gray-600">|</span>
                                        <span className={`font-bold ${selectedHtf.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatCurrency(selectedHtf.pnl, currency)}
                                        </span>
                                        <span className="text-gray-600">|</span>
                                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                                            selectedHtf.avgRR === null ? 'bg-gray-700 text-gray-400' :
                                            selectedHtf.avgRR >= 1 ? 'bg-emerald-500/20 text-emerald-400' :
                                            selectedHtf.avgRR >= 0 ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                            {selectedHtf.avgRR !== null ? `${selectedHtf.avgRR >= 0 ? '+' : ''}${selectedHtf.avgRR.toFixed(2)}R` : '—R'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedHtf(null)}
                                    className="text-gray-400 hover:text-white text-2xl p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Tag Combos List */}
                        <div className="p-4 space-y-3 overflow-y-auto max-h-[65vh]">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                Combinações de Tags
                            </div>
                            {selectedHtf.tagBreakdown.map((tagData) => (
                                <div 
                                    key={tagData.tagCombo}
                                    className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                                >
                                    {/* Tag Combo Header */}
                                    <button
                                        onClick={() => toggleModalTag(tagData.tagCombo)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-700/30 transition-colors text-left"
                                    >
                                        <span className={`text-gray-400 text-sm transition-transform ${modalExpandedTags.has(tagData.tagCombo) ? 'rotate-90' : ''}`}>
                                            ▶
                                        </span>
                                        <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-bold border border-purple-500/30 flex-1">
                                            🏷️ {tagData.tagCombo}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap text-xs">
                                            <span className="text-gray-500">
                                                {tagData.totalTrades}T
                                            </span>
                                            <span>
                                                <span className="text-emerald-400 font-medium">{tagData.wins}W</span>
                                                <span className="text-gray-600">/</span>
                                                <span className="text-red-400 font-medium">{tagData.losses}L</span>
                                            </span>
                                            <span className="font-bold" style={{ color: getWinRateColor(tagData.winRate) }}>
                                                {tagData.winRate.toFixed(0)}%
                                            </span>
                                            <span className={`font-bold ${tagData.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {formatCurrency(tagData.pnl, currency)}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded ${
                                                tagData.avgRR === null ? 'bg-gray-700 text-gray-400' :
                                                tagData.avgRR >= 1 ? 'bg-emerald-500/20 text-emerald-300' :
                                                tagData.avgRR >= 0 ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}>
                                                {tagData.avgRR !== null ? `${tagData.avgRR >= 0 ? '+' : ''}${tagData.avgRR.toFixed(2)}R` : '—R'}
                                            </span>
                                        </div>
                                    </button>
                                    
                                    {/* LTFs breakdown inside tag combo */}
                                    {modalExpandedTags.has(tagData.tagCombo) && (
                                        <div className="border-t border-gray-700/30 p-3 pl-10 space-y-2 bg-gray-900/30">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider">
                                                TF de Entrada
                                            </div>
                                            {tagData.ltfBreakdown.map((ltf) => (
                                                <div 
                                                    key={ltf.ltf}
                                                    className="flex items-center p-3 bg-gray-800/50 rounded-lg text-xs"
                                                >
                                                    <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-bold border border-cyan-500/30">
                                                        🎯 {ltf.ltf}
                                                    </span>
                                                    {/* 5 Standardized Metrics - centered in remaining space */}
                                                    <div className="flex-1 flex items-center justify-center gap-2">
                                                        <span className="text-gray-500">{ltf.totalTrades}T</span>
                                                        <span className="text-gray-700">|</span>
                                                        <span>
                                                            <span className="text-emerald-400">{ltf.wins}W</span>
                                                            <span className="text-gray-600">/</span>
                                                            <span className="text-red-400">{ltf.losses}L</span>
                                                        </span>
                                                        <span className="text-gray-700">|</span>
                                                        <span className="font-bold" style={{ color: getWinRateColor(ltf.winRate) }}>
                                                            {ltf.winRate.toFixed(0)}%
                                                        </span>
                                                        <span className="text-gray-700">|</span>
                                                        <span className={`font-bold ${ltf.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {formatCurrency(ltf.pnl, currency)}
                                                        </span>
                                                        <span className="text-gray-700">|</span>
                                                        <span className={`font-medium px-1 py-0.5 rounded ${
                                                            ltf.avgRR === null ? 'bg-gray-700 text-gray-400' :
                                                            ltf.avgRR >= 1 ? 'bg-emerald-500/20 text-emerald-400' :
                                                            ltf.avgRR >= 0 ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {ltf.avgRR !== null ? `${ltf.avgRR >= 0 ? '+' : ''}${ltf.avgRR.toFixed(2)}R` : '—R'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
