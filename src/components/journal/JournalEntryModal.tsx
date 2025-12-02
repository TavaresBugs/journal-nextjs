'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Input, Textarea, Button } from '@/components/ui';
import type { Trade, JournalEntry } from '@/types';
import { useJournalStore } from '@/store/useJournalStore';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';

interface JournalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade?: Trade | null;
    existingEntry?: JournalEntry;
    initialDate?: string; // For standalone entries
    accountId?: string; // Required if trade is not provided
    availableTrades?: Trade[]; // Trades available for linking
}

export function JournalEntryModal({ isOpen, onClose, trade: initialTrade, existingEntry, initialDate, accountId, availableTrades = [] }: JournalEntryModalProps) {
    const { addEntry, updateEntry } = useJournalStore();
    
    // State initialization
    const [trade, setTrade] = useState<Trade | null | undefined>(initialTrade);
    const [isEditing, setIsEditing] = useState(!existingEntry);
    const [date, setDate] = useState(existingEntry?.date || (initialTrade ? initialTrade.entryDate.split('T')[0] : initialDate || dayjs().format('YYYY-MM-DD')));
    
    // Format default title: Journal - Ativo - DD/MM/YYYY
    const getDefaultTitle = () => {
        if (existingEntry?.title) return existingEntry.title;
        
        if (initialTrade) {
            const [year, month, day] = initialTrade.entryDate.split('T')[0].split('-');
            return `Journal - ${initialTrade.symbol} - ${day}/${month}/${year}`;
        }
        
        // Standalone entry default title
        const entryDate = initialDate ? dayjs(initialDate) : dayjs();
        return `Diário - ${entryDate.format('DD/MM/YYYY')}`;
    };

    const [title, setTitle] = useState(getDefaultTitle());
    const [asset, setAsset] = useState(existingEntry?.asset || initialTrade?.symbol || '');
    const [emotion, setEmotion] = useState(existingEntry?.emotion || '');
    const [analysis, setAnalysis] = useState(existingEntry?.analysis || '');
    
    // Parse notes if they exist
    const parsedNotes = existingEntry?.notes ? JSON.parse(existingEntry.notes) : {};
    
    const [technicalWins, setTechnicalWins] = useState(parsedNotes.technicalWins || '');
    const [improvements, setImprovements] = useState(parsedNotes.improvements || '');
    const [errors, setErrors] = useState(parsedNotes.errors || '');

    // Link Trade Modal State
    const [isLinkTradeModalOpen, setIsLinkTradeModalOpen] = useState(false);

    // Images state
    // Images state
    const [images, setImages] = useState<Record<string, string[]>>(() => {
        if (!existingEntry?.images) return {};
        if (Array.isArray(existingEntry.images)) {
            // Sort by displayOrder first if available, otherwise preserve order
            const sortedImages = [...existingEntry.images].sort((a, b) => a.displayOrder - b.displayOrder);
            return sortedImages.reduce((acc, img) => {
                if (!acc[img.timeframe]) acc[img.timeframe] = [];
                acc[img.timeframe].push(img.url);
                return acc;
            }, {} as Record<string, string[]>);
        }
        return {};
    });

    const handlePasteImage = async (e: React.ClipboardEvent<HTMLDivElement>, timeframe: string) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setImages(prev => ({ 
                            ...prev, 
                            [timeframe]: [...((prev[timeframe] as string[]) || []), base64] 
                        }));
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Ensure we have an account ID
        const targetAccountId = trade?.accountId || accountId || existingEntry?.accountId;
        
        if (!targetAccountId) {
            console.error('Account ID is missing');
            return;
        }

        setIsSubmitting(true);

        try {
            const entryData = {
                userId: '', // Will be set by storage
                accountId: targetAccountId,
                date,
                title,
                asset: asset || 'Diário',
                tradeId: trade?.id,
                images: images as any, // TODO: Convert Record<string, string[]> to JournalImage[]
                emotion,
                analysis,
                // Combine review sections into notes for now, or we could extend the type
                notes: JSON.stringify({
                    technicalWins,
                    improvements,
                    errors
                })
            };

            if (existingEntry) {
                await updateEntry({ ...existingEntry, ...entryData });
                setIsEditing(false); // Return to preview mode after update
            } else {
                await addEntry(entryData);
                onClose();
            }
        } catch (error) {
            console.error('Error saving entry:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkTrade = (selectedTrade: Trade) => {
        setTrade(selectedTrade);
        setAsset(selectedTrade.symbol);
        setIsLinkTradeModalOpen(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setImages(prev => ({ 
                    ...prev, 
                    [timeframe]: [...((prev[timeframe] as string[]) || []), base64] 
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = (timeframe: string) => {
        document.getElementById(`file-input-${timeframe}`)?.click();
    };

    const timeframes = [
        { key: 'tfM', label: 'Mensal' },
        { key: 'tfW', label: 'Semanal' },
        { key: 'tfD', label: 'Diário' },
        { key: 'tfH4', label: '4H' },
        { key: 'tfH1', label: '1H' },
        { key: 'tfM15', label: 'M15' },
        { key: 'tfM5', label: 'M5' },
        { key: 'tfM3', label: 'M3/M1' },
    ] as const;

    // Lightbox State
    const [previewImageKey, setPreviewImageKey] = useState<string | null>(null);
    const [previewImageIndex, setPreviewImageIndex] = useState(0);

    // Flatten images for lightbox navigation
    const allImages = timeframes.flatMap(tf => {
        const imgs = (images[tf.key] || []) as string[];
        return imgs.map((url, idx) => ({ key: tf.key, url, index: idx, label: tf.label }));
    });

    const currentLightboxIndex = allImages.findIndex(img => img.key === previewImageKey && img.index === previewImageIndex);

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentLightboxIndex < allImages.length - 1) {
            const next = allImages[currentLightboxIndex + 1];
            setPreviewImageKey(next.key);
            setPreviewImageIndex(next.index);
        } else {
            const next = allImages[0];
            setPreviewImageKey(next.key);
            setPreviewImageIndex(next.index);
        }
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentLightboxIndex > 0) {
            const prev = allImages[currentLightboxIndex - 1];
            setPreviewImageKey(prev.key);
            setPreviewImageIndex(prev.index);
        } else {
            const prev = allImages[allImages.length - 1];
            setPreviewImageKey(prev.key);
            setPreviewImageIndex(prev.index);
        }
    };

    // Edit Mode Content
    const modalTitle = (
        <div className="flex items-center gap-3">
            {existingEntry && (
                <button 
                    onClick={() => setIsEditing(false)}
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Voltar para visualização"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            )}
            <h2 className="text-xl font-bold text-gray-100">
                {existingEntry ? "📝 Editando Diário" : "📝 Nova Entrada no Diário"}
            </h2>
        </div>
    );



    // Preview Mode Content
    if (!isEditing && existingEntry) {
        return (
            <>
                <Modal isOpen={isOpen} onClose={onClose} title="📖 Visualizar Diário" maxWidth="6xl">
                    {/* ... (modal content same as before) ... */}
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-100">{title}</h2>
                                <div className="text-gray-400 text-sm mt-1">
                                    {dayjs(date).add(12, 'hour').format('DD/MM/YYYY')} • {trade?.symbol || existingEntry.asset || 'Diário'}
                                </div>
                            </div>
                            <Button onClick={() => setIsEditing(true)} variant="primary">
                                ✏️ Editar
                            </Button>
                        </div>

                        {/* Trade Info */}
                        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4">
                            <h3 className="text-cyan-400 text-sm font-medium mb-1">Trade Vinculado</h3>
                            {trade ? (
                                <p className="text-gray-300 text-sm">
                                    {dayjs(trade.entryDate).add(12, 'hour').format('DD/MM/YYYY')} - {trade.symbol} - {trade.type} - #{trade.id.slice(0, 13)} - 
                                    {trade.pnl !== undefined && (
                                        <span className={`ml-1 ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(trade.pnl)}
                                        </span>
                                    )}
                                </p>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-400 text-sm italic">Nenhum trade vinculado a esta entrada.</p>
                                </div>
                            )}
                        </div>

                        {/* Images Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {timeframes.map((tf) => {
                                const tfImages = images[tf.key] || [];
                                return (
                                    <div key={tf.key} className="aspect-video bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700 relative group">
                                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400 z-10">
                                            {tf.label} {tfImages.length > 1 && `(${tfImages.length})`}
                                        </div>
                                        {tfImages.length > 0 ? (
                                            <img 
                                                src={tfImages[0]} 
                                                alt={tf.label} 
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                                onClick={() => {
                                                    setPreviewImageKey(tf.key);
                                                    setPreviewImageIndex(0);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-900/30">
                                                <span className="text-gray-700 text-2xl font-bold opacity-20 select-none">
                                                    {tf.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Analysis & Emotion */}
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <span>🧠</span> Estado Emocional
                                </h3>
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 text-gray-200">
                                    {emotion || <span className="text-gray-500 italic">Não informado</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <span>🔍</span> Análise
                                </h3>
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-gray-200 whitespace-pre-wrap min-h-[120px]">
                                    {analysis || <span className="text-gray-500 italic">Sem análise registrada</span>}
                                </div>
                            </div>
                        </div>

                        {/* Review Section */}
                        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800 space-y-4">
                            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <span>📜</span> Review
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-green-400 mb-2 uppercase">Acertos</h4>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{technicalWins || '-'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-yellow-400 mb-2 uppercase">Melhorias</h4>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{improvements || '-'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-red-400 mb-2 uppercase">Erros</h4>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{errors || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Lightbox Overlay */}
                {previewImageKey && typeof document !== 'undefined' && createPortal(
                    <div 
                        className="fixed inset-0 z-60 bg-linear-to-br from-black/40 to-black/10 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setPreviewImageKey(null)}
                    >
                        <button 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                            onClick={() => setPreviewImageKey(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                            {allImages.length > 1 && (
                                <>
                                    <button 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
                                        onClick={handlePrevImage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>
                                    <button 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
                                        onClick={handleNextImage}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </>
                            )}
                            
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-sm font-medium text-cyan-400 z-10 flex gap-2">
                                    <span>{allImages[currentLightboxIndex]?.label}</span>
                                    {allImages.filter(i => i.key === previewImageKey).length > 1 && (
                                        <span className="text-gray-400">
                                            ({allImages.filter(i => i.key === previewImageKey).findIndex(i => i.index === previewImageIndex) + 1}/{allImages.filter(i => i.key === previewImageKey).length})
                                        </span>
                                    )}
                                </div>
                                <img 
                                    src={allImages[currentLightboxIndex]?.url} 
                                    alt="Preview" 
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Link Trade Modal Overlay */}
                {isLinkTradeModalOpen && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                                    🔗 Vincular Trade
                                </h3>
                                <button 
                                    onClick={() => setIsLinkTradeModalOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            
                            <div className="p-4">
                                <p className="text-sm text-gray-400 mb-4">Selecione um trade do dia para vincular a este diário:</p>
                                
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {availableTrades.length > 0 ? (
                                        availableTrades.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleLinkTrade(t)}
                                                className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all text-left group"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-200">{t.symbol}</span>
                                                    <span className={`font-bold ${t.pnl && t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {formatCurrency(t.pnl || 0)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 flex justify-between">
                                                    <span>
                                                        <span className={t.type === 'Long' ? 'text-green-400' : 'text-red-400'}>{t.type}</span> @ {t.entryPrice}
                                                    </span>
                                                    <span>
                                                        {dayjs(t.entryDate).add(12, 'hour').format('HH:mm')}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-800/20">
                                            <div className="text-4xl mb-3 opacity-30">🔍</div>
                                            <h4 className="text-gray-300 font-medium mb-1">Nenhum trade encontrado</h4>
                                            <p className="text-xs text-gray-500">Não há trades nesta data disponíveis para vínculo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    // Edit Mode Content
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <Input
                            label="Data"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Input
                            label="Ativo"
                            value={asset}
                            onChange={(e) => setAsset(e.target.value)}
                            placeholder="Ex: NAS100"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Input
                            label="Título / Resumo do Dia"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Diário - 02/12/2025"
                            required
                        />
                    </div>
                </div>

                {/* Trade Vinculado */}
                <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-cyan-400 text-sm font-medium mb-1">Trade Vinculado</h3>
                        {trade ? (
                            <p className="text-gray-300 text-sm">
                                {dayjs(trade.entryDate).add(12, 'hour').format('DD/MM/YYYY')} - {trade.symbol} - {trade.type} - #{trade.id.slice(0, 13)} - 
                                {trade.pnl !== undefined && (
                                    <span className={`ml-1 ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(trade.pnl)}
                                    </span>
                                )}
                            </p>
                        ) : (
                            <p className="text-gray-400 text-sm italic">Nenhum trade vinculado a esta entrada.</p>
                        )}
                    </div>

                    <div>
                        {trade ? (
                            <span className="text-xs text-gray-500 italic">
                                Trade vinculado
                            </span>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => setIsLinkTradeModalOpen(true)}
                                className="text-sm bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded transition-colors flex items-center gap-2"
                            >
                                🔗 Vincular Trade
                            </button>
                        )}
                    </div>
                </div>

                {/* Análise Multi-Timeframe (Imagens) */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-400">Análise Multi-Timeframe (Imagens)</label>
                        <span className="text-xs text-gray-500">Clique no ícone de upload ou use CTRL+V para colar</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {timeframes.map((tf) => {
                            const tfImages = images[tf.key] || [];
                            return (
                                <div 
                                    key={tf.key}
                                    className="aspect-video bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl relative group overflow-hidden transition-all duration-200"
                                    onPaste={(e) => handlePasteImage(e, tf.key)}
                                    tabIndex={0}
                                >
                                    <input
                                        type="file"
                                        id={`file-input-${tf.key}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, tf.key)}
                                    />

                                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400 z-10">
                                        {tf.label} {tfImages.length > 0 && `(${tfImages.length})`}
                                    </div>
                                    
                                    {tfImages.length > 0 ? (
                                        <>
                                            <img 
                                                src={tfImages[tfImages.length - 1]} 
                                                alt={tf.label} 
                                                className="w-full h-full object-cover"
                                            />
                                            
                                            {/* Delete Button - Removes last image */}
                                            <button
                                                type="button"
                                                onClick={() => setImages(prev => ({ 
                                                    ...prev, 
                                                    [tf.key]: prev[tf.key].slice(0, -1) 
                                                }))}
                                                className="absolute top-2 right-2 p-1 bg-red-500/80 rounded hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                title="Remover última imagem"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                            </button>

                                            {/* Add Button Overlay */}
                                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <button
                                                    type="button"
                                                    onClick={() => triggerFileInput(tf.key)}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors"
                                                    title="Adicionar outra imagem"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl text-gray-600 group-hover:text-gray-500 mb-2">+</span>
                                            
                                            {/* Controls that appear on hover/focus */}
                                            <div className="absolute bottom-3 w-full px-3 flex justify-between items-end opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                                                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">
                                                    CTRL+V
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => triggerFileInput(tf.key)}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors"
                                                    title="Upload Imagem"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Estado Emocional */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                        <span>🧠</span> Estado Emocional
                    </label>
                    <Input
                        value={emotion}
                        onChange={(e) => setEmotion(e.target.value)}
                        placeholder="Ex: Calmo, Ansioso, Focado, Vingativo..."
                        className="bg-gray-900/50"
                    />
                </div>

                {/* Leitura do Ativo */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                        <span>🔍</span> LEITURA DO ATIVO OPERADO
                    </label>
                    <Textarea
                        value={analysis}
                        onChange={(e) => setAnalysis(e.target.value)}
                        placeholder="Análise do Mensal:\nAnálise do Semanal:\nAnálise do Diário:\n..."
                        className="h-48 font-mono text-sm bg-gray-900/50"
                    />
                </div>

                {/* Review */}
                <div className="space-y-4 bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                    <label className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                        <span>📜</span> Review
                    </label>
                    
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-green-400">
                            ✅ Acertos técnicos:
                        </label>
                        <Textarea
                            value={technicalWins}
                            onChange={(e) => setTechnicalWins(e.target.value)}
                            className="h-20 bg-gray-900/50 border-gray-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-yellow-400">
                            ⚠️ Pontos a melhorar:
                        </label>
                        <Textarea
                            value={improvements}
                            onChange={(e) => setImprovements(e.target.value)}
                            className="h-20 bg-gray-900/50 border-gray-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-red-400">
                            ❌ Erros/Indisciplina:
                        </label>
                        <Textarea
                            value={errors}
                            onChange={(e) => setErrors(e.target.value)}
                            className="h-20 bg-gray-900/50 border-gray-700"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                    {existingEntry && (
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white flex-1">
                        Salvar Entrada
                    </Button>
                </div>
            </form>

            {/* Link Trade Modal Overlay */}
            {isLinkTradeModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                                🔗 Vincular Trade
                            </h3>
                            <button 
                                onClick={() => setIsLinkTradeModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <p className="text-sm text-gray-400 mb-4">Selecione um trade do dia para vincular a este diário:</p>
                            
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {availableTrades.length > 0 ? (
                                    availableTrades.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleLinkTrade(t)}
                                            className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all text-left group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-gray-200">{t.symbol}</span>
                                                <span className={`font-bold ${t.pnl && t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatCurrency(t.pnl || 0)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 flex justify-between">
                                                <span>
                                                    <span className={t.type === 'Long' ? 'text-green-400' : 'text-red-400'}>{t.type}</span> @ {t.entryPrice}
                                                </span>
                                                <span>
                                                    {dayjs(t.entryDate).add(12, 'hour').format('HH:mm')}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-800/20">
                                        <div className="text-4xl mb-3 opacity-30">🔍</div>
                                        <h4 className="text-gray-300 font-medium mb-1">Nenhum trade encontrado</h4>
                                        <p className="text-xs text-gray-500">Não há trades nesta data disponíveis para vínculo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </Modal>
    );
}
