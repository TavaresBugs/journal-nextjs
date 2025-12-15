'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
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
            {/* View Mode Tabs - Using Standard Component */}
            <Tabs 
                tabs={VIEW_FILTERS} 
                activeTab={viewMode} 
                onChange={(id) => setViewMode(id as ViewMode)} 
            />

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
