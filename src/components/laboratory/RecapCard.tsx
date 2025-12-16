'use client';

import React from 'react';
import { GlassCard } from '@/components/ui';
import type { LaboratoryRecap, EmotionalState, RecapLinkedType } from '@/types';

interface RecapCardProps {
    recap: LaboratoryRecap;
    onView: (recap: LaboratoryRecap) => void;
    onEdit: (recap: LaboratoryRecap) => void;
    onDelete: (id: string) => void;
}

const EMOTION_CONFIG: Record<EmotionalState, { label: string; emoji: string; color: string; bgColor: string }> = {
    'confiante': { label: 'Confiante', emoji: '💪', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    'ansioso': { label: 'Ansioso', emoji: '😰', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    'fomo': { label: 'FOMO', emoji: '🔥', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    'disciplinado': { label: 'Disciplinado', emoji: '🎯', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    'frustrado': { label: 'Frustrado', emoji: '😤', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    'euforico': { label: 'Eufórico', emoji: '🚀', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    'neutro': { label: 'Neutro', emoji: '😐', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

/** Badge config for different link types */
const LINK_BADGE: Record<RecapLinkedType | 'none', { icon: string; label: string; bgColor: string; textColor: string }> = {
    trade: { icon: '📊', label: 'Trade', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
    journal: { icon: '📓', label: 'Diário', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
    none: { icon: '💭', label: 'Reflexão', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' },
};

export function RecapCard({ recap, onView, onEdit, onDelete }: RecapCardProps) {
    const emotionConfig = recap.emotionalState ? EMOTION_CONFIG[recap.emotionalState] : null;
    const firstImage = recap.images?.[0];
    
    // Determine link type: use linkedType if available, fallback to tradeId check for legacy
    const linkType: RecapLinkedType | 'none' = recap.linkedType || (recap.tradeId ? 'trade' : 'none');
    const linkBadge = LINK_BADGE[linkType];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getOutcomeColor = (outcome?: string) => {
        switch (outcome) {
            case 'win': return 'text-green-400';
            case 'loss': return 'text-red-400';
            case 'breakeven': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <GlassCard 
            className="group cursor-pointer hover:border-cyan-500/50 transition-all duration-300"
            onClick={() => onView(recap)}
        >
            {/* Thumbnail */}
            {firstImage && (
                <div className="relative h-24 -mx-4 -mt-4 mb-4 rounded-t-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={firstImage} 
                        alt={recap.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
                    
                    {/* Link Type Badge (overlay on image) */}
                    <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${linkBadge.bgColor} ${linkBadge.textColor} flex items-center gap-1`}>
                        <span>{linkBadge.icon}</span>
                        <span>{linkBadge.label}</span>
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                    {/* Link badge when no image */}
                    {!firstImage && (
                        <span className={`inline-flex px-2 py-0.5 mb-2 text-xs font-medium rounded-full ${linkBadge.bgColor} ${linkBadge.textColor} items-center gap-1`}>
                            <span>{linkBadge.icon}</span>
                            <span>{linkBadge.label}</span>
                        </span>
                    )}
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {recap.title}
                    </h3>
                </div>
                {emotionConfig && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${emotionConfig.bgColor} ${emotionConfig.color} whitespace-nowrap flex items-center gap-1`}>
                        <span>{emotionConfig.emoji}</span>
                        <span>{emotionConfig.label}</span>
                    </span>
                )}
            </div>

            {/* Linked Trade */}
            {recap.trade && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-800/20 rounded-lg border border-green-500/20">
                    <span className="text-xs text-gray-500">Trade:</span>
                    <span className="text-sm font-medium text-white">{recap.trade.symbol}</span>
                    <span className={`text-sm ${recap.trade.type === 'Long' ? 'text-green-400' : 'text-red-400'}`}>
                        {recap.trade.type}
                    </span>
                    {recap.trade.outcome && (
                        <span className={`ml-auto text-sm font-medium ${getOutcomeColor(recap.trade.outcome)}`}>
                            {recap.trade.outcome === 'win' ? '✓ Win' : recap.trade.outcome === 'loss' ? '✗ Loss' : '⬤ BE'}
                        </span>
                    )}
                </div>
            )}

            {/* Linked Journal */}
            {recap.journal && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-blue-800/20 rounded-lg border border-blue-500/20">
                    <span className="text-xs text-gray-500">Diário:</span>
                    <span className="text-sm font-medium text-white">{formatDate(recap.journal.date)}</span>
                    {recap.journal.title && (
                        <span className="text-sm text-gray-400 truncate flex-1">
                            - {recap.journal.title}
                        </span>
                    )}
                </div>
            )}

            {/* Lessons Learned Preview */}
            {recap.lessonsLearned && (
                <div className="mb-3">
                    <p className="text-xs text-cyan-400 mb-1">Lições Aprendidas:</p>
                    <p className="text-gray-400 text-sm line-clamp-2">
                        {recap.lessonsLearned}
                    </p>
                </div>
            )}

            {/* Image count */}
            {recap.images.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{recap.images.length} imagem(ns)</span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                <span className="text-xs text-gray-500">
                    {formatDate(recap.createdAt)}
                </span>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onEdit(recap)}
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => onDelete(recap.id)}
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
