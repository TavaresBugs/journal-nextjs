'use client';

import React from 'react';
import { Modal, Button } from '@/components/ui';
import type { LaboratoryRecap, EmotionalState } from '@/types';

interface ViewRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    recap: LaboratoryRecap | null;
    onEdit: (recap: LaboratoryRecap) => void;
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

export function ViewRecapModal({ 
    isOpen, 
    onClose, 
    recap,
    onEdit
}: ViewRecapModalProps) {
    if (!recap) return null;

    const emotionConfig = recap.emotionalState ? EMOTION_CONFIG[recap.emotionalState] : null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getOutcomeLabel = (outcome?: string) => {
        switch (outcome) {
            case 'win': return { label: 'Win', color: 'text-green-400', bgColor: 'bg-green-500/20' };
            case 'loss': return { label: 'Loss', color: 'text-red-400', bgColor: 'bg-red-500/20' };
            case 'breakeven': return { label: 'Breakeven', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
            default: return { label: 'Pending', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📝 Detalhes do Recap" maxWidth="3xl">
            <div className="space-y-6">
                {/* Header with emotion */}
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white">{recap.title}</h2>
                    {emotionConfig && (
                        <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${emotionConfig.bgColor} ${emotionConfig.color} flex items-center gap-1`}>
                            <span>{emotionConfig.emoji}</span>
                            <span>{emotionConfig.label}</span>
                        </span>
                    )}
                </div>

                {/* Linked Trade */}
                {recap.trade && (
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                        <h3 className="text-sm font-medium text-cyan-400 mb-3">Trade Vinculado</h3>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                recap.trade.type === 'Long' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                {recap.trade.type}
                            </span>
                            <span className="text-xl text-white font-bold">{recap.trade.symbol}</span>
                            <span className="text-gray-400">{recap.trade.entryDate}</span>
                            {recap.trade.outcome && (
                                <span className={`ml-auto px-3 py-1 rounded-lg text-sm font-medium ${getOutcomeLabel(recap.trade.outcome).bgColor} ${getOutcomeLabel(recap.trade.outcome).color}`}>
                                    {getOutcomeLabel(recap.trade.outcome).label}
                                </span>
                            )}
                            {recap.trade.pnl !== undefined && (
                                <span className={`text-lg font-bold ${recap.trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {recap.trade.pnl >= 0 ? '+' : ''}{recap.trade.pnl.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* What Worked / What Failed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recap.whatWorked && (
                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <h3 className="text-sm font-medium text-green-400 mb-2">✓ O que funcionou</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{recap.whatWorked}</p>
                        </div>
                    )}
                    {recap.whatFailed && (
                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <h3 className="text-sm font-medium text-red-400 mb-2">✗ O que falhou</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{recap.whatFailed}</p>
                        </div>
                    )}
                </div>

                {/* Lessons Learned */}
                {recap.lessonsLearned && (
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                        <h3 className="text-sm font-medium text-cyan-400 mb-2">💡 Lições Aprendidas</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{recap.lessonsLearned}</p>
                    </div>
                )}

                {/* Images Gallery */}
                {recap.images.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Screenshots</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {recap.images.map((imgUrl, index) => (
                                <a
                                    key={index}
                                    href={imgUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-500 transition-colors"
                                >
                                    <img
                                        src={imgUrl}
                                        alt={`Screenshot ${index + 1}`}
                                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
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

                {/* Timestamp */}
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                    Criado em: {formatDate(recap.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <Button 
                        variant="secondary"
                        onClick={() => {
                            onEdit(recap);
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
