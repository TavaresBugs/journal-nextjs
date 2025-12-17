'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, Button } from '@/components/ui';
import type { LaboratoryRecap, EmotionalState, TradeLite, JournalEntryLite, RecapLinkedType } from '@/types';
import { UpdateRecapData } from '@/store/useLaboratoryStore';

/** Unified search record for trades and journal entries */
interface SearchRecord {
    type: RecapLinkedType;
    id: string;
    label: string;
    symbol?: string;
    date: string;
    outcome?: string;
    title?: string;
}

interface EditRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    recap: LaboratoryRecap | null;
    onUpdateRecap: (data: UpdateRecapData, files: File[]) => Promise<void>;
    trades?: TradeLite[];
    journalEntries?: JournalEntryLite[];
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
    trades = [],
    journalEntries = [],
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
    
    // Linked record state
    const [linkedType, setLinkedType] = useState<RecapLinkedType | undefined>();
    const [linkedId, setLinkedId] = useState('');
    const [recordSearch, setRecordSearch] = useState('');
    const [showRecordDropdown, setShowRecordDropdown] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadZoneRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handler para adicionar arquivos (usado tanto pelo input quanto pelo paste)
    const addFiles = useCallback((files: File[]) => {
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
    }, []);

    // Handler para paste no elemento (usado no onPaste do elemento)
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            addFiles(imageFiles);
        }
    }, [addFiles]);

    // Handler para Ctrl+V (colar imagem do clipboard)
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        imageFiles.push(file);
                    }
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault();
                addFiles(imageFiles);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [isOpen, addFiles]);

    // Get recent records (last 7 days) for initial dropdown display
    const recentRecords = useMemo((): SearchRecord[] => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        const recentTrades: SearchRecord[] = trades
            .filter(t => t.entryDate >= oneWeekAgoStr)
            .slice(0, 5)
            .map(t => ({
                type: 'trade' as const,
                id: t.id,
                label: t.symbol,
                symbol: t.symbol,
                date: t.entryDate,
                outcome: t.outcome,
            }));

        const recentJournals: SearchRecord[] = journalEntries
            .filter(j => j.date >= oneWeekAgoStr)
            .slice(0, 5)
            .map(j => ({
                type: 'journal' as const,
                id: j.id,
                label: j.asset || 'Observação',
                date: j.date,
                title: j.title,
            }));

        return [...recentJournals, ...recentTrades]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8);
    }, [trades, journalEntries]);

    // Unified search results
    const searchResults = useMemo((): SearchRecord[] => {
        if (!recordSearch || recordSearch.length < 2) {
            return showRecordDropdown ? recentRecords : [];
        }

        const query = recordSearch.toLowerCase();
        
        const matchingTrades: SearchRecord[] = trades
            .filter(t => 
                t.symbol.toLowerCase().includes(query) ||
                t.entryDate.includes(query)
            )
            .slice(0, 5)
            .map(t => ({
                type: 'trade' as const,
                id: t.id,
                label: t.symbol,
                symbol: t.symbol,
                date: t.entryDate,
                outcome: t.outcome,
            }));
        
        const matchingJournals: SearchRecord[] = journalEntries
            .filter(j => 
                j.title?.toLowerCase().includes(query) ||
                j.asset?.toLowerCase().includes(query) ||
                j.date.includes(query)
            )
            .slice(0, 5)
            .map(j => ({
                type: 'journal' as const,
                id: j.id,
                label: j.asset || 'Observação',
                date: j.date,
                title: j.title,
            }));
        
        return [...matchingJournals, ...matchingTrades];
    }, [recordSearch, trades, journalEntries, showRecordDropdown, recentRecords]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowRecordDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Pre-fill form when recap changes
    useEffect(() => {
        if (recap) {
            setTitle(recap.title);
            setWhatWorked(recap.whatWorked || '');
            setWhatFailed(recap.whatFailed || '');
            setEmotionalState(recap.emotionalState || '');
            setLessonsLearned(recap.lessonsLearned || '');
            setLinkedType(recap.linkedType);
            setLinkedId(recap.linkedId || '');
            // Show existing images as previews
            if (recap.images?.length) {
                setPreviews(recap.images);
            }
            // Set search display for linked record
            if (recap.linkedType === 'trade' && recap.trade) {
                setRecordSearch(recap.trade.symbol);
            } else if (recap.linkedType === 'journal' && recap.journal) {
                setRecordSearch(recap.journal.title || recap.journal.asset || 'Diário');
            } else {
                setRecordSearch('');
            }
        }
    }, [recap]);

    if (!recap) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addFiles(files);
        // Reset input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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

    const selectRecord = (record: SearchRecord) => {
        setLinkedType(record.type);
        setLinkedId(record.id);
        setRecordSearch(record.label);
        setShowRecordDropdown(false);
    };

    const clearLinkedRecord = () => {
        setLinkedType(undefined);
        setLinkedId('');
        setRecordSearch('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const data: UpdateRecapData = {
            id: recap.id,
            title: title.trim(),
            linkedType: linkedType,
            linkedId: linkedId || undefined,
            whatWorked: whatWorked.trim() || undefined,
            whatFailed: whatFailed.trim() || undefined,
            emotionalState: emotionalState || undefined,
            lessonsLearned: lessonsLearned.trim() || undefined,
            // Keep existing images for now (image update would require more complex logic)
            images: recap.images,
        };

        await onUpdateRecap(data, newFiles);
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
                    <span className="text-lg font-semibold text-zorin-ice">📝 Editando Review Diário</span>
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

                {/* Record Link - Editable Search */}
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vincular a um registro (opcional)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={recordSearch}
                            onChange={(e) => {
                                setRecordSearch(e.target.value);
                                setShowRecordDropdown(true);
                                if (e.target.value === '') {
                                    clearLinkedRecord();
                                }
                            }}
                            onFocus={() => setShowRecordDropdown(true)}
                            placeholder="Buscar por ativo, data ou diário..."
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors pr-20"
                        />
                        {/* Badge showing current linked type */}
                        {linkedType && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                    linkedType === 'trade' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {linkedType === 'trade' ? 'TRADE' : 'DIÁRIO'}
                                </span>
                                <button
                                    type="button"
                                    onClick={clearLinkedRecord}
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                    title="Remover vínculo"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Dropdown Results */}
                    {showRecordDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl max-h-48 overflow-auto">
                            {searchResults.map(record => (
                                <button
                                    key={`${record.type}-${record.id}`}
                                    type="button"
                                    onClick={() => selectRecord(record)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center gap-3 border-b border-gray-700/50 last:border-0"
                                >
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                        record.type === 'trade' 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {record.type === 'trade' ? 'TRADE' : 'DIÁRIO'}
                                    </span>
                                    <span className="text-white flex-1 truncate">
                                        {record.label}
                                    </span>
                                    <span className="text-gray-400 text-sm">{record.date}</span>
                                    {record.outcome && (
                                        <span className={`text-sm ${
                                            record.outcome === 'win' ? 'text-green-400' : 
                                            record.outcome === 'loss' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                            {record.outcome === 'win' ? '✓' : record.outcome === 'loss' ? '✗' : '⬤'}
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
                        {/* Add Zone - área clicável para foco + paste */}
                        <div
                            ref={uploadZoneRef}
                            tabIndex={0}
                            onClick={() => uploadZoneRef.current?.focus()}
                            onPaste={handlePaste}
                            className="h-20 border-2 border-dashed border-gray-600 hover:border-cyan-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer group relative"
                        >
                            <span className="text-2xl group-focus:text-cyan-400">+</span>
                            
                            {/* Controls que aparecem no hover/focus */}
                            <div className="absolute bottom-1 w-full px-1 flex justify-between items-end opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                                <span className="bg-cyan-500/20 text-cyan-400 text-[8px] font-bold px-1 py-0.5 rounded">
                                    CTRL+V
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-white p-1 rounded shadow-lg transition-colors"
                                    title="Upload Imagem"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
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
                {/* Hidden file input - deve estar dentro do Modal */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </form>
        </Modal>
    );
}
