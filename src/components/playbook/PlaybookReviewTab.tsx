'use client';

import { useState } from 'react';
import { SegmentedToggle } from '@/components/ui';
import { usePlaybookMetrics } from '@/hooks/usePlaybookMetrics';
import { HtfView, HeatmapView, ReportView, type DrillPath } from './views';
import type { PlaybookReviewTabProps, ViewMode } from '@/types/playbookTypes';

const VIEW_FILTERS = [
    { value: 'htf', label: '🔍 HTF → LTF' },
    { value: 'heatmap', label: '🔥 Heatmap' },
    { value: 'report', label: '🧠 Relatório' },
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
            {/* View Mode Tabs - Using Standard Component */}
            <SegmentedToggle
                value={viewMode}
                onChange={(val) => setViewMode(val as ViewMode)}
                options={VIEW_FILTERS}
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
