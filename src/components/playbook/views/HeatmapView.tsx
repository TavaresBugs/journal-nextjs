'use client';

import { getTimeframePriority } from '@/lib/utils/playbook';
import type { HtfNestedMetric } from '@/types/playbookTypes';

interface HeatmapViewProps {
    nestedMetrics: HtfNestedMetric[];
    currency: string;
}

const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 50) return '#3b82f6';
    if (winRate > 0) return '#f59e0b';
    return '#ef4444';
};

export function HeatmapView({ nestedMetrics }: HeatmapViewProps) {
    const allLtfs = new Set<string>();
    const rows: { 
        label: string; 
        htf: string; 
        tagCombo: string; 
        cells: Map<string, { winRate: number; avgRR: number | null; totalTrades: number; pnl: number }> 
    }[] = [];
    
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
    
    rows.sort((a, b) => getTimeframePriority(b.htf) - getTimeframePriority(a.htf));
    const sortedLtfs = Array.from(allLtfs).sort((a, b) => getTimeframePriority(a) - getTimeframePriority(b));
    
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
}
