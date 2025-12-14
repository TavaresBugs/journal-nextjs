'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { usePlaybookMetrics } from '@/hooks/usePlaybookMetrics';
import { HtfView, HeatmapView, ReportView, type DrillPath } from './views';
import type { PlaybookReviewTabProps, ViewMode } from '@/types/playbookTypes';

const VIEW_FILTERS = [
    { id: 'htf' as ViewMode, label: 'HTF → LTF', icon: '🔍' },
    { id: 'heatmap' as ViewMode, label: 'Heatmap', icon: '🔥' },
    { id: 'report' as ViewMode, label: 'Relatório', icon: '🧠' },
];

export function PlaybookReviewTab({ trades, currency }: PlaybookReviewTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('htf');
    const [drillPath, setDrillPath] = useState<DrillPath>({});

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
                                ? 'bg-linear-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        }`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                    </button>
                ))}
            </GlassCard>

            {/* View Content */}
            {viewMode === 'htf' && (
                <HtfView 
                    hierarchicalMetrics={hierarchicalMetrics} 
                    drillPath={drillPath} 
                    setDrillPath={setDrillPath} 
                    currency={currency} 
                />
            )}

            {viewMode === 'heatmap' && (
                <HeatmapView nestedMetrics={nestedMetrics} currency={currency} />
            )}

            {viewMode === 'report' && (
                <ReportView nestedMetrics={nestedMetrics} currency={currency} />
            )}
        </div>
    );
}
