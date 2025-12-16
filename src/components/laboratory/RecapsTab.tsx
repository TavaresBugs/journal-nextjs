'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { RecapCard } from './RecapCard';
import type { LaboratoryRecap, EmotionalState, RecapLinkedType } from '@/types';

interface RecapsTabProps {
    recaps: LaboratoryRecap[];
    onCreateNew: () => void;
    onView: (recap: LaboratoryRecap) => void;
    onEdit: (recap: LaboratoryRecap) => void;
    onDelete: (id: string) => void;
    isLoading?: boolean;
}

type LinkFilter = 'all' | 'trades' | 'journals' | 'none';

const LINK_FILTERS: { value: LinkFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'Todos', icon: '📋' },
    { value: 'trades', label: 'Trades', icon: '📊' },
    { value: 'journals', label: 'Diários', icon: '📓' },
    { value: 'none', label: 'Reflexões', icon: '💭' },
];

const EMOTION_FILTERS: { value: EmotionalState | 'all'; label: string; emoji?: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'confiante', label: 'Confiante', emoji: '💪' },
    { value: 'disciplinado', label: 'Disciplinado', emoji: '🎯' },
    { value: 'ansioso', label: 'Ansioso', emoji: '😰' },
    { value: 'fomo', label: 'FOMO', emoji: '🔥' },
    { value: 'frustrado', label: 'Frustrado', emoji: '😤' },
];

/** Get the effective link type from a recap (handles legacy tradeId) */
function getRecapLinkType(recap: LaboratoryRecap): RecapLinkedType | 'none' {
    return recap.linkedType || (recap.tradeId ? 'trade' : 'none');
}

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
    const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');

    // Filter recaps
    const filteredRecaps = recaps.filter(recap => {
        // Emotion filter
        if (emotionFilter !== 'all' && recap.emotionalState !== emotionFilter) return false;
        
        // Link type filter
        if (linkFilter !== 'all') {
            const recapLinkType = getRecapLinkType(recap);
            if (linkFilter === 'trades' && recapLinkType !== 'trade') return false;
            if (linkFilter === 'journals' && recapLinkType !== 'journal') return false;
            if (linkFilter === 'none' && recapLinkType !== 'none') return false;
        }
        
        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                recap.title.toLowerCase().includes(query) ||
                recap.lessonsLearned?.toLowerCase().includes(query) ||
                recap.whatWorked?.toLowerCase().includes(query) ||
                recap.whatFailed?.toLowerCase().includes(query) ||
                recap.trade?.symbol.toLowerCase().includes(query) ||
                recap.journal?.title?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // Calculate stats
    const tradeCount = recaps.filter(r => getRecapLinkType(r) === 'trade').length;
    const journalCount = recaps.filter(r => getRecapLinkType(r) === 'journal').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Recaps</h2>
                    <p className="text-sm text-gray-400">
                        Analise e documente seus trades e observações do mercado
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

                {/* Link Type Filters */}
                <div className="flex gap-2">
                    {LINK_FILTERS.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setLinkFilter(filter.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                                linkFilter === filter.value
                                    ? filter.value === 'trades' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                    : filter.value === 'journals' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : filter.value === 'none' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                            }`}
                        >
                            <span>{filter.icon}</span>
                            <span>{filter.label}</span>
                        </button>
                    ))}
                </div>
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
                        <span className="flex items-center gap-1 text-green-400">
                            <span>📊</span>
                            {tradeCount} trades
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                            <span>📓</span>
                            {journalCount} diários
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
