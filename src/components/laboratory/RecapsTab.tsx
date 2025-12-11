'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { RecapCard } from './RecapCard';
import type { LaboratoryRecap, EmotionalState } from '@/types';

interface RecapsTabProps {
    recaps: LaboratoryRecap[];
    onCreateNew: () => void;
    onView: (recap: LaboratoryRecap) => void;
    onEdit: (recap: LaboratoryRecap) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

const EMOTION_FILTERS: { value: EmotionalState | 'all'; label: string; emoji?: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'confiante', label: 'Confiante', emoji: '💪' },
    { value: 'disciplinado', label: 'Disciplinado', emoji: '🎯' },
    { value: 'ansioso', label: 'Ansioso', emoji: '😰' },
    { value: 'fomo', label: 'FOMO', emoji: '🔥' },
    { value: 'frustrado', label: 'Frustrado', emoji: '😤' },
];

export function RecapsTab({
    recaps,
    onCreateNew,
    onView,
    onEdit,
    onDelete,
    isLoading = false,
}: RecapsTabProps) {
    const [emotionFilter, setEmotionFilter] = useState<EmotionalState | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showLinkedOnly, setShowLinkedOnly] = useState(false);

    // Filter recaps
    const filteredRecaps = recaps.filter(recap => {
        if (emotionFilter !== 'all' && recap.emotionalState !== emotionFilter) return false;
        if (showLinkedOnly && !recap.tradeId) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                recap.title.toLowerCase().includes(query) ||
                recap.lessonsLearned?.toLowerCase().includes(query) ||
                recap.whatWorked?.toLowerCase().includes(query) ||
                recap.whatFailed?.toLowerCase().includes(query) ||
                recap.trade?.symbol.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Recaps</h2>
                    <p className="text-sm text-gray-400">
                        Analise e documente seus trades para aprender com eles
                    </p>
                </div>
                <Button
                    variant="gradient-success"
                    onClick={onCreateNew}
                    leftIcon={<span>+</span>}
                >
                    Novo Recap
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar recaps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                </div>

                {/* Linked Only Toggle */}
                <button
                    onClick={() => setShowLinkedOnly(!showLinkedOnly)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                        showLinkedOnly
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                            : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Com Trade
                </button>
            </div>

            {/* Emotion Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {EMOTION_FILTERS.map(filter => (
                    <button
                        key={filter.value}
                        onClick={() => setEmotionFilter(filter.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                            emotionFilter === filter.value
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                        }`}
                    >
                        {filter.emoji && <span>{filter.emoji}</span>}
                        <span>{filter.label}</span>
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredRecaps.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        {recaps.length === 0 
                            ? 'Nenhum recap ainda' 
                            : 'Nenhum recap encontrado'
                        }
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {recaps.length === 0 
                            ? 'Começe documentando os aprendizados dos seus trades'
                            : 'Tente ajustar os filtros de busca'
                        }
                    </p>
                    {recaps.length === 0 && (
                        <Button variant="gradient-success" onClick={onCreateNew}>
                            Criar Primeiro Recap
                        </Button>
                    )}
                </div>
            )}

            {/* Recaps Grid */}
            {!isLoading && filteredRecaps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecaps.map(recap => (
                        <RecapCard
                            key={recap.id}
                            recap={recap}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            {recaps.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 text-sm text-gray-400">
                    <span>
                        {filteredRecaps.length} de {recaps.length} recaps
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {recaps.filter(r => r.tradeId).length} vinculados
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
