'use client';

import React from 'react';
import { GlassCard } from '@/components/ui';
import type { LaboratoryExperiment, ExperimentStatus } from '@/types';

interface ExperimentCardProps {
    experiment: LaboratoryExperiment;
    onView: (experiment: LaboratoryExperiment) => void;
    onEdit: (experiment: LaboratoryExperiment) => void;
    onDelete: (id: string) => void;
    onPromote: (id: string) => void;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bgColor: string }> = {
    'em_aberto': { label: 'Em Aberto', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    'testando': { label: 'Testando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    'validado': { label: 'Validado', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    'descartado': { label: 'Descartado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export function ExperimentCard({ 
    experiment, 
    onView, 
    onEdit, 
    onDelete, 
    onPromote 
}: ExperimentCardProps) {
    const statusConfig = STATUS_CONFIG[experiment.status];
    const firstImage = experiment.images?.[0]?.imageUrl;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <GlassCard 
            className="group cursor-pointer hover:border-cyan-500/50 transition-all duration-300"
            onClick={() => onView(experiment)}
        >
            {/* Thumbnail */}
            {firstImage && (
                <div className="relative h-32 -mx-4 -mt-4 mb-4 rounded-t-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={firstImage} 
                        alt={experiment.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-semibold text-white line-clamp-2 flex-1">
                    {experiment.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color} whitespace-nowrap`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Description */}
            {experiment.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                    {experiment.description}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm mb-4">
                {experiment.expectedWinRate && (
                    <div className="flex items-center gap-1 text-cyan-400">
                        <span className="text-xs">WR:</span>
                        <span className="font-medium">{experiment.expectedWinRate}%</span>
                    </div>
                )}
                {experiment.expectedRiskReward && (
                    <div className="flex items-center gap-1 text-cyan-400">
                        <span className="text-xs">R:R:</span>
                        <span className="font-medium">1:{experiment.expectedRiskReward}</span>
                    </div>
                )}
                {experiment.category && (
                    <div className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">
                        {experiment.category}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                <span className="text-xs text-gray-500">
                    {formatDate(experiment.createdAt)}
                </span>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onEdit(experiment)}
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    
                    {experiment.status === 'validado' && !experiment.promotedToPlaybook && (
                        <button
                            onClick={() => onPromote(experiment.id)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Promover para Playbook"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    )}

                    {experiment.promotedToPlaybook && (
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                            📕 No Playbook
                        </span>
                    )}

                    <button
                        onClick={() => onDelete(experiment.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </GlassCard>
    );
}
