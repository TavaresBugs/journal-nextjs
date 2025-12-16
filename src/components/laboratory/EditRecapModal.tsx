'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import type { LaboratoryRecap, EmotionalState } from '@/types';
import { UpdateRecapData } from '@/store/useLaboratoryStore';

interface EditRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    recap: LaboratoryRecap | null;
    onUpdateRecap: (data: UpdateRecapData) => Promise<void>;
    isLoading?: boolean;
}

const EMOTION_OPTIONS: { value: EmotionalState; label: string; emoji: string }[] = [
    { value: 'confiante', label: 'Confiante', emoji: '💪' },
    { value: 'disciplinado', label: 'Disciplinado', emoji: '🎯' },
    { value: 'neutro', label: 'Neutro', emoji: '😐' },
    { value: 'ansioso', label: 'Ansioso', emoji: '😰' },
    { value: 'fomo', label: 'FOMO', emoji: '🔥' },
    { value: 'euforico', label: 'Eufórico', emoji: '🚀' },
    { value: 'frustrado', label: 'Frustrado', emoji: '😤' },
];

export function EditRecapModal({
    isOpen,
    onClose,
    onBack,
    recap,
    onUpdateRecap,
    isLoading = false,
}: EditRecapModalProps) {
    // Form state
    const [title, setTitle] = useState('');
    const [whatWorked, setWhatWorked] = useState('');
    const [whatFailed, setWhatFailed] = useState('');
    const [emotionalState, setEmotionalState] = useState<EmotionalState | ''>('');
    const [lessonsLearned, setLessonsLearned] = useState('');
    const [previews, setPreviews] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill form when recap changes
    useEffect(() => {
        if (recap) {
            setTitle(recap.title);
            setWhatWorked(recap.whatWorked || '');
            setWhatFailed(recap.whatFailed || '');
            setEmotionalState(recap.emotionalState || '');
            setLessonsLearned(recap.lessonsLearned || '');
            // Show existing images as previews
            if (recap.images?.length) {
                setPreviews(recap.images);
            }
        }
    }, [recap]);

    if (!recap) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setNewFiles(prev => [...prev, ...files]);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        const existingCount = recap.images?.length || 0;
        if (index >= existingCount) {
            // It's a new image
            const newIndex = index - existingCount;
            setNewFiles(prev => prev.filter((_, i) => i !== newIndex));
        }
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const data: UpdateRecapData = {
            id: recap.id,
            title: title.trim(),
            whatWorked: whatWorked.trim() || undefined,
            whatFailed: whatFailed.trim() || undefined,
            emotionalState: emotionalState || undefined,
            lessonsLearned: lessonsLearned.trim() || undefined,
            // Keep existing images for now (image update would require more complex logic)
            images: recap.images,
        };

        await onUpdateRecap(data);
        onClose();
    };

    const handleReset = () => {
        if (recap) {
            setTitle(recap.title);
            setWhatWorked(recap.whatWorked || '');
            setWhatFailed(recap.whatFailed || '');
            setEmotionalState(recap.emotionalState || '');
            setLessonsLearned(recap.lessonsLearned || '');
            setPreviews(recap.images || []);
        }
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors text-xl"
                    >
                        ‹
                    </button>
                    <span className="text-lg font-semibold">📝 Editando Review Diário</span>
                </div>
            }
            maxWidth="4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Título do Recap
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Análise do trade EURUSD 11/12"
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                </div>

                {/* Linked Record Display (read-only) */}
                {recap.trade && (
                    <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700">
                        <span className="text-sm text-gray-400">Vinculado a: </span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-sm font-medium ${
                            recap.trade.type === 'Long' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                        }`}>
                            {recap.trade.type}
                        </span>
                        <span className="ml-2 text-white font-medium">{recap.trade.symbol}</span>
                        <span className="ml-2 text-gray-400 text-sm">{recap.trade.entryDate}</span>
                    </div>
                )}

                {/* What Worked / What Failed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-green-400 mb-2">
                            ✓ O que funcionou
                        </label>
                        <textarea
                            value={whatWorked}
                            onChange={(e) => setWhatWorked(e.target.value)}
                            placeholder="Pontos positivos do trade..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-red-400 mb-2">
                            ✗ O que falhou
                        </label>
                        <textarea
                            value={whatFailed}
                            onChange={(e) => setWhatFailed(e.target.value)}
                            placeholder="O que poderia melhorar..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Emotional State */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estado Emocional
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {EMOTION_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setEmotionalState(
                                    emotionalState === option.value ? '' : option.value
                                )}
                                className={`px-4 py-2 rounded-xl border transition-all ${
                                    emotionalState === option.value
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                            >
                                <span className="mr-1">{option.emoji}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lessons Learned */}
                <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">
                        💡 Lições Aprendidas
                    </label>
                    <textarea
                        value={lessonsLearned}
                        onChange={(e) => setLessonsLearned(e.target.value)}
                        placeholder="O que você aprendeu com esse trade..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                    />
                </div>

                {/* Screenshots with Add Button */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Screenshots
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative rounded-lg overflow-hidden border border-gray-700 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview}
                                    alt={`Screenshot ${index + 1}`}
                                    className="w-full h-20 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {/* Add Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-20 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-lg flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                            <span className="text-2xl">+</span>
                        </button>
                    </div>
                </div>

                {/* Actions - Full width buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <Button 
                        type="button"
                        variant="gradient-danger" 
                        onClick={handleClose} 
                        disabled={isLoading}
                        className="w-full py-3"
                    >
                        <span className="font-bold">Cancelar</span>
                    </Button>
                    <Button 
                        type="submit" 
                        variant="gradient-success" 
                        disabled={!title.trim() || isLoading}
                        className="w-full py-3"
                    >
                        <span className="font-bold">{isLoading ? 'Salvando...' : 'Salvar'}</span>
                    </Button>
                </div>
            </form>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
        </Modal>
    );
}
