'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Modal, Button, GlassCard, WeekPicker, SegmentedToggle } from '@/components/ui';
import { CustomCheckbox } from '@/components/checklist/CustomCheckbox';
import type { EmotionalState, TradeLite, JournalEntryLite, RecapLinkedType } from '@/types';
import { CreateRecapData } from '@/store/useLaboratoryStore';
import { formatCurrency } from '@/lib/calculations';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LaboratoryRecap } from '@/types';

const REVIEW_TYPE_OPTIONS = [
    { value: 'daily', label: <>📅 Review Diário</> },
    { value: 'weekly', label: <>📊 Review Semanal</> },
];

/** Unified search record for trades and journal entries */
interface SearchRecord {
    type: RecapLinkedType;
    id: string;
    label: string;
    // Additional data for display
    symbol?: string;
    date: string;
    outcome?: string;
    title?: string;
}

interface CreateRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateRecapData, files: File[]) => Promise<void>;
    onUpdate?: (id: string, data: CreateRecapData, files: File[]) => Promise<void>;
    trades: TradeLite[];
    journalEntries?: JournalEntryLite[];
    isLoading?: boolean;
    editingRecap?: LaboratoryRecap | null;
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
    onUpdate,
    trades,
    journalEntries = [],
    isLoading = false,
    editingRecap
}: CreateRecapModalProps) {
    const isEditMode = !!editingRecap;
    // Review type toggle
    const [reviewType, setReviewType] = useState<'daily' | 'weekly'>('daily');
    
    // Form state
    const [title, setTitle] = useState('');
    const [linkedType, setLinkedType] = useState<RecapLinkedType | undefined>();
    const [linkedId, setLinkedId] = useState('');
    const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
    const [whatWorked, setWhatWorked] = useState('');
    const [whatFailed, setWhatFailed] = useState('');
    const [emotionalState, setEmotionalState] = useState<EmotionalState | ''>('');
    const [lessonsLearned, setLessonsLearned] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [recordSearch, setRecordSearch] = useState('');
    const [showRecordDropdown, setShowRecordDropdown] = useState(false);
    
    // Week selection
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const now = new Date();
        return format(now, "yyyy-'W'ww");
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const uploadZoneRef = useRef<HTMLDivElement>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Parse week string to dates
    const weekDates = useMemo(() => {
        try {
            const [year, week] = selectedWeek.split('-W').map(Number);
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToAdd = (week - 1) * 7;
            const weekStart = startOfWeek(new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000), { locale: ptBR });
            const weekEnd = endOfWeek(weekStart, { locale: ptBR });
            return { weekStart, weekEnd };
        } catch {
            return { weekStart: new Date(), weekEnd: new Date() };
        }
    }, [selectedWeek]);

    // Filter trades for weekly review
    const weekTrades = useMemo(() => {
        if (reviewType !== 'weekly') return [];
        return trades.filter(trade => {
            const tradeDate = parseISO(trade.entryDate);
            return tradeDate >= weekDates.weekStart && tradeDate <= weekDates.weekEnd;
        });
    }, [trades, weekDates, reviewType]);

    // Get recent records (last 7 days) for initial display
    const recentRecords = useMemo((): SearchRecord[] => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        // Recent trades
        const recentTrades: SearchRecord[] = trades
            .filter(t => t.entryDate >= oneWeekAgoStr)
            .slice(0, 5)
            .map(t => ({
                type: 'trade' as const,
                id: t.id,
                label: t.symbol, // Just the symbol - badge shows [TRADE]
                symbol: t.symbol,
                date: t.entryDate,
                outcome: t.outcome,
            }));

        // Recent journals
        const recentJournals: SearchRecord[] = journalEntries
            .filter(j => j.date >= oneWeekAgoStr)
            .slice(0, 5)
            .map(j => ({
                type: 'journal' as const,
                id: j.id,
                label: j.asset || 'Observação', // Just the asset - badge shows [DIÁRIO]
                date: j.date,
                title: j.title,
            }));

        // Sort by date descending (most recent first)
        return [...recentJournals, ...recentTrades]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8);
    }, [trades, journalEntries]);

    // Unified search results (trades + journals)
    const searchResults = useMemo((): SearchRecord[] => {
        // If no search query, show recent records
        if (!recordSearch || recordSearch.length < 2) {
            return showRecordDropdown ? recentRecords : [];
        }

        const query = recordSearch.toLowerCase();
        
        // Filter trades matching the search
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
        
        // Filter journals matching the search
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
        
        // Journals first (more recent in memory), then trades
        return [...matchingJournals, ...matchingTrades];
    }, [recordSearch, trades, journalEntries, showRecordDropdown, recentRecords]);

    // Calculate stats for selected trades
    const weekStats = useMemo(() => {
        const selected = weekTrades.filter(t => selectedTradeIds.includes(t.id));
        // Calculate wins based on P&L (positive = win), not outcome field
        const wins = selected.filter(t => (t.pnl ?? 0) > 0).length;
        const total = selected.length;
        const totalPnL = selected.reduce((sum, t) => sum + (t.pnl || 0), 0);
        
        return {
            count: total,
            total: weekTrades.length,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            totalPnL,
        };
    }, [weekTrades, selectedTradeIds]);

    // Pre-fill form when editing OR reset when opening fresh
    useEffect(() => {
        if (!isOpen) return; // Only run when modal is open
        
        if (editingRecap) {
            // Edit mode: fill with existing data
            setTitle(editingRecap.title);
            setReviewType('daily'); // Default to daily for editing existing recaps
            setLinkedType(editingRecap.linkedType);
            setLinkedId(editingRecap.linkedId || editingRecap.tradeId || '');
            setWhatWorked(editingRecap.whatWorked || '');
            setWhatFailed(editingRecap.whatFailed || '');
            setEmotionalState(editingRecap.emotionalState || '');
            setLessonsLearned(editingRecap.lessonsLearned || '');
            // For existing images, we can't convert URLs back to Files
            // but we can show previews
            if (editingRecap.images?.length) {
                setPreviews(editingRecap.images);
            } else {
                setPreviews([]);
            }
            setSelectedFiles([]);
            // Set search display for linked record
            if (editingRecap.linkedType === 'trade' && editingRecap.trade) {
                setRecordSearch(editingRecap.trade.symbol);
            } else if (editingRecap.linkedType === 'journal' && editingRecap.journal) {
                setRecordSearch(editingRecap.journal.title || 'Journal Entry');
            } else {
                setRecordSearch('');
            }
        } else {
            // Create mode: reset all fields
            setTitle('');
            setLinkedType(undefined);
            setLinkedId('');
            setRecordSearch('');
            setSelectedTradeIds([]);
            setWhatWorked('');
            setWhatFailed('');
            setEmotionalState('');
            setLessonsLearned('');
            setSelectedFiles([]);
            setPreviews([]);
            setReviewType('daily');
            setCarouselIndex(0);
        }
    }, [isOpen, editingRecap]);

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
        // Adjust carousel index if needed
        setCarouselIndex(prev => Math.max(0, Math.min(prev, previews.length - 2)));
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    setSelectedFiles(prev => [...prev, file]);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setPreviews(prev => [...prev, event.target?.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const selectRecord = (record: SearchRecord) => {
        setLinkedType(record.type);
        setLinkedId(record.id);
        setRecordSearch(record.label);
        setShowRecordDropdown(false);
    };

    const toggleTradeSelection = (id: string) => {
        setSelectedTradeIds(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) return;

        const data: CreateRecapData = {
            title: title.trim(),
            reviewType,
            linkedType: reviewType === 'daily' ? linkedType : undefined,
            linkedId: reviewType === 'daily' ? (linkedId || undefined) : undefined,
            tradeIds: reviewType === 'weekly' ? selectedTradeIds : undefined,
            weekStartDate: reviewType === 'weekly' ? format(weekDates.weekStart, 'yyyy-MM-dd') : undefined,
            weekEndDate: reviewType === 'weekly' ? format(weekDates.weekEnd, 'yyyy-MM-dd') : undefined,
            whatWorked: whatWorked.trim() || undefined,
            whatFailed: whatFailed.trim() || undefined,
            emotionalState: emotionalState || undefined,
            lessonsLearned: lessonsLearned.trim() || undefined,
        };

        if (isEditMode && editingRecap && onUpdate) {
            await onUpdate(editingRecap.id, data, selectedFiles);
        } else {
            await onSubmit(data, selectedFiles);
        }
        handleReset();
    };

    const handleReset = () => {
        setTitle('');
        setLinkedType(undefined);
        setLinkedId('');
        setRecordSearch('');
        setSelectedTradeIds([]);
        setWhatWorked('');
        setWhatFailed('');
        setEmotionalState('');
        setLessonsLearned('');
        setSelectedFiles([]);
        setPreviews([]);
        setReviewType('daily');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? `✏️ ${editingRecap?.title || 'Editar Recap'}` : "📝 Novo Recap"} maxWidth="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Review Type Toggle - Modern Tabs (hidden in edit mode) */}
                {!isEditMode && (
                    <SegmentedToggle
                        value={reviewType}
                        onChange={(val) => setReviewType(val as 'daily' | 'weekly')}
                        options={REVIEW_TYPE_OPTIONS}
                        className="mb-6"
                    />
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Título do Recap
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={reviewType === 'daily' 
                            ? "Ex: Análise do trade EURUSD 11/12" 
                            : "Ex: Review Semana 50 - Dezembro 2024"
                        }
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                </div>

                {/* Record Link - Daily Mode */}
                {reviewType === 'daily' && (
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Vincular a um registro (opcional)
                        </label>
                        <input
                            type="text"
                            value={recordSearch}
                            onChange={(e) => {
                                setRecordSearch(e.target.value);
                                setShowRecordDropdown(true);
                                if (e.target.value === '') {
                                    setLinkedType(undefined);
                                    setLinkedId('');
                                }
                            }}
                            onFocus={() => setShowRecordDropdown(true)}
                            placeholder="Buscar por ativo, data ou diário..."
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                        />
                        
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
                )}

                {/* Week Selection and Trade Multi-Select - Weekly Mode */}
                {reviewType === 'weekly' && (
                    <GlassCard className="p-4 space-y-4 bg-gray-800/30 border-white/5">
                        {/* Week Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Semana de Análise
                            </label>
                            <WeekPicker
                                selectedWeek={selectedWeek}
                                onWeekChange={setSelectedWeek}
                            />
                        </div>

                        {/* Trades Multi-Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Trades da Semana (selecione para incluir)
                            </label>
                            
                            {weekTrades.length > 0 ? (
                                <>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {weekTrades.map(trade => (
                                            <div
                                                key={trade.id}
                                                onClick={() => toggleTradeSelection(trade.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedTradeIds.includes(trade.id)
                                                        ? 'bg-zorin-accent/10 border-zorin-accent/50 shadow-[0_0_10px_rgba(0,200,83,0.15)]'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <CustomCheckbox
                                                        checked={selectedTradeIds.includes(trade.id)}
                                                        onChange={() => toggleTradeSelection(trade.id)}
                                                    />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${trade.type === 'Long' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {trade.type}
                                                        </span>
                                                        <span className="text-white">{trade.symbol}</span>
                                                        <span className="text-gray-400">
                                                            {format(parseISO(trade.entryDate), 'dd/MM HH:mm', { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    <span className={(trade.pnl ?? 0) > 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                                                        {(trade.pnl ?? 0) > 0 ? '+' : ''}{formatCurrency(trade.pnl ?? 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Stats Footer */}
                                    <div className="mt-3 p-3 bg-white/5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-sm">
                                        <span className="text-gray-400">
                                            {weekStats.count} de {weekStats.total} trades
                                        </span>
                                        <span className="text-gray-300">
                                            Win Rate: <span className={weekStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>{weekStats.winRate.toFixed(0)}%</span>
                                        </span>
                                        <span className={weekStats.totalPnL > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                            {weekStats.totalPnL > 0 ? '+' : ''}{formatCurrency(weekStats.totalPnL)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Nenhum trade encontrado nesta semana</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
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
                            className="w-full px-4 py-3 bg-gray-800/50 border border-green-700/30 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                            rows={5}
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
                            rows={5}
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
                        placeholder={reviewType === 'daily' 
                            ? "O que você aprendeu com este trade..." 
                            : "O que você aprendeu nesta semana de trading..."
                        }
                        className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-700/30 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                        rows={6}
                    />
                </div>

                {/* Image Upload - Paste Zone with Carousel */}
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

                    {/* Upload Zone - Focusable for paste */}
                    <div
                        ref={uploadZoneRef}
                        tabIndex={0}
                        onPaste={handlePaste}
                        onClick={() => uploadZoneRef.current?.focus()}
                        className="relative w-full aspect-video bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 rounded-xl overflow-hidden group transition-all cursor-pointer outline-none"
                    >
                        {previews.length > 0 ? (
                            <>
                                {/* Main Image Display - Carousel */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previews[carouselIndex]}
                                    alt={`Screenshot ${carouselIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Image Counter Badge */}
                                <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-xs font-medium text-cyan-400">
                                    {carouselIndex + 1} / {previews.length}
                                </div>

                                {/* Delete Current Image Button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(carouselIndex);
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-red-500/80 rounded-lg hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover imagem"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Carousel Navigation */}
                                {previews.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCarouselIndex(prev => prev > 0 ? prev - 1 : previews.length - 1);
                                            }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 rounded-lg text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCarouselIndex(prev => prev < previews.length - 1 ? prev + 1 : 0);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/70 rounded-lg text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}

                                {/* Bottom Controls */}
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">
                                        CTRL+V
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                                        title="Adicionar mais imagens"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Thumbnail Strip */}
                                {previews.length > 1 && (
                                    <div className="absolute bottom-14 left-3 right-3 flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {previews.map((preview, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCarouselIndex(index);
                                                }}
                                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                                    index === carouselIndex 
                                                        ? 'border-cyan-500 ring-2 ring-cyan-500/50' 
                                                        : 'border-white/30 hover:border-white/60'
                                                }`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={preview}
                                                    alt={`Thumb ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Empty State */
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <svg className="w-10 h-10 text-gray-600 group-hover:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 text-sm mb-1">Clique ou cole uma imagem</p>
                                
                                {/* Controls visible on hover/focus */}
                                <div className="absolute bottom-3 w-full px-3 flex justify-between items-end opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">
                                        CTRL+V
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors"
                                        title="Upload Imagem"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="gradient-success" 
                        disabled={!title.trim() || isLoading || (reviewType === 'weekly' && selectedTradeIds.length === 0)}
                    >
                        {isLoading ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar Recap'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
