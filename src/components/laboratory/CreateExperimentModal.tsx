'use client';

import React, { useState, useRef } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import type { ExperimentStatus } from '@/types';
import { CreateExperimentData } from '@/store/useLaboratoryStore';

interface CreateExperimentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateExperimentData, files: File[]) => Promise<void>;
    isLoading?: boolean;
}

const STATUS_OPTIONS: { value: ExperimentStatus; label: string }[] = [
    { value: 'em_aberto', label: 'Em Aberto' },
    { value: 'testando', label: 'Testando' },
    { value: 'validado', label: 'Validado' },
    { value: 'descartado', label: 'Descartado' },
];

export function CreateExperimentModal({ 
    isOpen, 
    onClose, 
    onSubmit,
    isLoading = false
}: CreateExperimentModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<ExperimentStatus>('em_aberto');
    const [category, setCategory] = useState('');
    const [expectedWinRate, setExpectedWinRate] = useState('');
    const [expectedRiskReward, setExpectedRiskReward] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            
            // Generate previews
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const data: CreateExperimentData = {
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            category: category.trim() || undefined,
            expectedWinRate: expectedWinRate ? parseFloat(expectedWinRate) : undefined,
            expectedRiskReward: expectedRiskReward ? parseFloat(expectedRiskReward) : undefined,
        };

        await onSubmit(data, selectedFiles);
        handleReset();
    };

    const handleReset = () => {
        setTitle('');
        setDescription('');
        setStatus('em_aberto');
        setCategory('');
        setExpectedWinRate('');
        setExpectedRiskReward('');
        setSelectedFiles([]);
        setPreviews([]);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="🧪 Novo Experimento" maxWidth="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <Input
                    label="Título da Estratégia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Breakout com FVG no M5"
                    required
                />

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descrição / Hipótese
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva a ideia, condições de entrada, saída esperada..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                        rows={4}
                    />
                </div>

                {/* Status and Category row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ExperimentStatus)}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Tags / Categoria"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ex: Scalping, Breakout"
                    />
                </div>

                {/* Expected metrics row */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Win Rate Esperado (%)"
                        type="number"
                        value={expectedWinRate}
                        onChange={(e) => setExpectedWinRate(e.target.value)}
                        placeholder="Ex: 65"
                        min="0"
                        max="100"
                        step="0.1"
                    />

                    <Input
                        label="Risk/Reward Esperado"
                        type="number"
                        value={expectedRiskReward}
                        onChange={(e) => setExpectedRiskReward(e.target.value)}
                        placeholder="Ex: 2.5"
                        min="0"
                        step="0.1"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Screenshots de Gráficos
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
                        className="w-full py-8 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors flex flex-col items-center gap-2"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Clique para adicionar imagens</span>
                    </button>

                    {/* Previews */}
                    {previews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        {isLoading ? 'Salvando...' : 'Criar Experimento'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
