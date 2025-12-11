'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { ExperimentCard } from './ExperimentCard';
import type { LaboratoryExperiment, ExperimentStatus } from '@/types';

interface ExperimentsTabProps {
    experiments: LaboratoryExperiment[];
    onCreateNew: () => void;
    onView: (experiment: LaboratoryExperiment) => void;
    onEdit: (experiment: LaboratoryExperiment) => void;
    onDelete: (id: string) => void;
    onPromote: (id: string) => void;
    isLoading?: boolean;
}

const STATUS_FILTERS: { value: ExperimentStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'em_aberto', label: 'Em Aberto' },
    { value: 'testando', label: 'Testando' },
    { value: 'validado', label: 'Validado' },
    { value: 'descartado', label: 'Descartado' },
];

export function ExperimentsTab({
    experiments,
    onCreateNew,
    onView,
    onEdit,
    onDelete,
    onPromote,
    isLoading = false,
}: ExperimentsTabProps) {
    const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique categories
    const categories = Array.from(
        new Set(experiments.map(e => e.category).filter(Boolean))
    ) as string[];

    // Filter experiments
    const filteredExperiments = experiments.filter(exp => {
        if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
        if (categoryFilter && exp.category !== categoryFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                exp.title.toLowerCase().includes(query) ||
                exp.description?.toLowerCase().includes(query) ||
                exp.category?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Experimentos</h2>
                    <p className="text-sm text-gray-400">
                        Teste novas ideias e estratégias antes de aplicá-las
                    </p>
                </div>
                <Button
                    variant="gradient-success"
                    onClick={onCreateNew}
                    leftIcon={<span>+</span>}
                >
                    Novo Experimento
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar experimentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {STATUS_FILTERS.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                statusFilter === filter.value
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    >
                        <option value="">Todas Categorias</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredExperiments.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">🧪</div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        {experiments.length === 0 
                            ? 'Nenhum experimento ainda' 
                            : 'Nenhum experimento encontrado'
                        }
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {experiments.length === 0 
                            ? 'Comece criando seu primeiro experimento para testar novas estratégias'
                            : 'Tente ajustar os filtros de busca'
                        }
                    </p>
                    {experiments.length === 0 && (
                        <Button variant="gradient-success" onClick={onCreateNew}>
                            Criar Primeiro Experimento
                        </Button>
                    )}
                </div>
            )}

            {/* Experiments Grid */}
            {!isLoading && filteredExperiments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExperiments.map(experiment => (
                        <ExperimentCard
                            key={experiment.id}
                            experiment={experiment}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onPromote={onPromote}
                        />
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            {experiments.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 text-sm text-gray-400">
                    <span>
                        {filteredExperiments.length} de {experiments.length} experimentos
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {experiments.filter(e => e.status === 'validado').length} validados
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            {experiments.filter(e => e.status === 'testando').length} em teste
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
