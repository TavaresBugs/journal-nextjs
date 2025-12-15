'use client';

import React from 'react';
import { Modal, Button } from '@/components/ui';
import type { LaboratoryExperiment, ExperimentStatus } from '@/types';

interface ViewExperimentModalProps {
    isOpen: boolean;
    onClose: () => void;
    experiment: LaboratoryExperiment | null;
    onEdit: (experiment: LaboratoryExperiment) => void;
    onPromote: (id: string) => void;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bgColor: string }> = {
    'em_aberto': { label: 'Em Aberto', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    'testando': { label: 'Testando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    'validado': { label: 'Validado', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    'descartado': { label: 'Descartado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export function ViewExperimentModal({ 
    isOpen, 
    onClose, 
    experiment,
    onEdit,
    onPromote
}: ViewExperimentModalProps) {
    if (!experiment) return null;

    const statusConfig = STATUS_CONFIG[experiment.status];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🧪 Detalhes do Experimento" maxWidth="3xl">
            <div className="space-y-6">
                {/* Header with status */}
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white">{experiment.title}</h2>
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </div>

                {/* Description */}
                {experiment.description && (
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                        <h3 className="text-sm font-medium text-cyan-400 mb-2">Hipótese / Descrição</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{experiment.description}</p>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {experiment.expectedWinRate && (
                        <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-cyan-400">{experiment.expectedWinRate}%</div>
                            <div className="text-xs text-gray-400 mt-1">Win Rate Esperado</div>
                        </div>
                    )}
                    {experiment.expectedRiskReward && (
                        <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-cyan-400">1:{experiment.expectedRiskReward}</div>
                            <div className="text-xs text-gray-400 mt-1">R:R Esperado</div>
                        </div>
                    )}
                    {experiment.category && (
                        <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                            <div className="text-lg font-medium text-cyan-400">{experiment.category}</div>
                            <div className="text-xs text-gray-400 mt-1">Categoria</div>
                        </div>
                    )}
                    <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                        <div className="text-lg font-medium text-gray-300">{experiment.images.length}</div>
                        <div className="text-xs text-gray-400 mt-1">Imagens</div>
                    </div>
                </div>

                {/* Images Gallery */}
                {experiment.images.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Screenshots</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {experiment.images.map((img, index) => (
                                <a
                                    key={img.id}
                                    href={img.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-500 transition-colors"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={img.imageUrl}
                                        alt={img.description || `Screenshot ${index + 1}`}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                    <span>Criado em: {formatDate(experiment.createdAt)}</span>
                    <span>Atualizado em: {formatDate(experiment.updatedAt)}</span>
                </div>

                {/* Promoted Status */}
                {experiment.promotedToPlaybook && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">📕</span>
                        <div>
                            <div className="text-green-400 font-medium">Promovido para Playbook</div>
                            <div className="text-sm text-gray-400">Esta estratégia já faz parte do seu Playbook</div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    {experiment.status === 'validado' && !experiment.promotedToPlaybook && (
                        <Button 
                            variant="gradient-success"
                            onClick={() => {
                                onPromote(experiment.id);
                                onClose();
                            }}
                            leftIcon={<span>📕</span>}
                        >
                            Promover para Playbook
                        </Button>
                    )}
                    <Button 
                        variant="secondary"
                        onClick={() => {
                            onEdit(experiment);
                            onClose();
                        }}
                    >
                        Editar
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
