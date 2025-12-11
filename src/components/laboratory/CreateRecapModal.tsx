'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import type { EmotionalState, TradeLite } from '@/types';
import { CreateRecapData } from '@/store/useLaboratoryStore';

interface CreateRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateRecapData, files: File[]) => Promise<void>;
    trades: TradeLite[];
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

export function CreateRecapModal({ 
    isOpen, 
    onClose, 
    onSubmit,
    trades,
    isLoading = false
}: CreateRecapModalProps) {
    const [title, setTitle] = useState('');
    const [tradeId, setTradeId] = useState('');
    const [whatWorked, setWhatWorked] = useState('');
    const [whatFailed, setWhatFailed] = useState('');
    const [emotionalState, setEmotionalState] = useState<EmotionalState | ''>('');
    const [lessonsLearned, setLessonsLearned] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [tradeSearch, setTradeSearch] = useState('');
    const [showTradeDropdown, setShowTradeDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter trades based on search
    const filteredTrades = trades.filter(trade => 
        trade.symbol.toLowerCase().includes(tradeSearch.toLowerCase()) ||
        trade.entryDate.includes(tradeSearch)
    ).slice(0, 10);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowTradeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setPreviews(prev => [...prev, event.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const selectTrade = (trade: TradeLite) => {
        setTradeId(trade.id);
        setTradeSearch(`${trade.symbol} - ${trade.entryDate} (${trade.type})`);
        setShowTradeDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const data: CreateRecapData = {
            title: title.trim(),
            tradeId: tradeId || undefined,
            whatWorked: whatWorked.trim() || undefined,
            whatFailed: whatFailed.trim() || undefined,
            emotionalState: emotionalState || undefined,
            lessonsLearned: lessonsLearned.trim() || undefined,
        };

        await onSubmit(data, selectedFiles);
        handleReset();
    };

    const handleReset = () => {
        setTitle('');
        setTradeId('');
        setTradeSearch('');
        setWhatWorked('');
        setWhatFailed('');
        setEmotionalState('');
        setLessonsLearned('');
        setSelectedFiles([]);
        setPreviews([]);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="📝 Novo Recap" maxWidth="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <Input
                    label="Título do Recap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Análise do trade EURUSD 11/12"
                    required
                />

                {/* Trade Link */}
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vincular a um Trade (opcional)
                    </label>
                    <input
                        type="text"
                        value={tradeSearch}
                        onChange={(e) => {
                            setTradeSearch(e.target.value);
                            setShowTradeDropdown(true);
                            if (e.target.value === '') setTradeId('');
                        }}
                        onFocus={() => setShowTradeDropdown(true)}
                        placeholder="Buscar por ativo ou data..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                    
                    {showTradeDropdown && filteredTrades.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl max-h-48 overflow-auto">
                            {filteredTrades.map(trade => (
                                <button
                                    key={trade.id}
                                    type="button"
                                    onClick={() => selectTrade(trade)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center gap-3 border-b border-gray-700/50 last:border-0"
                                >
                                    <span className={`font-medium ${trade.type === 'Long' ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.type}
                                    </span>
                                    <span className="text-white">{trade.symbol}</span>
                                    <span className="text-gray-400 text-sm">{trade.entryDate}</span>
                                    {trade.outcome && (
                                        <span className={`ml-auto text-sm ${
                                            trade.outcome === 'win' ? 'text-green-400' : 
                                            trade.outcome === 'loss' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                            {trade.outcome === 'win' ? '✓' : trade.outcome === 'loss' ? '✗' : '⬤'}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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
                            className="w-full px-4 py-3 bg-gray-800/50 border border-green-700/30 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                            rows={3}
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
                            className="w-full px-4 py-3 bg-gray-800/50 border border-red-700/30 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Emotional State */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estado Emocional
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {EMOTION_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setEmotionalState(emotionalState === option.value ? '' : option.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    emotionalState === option.value
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <span>{option.emoji}</span>
                                <span>{option.label}</span>
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
                        placeholder="O que você aprendeu com este trade..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-700/30 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                        rows={4}
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Screenshots
                    </label>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors flex flex-col items-center gap-2"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Clique para adicionar imagens</span>
                    </button>

                    {previews.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-20 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="gradient-success" 
                        disabled={!title.trim() || isLoading}
                    >
                        {isLoading ? 'Salvando...' : 'Criar Recap'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
