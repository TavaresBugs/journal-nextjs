'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Input, Textarea, Button, GlassCard } from '@/components/ui';
import { DatePickerInput } from '@/components/ui/DateTimePicker';
import type { Trade } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useBlockBodyScroll } from '@/hooks/useBlockBodyScroll';
import { TimeframeImageGrid, AssetCombobox } from '@/components/shared';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';


interface JournalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormSubmissionData) => Promise<void>;
  initialData?: Partial<FormSubmissionData>;
  linkedTrades?: Trade[]; // Trades already linked (for editing)
  availableTrades?: Trade[];
  accountId: string;
  isEditing?: boolean;
}

export interface FormData {
  date: string;
  title: string;
  asset: string;
  emotion: string;
  analysis: string;
  technicalWins: string;
  improvements: string;
  errors: string;
}

export interface FormSubmissionData extends FormData {
  images: Record<string, string[]>;
  tradeIds?: string[]; // Multiple trade IDs
}

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

/**
 * Form component for creating/editing journal entries.
 * Handles all form state and image uploads.
 */
export function JournalEntryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  linkedTrades: initialLinkedTrades = [],
  availableTrades = [],
  isEditing = false
}: JournalEntryFormProps) {
  const {  } = useSettingsStore();
  
  // Form state
  const [date, setDate] = useState(initialData?.date || dayjs().format('YYYY-MM-DD'));
  const [title, setTitle] = useState(initialData?.title || `Diário - ${dayjs().format('DD/MM/YYYY')}`);
  const [asset, setAsset] = useState(initialData?.asset || initialLinkedTrades[0]?.symbol || '');
  const [emotion, setEmotion] = useState(initialData?.emotion || '');
  const [analysis, setAnalysis] = useState(initialData?.analysis || '');
  const [technicalWins, setTechnicalWins] = useState(initialData?.technicalWins || '');
  const [improvements, setImprovements] = useState(initialData?.improvements || '');
  const [errors, setErrors] = useState(initialData?.errors || '');
  
  // Trade management - support multiple trades
  const [trades, setTrades] = useState<Trade[]>(initialLinkedTrades);
  const [isLinkTradeModalOpen, setIsLinkTradeModalOpen] = useState(false);
  
  // Block body scroll when link trade modal is open
  useBlockBodyScroll(isLinkTradeModalOpen);
  
  // Image management
  const initialImages = initialData?.images || {};
  const { images, handlePasteImage, handleFileSelect, removeLastImage } = useImageUpload(initialImages as Record<string, string[]>);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        title,
        asset: asset || 'Diário',
        emotion,
        analysis,
        technicalWins,
        improvements,
        errors,
        images,
        tradeIds: trades.map(t => t.id)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkTrade = (selectedTrade: Trade) => {
    // Add trade if not already linked
    if (!trades.find(t => t.id === selectedTrade.id)) {
      setTrades([...trades, selectedTrade]);
      // Set asset from first trade if not set
      if (!asset && trades.length === 0) {
        setAsset(selectedTrade.symbol);
      }
    }
    setIsLinkTradeModalOpen(false);
  };

  const handleRemoveTrade = (tradeId: string) => {
    setTrades(trades.filter(t => t.id !== tradeId));
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      {isEditing && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Voltar para visualização"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}
      <h2 className="text-xl font-bold text-gray-100">
        {isEditing ? "📝 Editando Diário" : "📝 Nova Entrada no Diário"}
      </h2>
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="6xl" noBackdrop>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Header Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Título / Resumo do Dia"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Diário - 02/12/2025"
                required
              />
            </div>
            <div className="md:col-span-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Ativo <span className="text-red-500 ml-1">*</span>
                </label>
                <AssetCombobox
                  value={asset}
                  onChange={setAsset}
                  className="bg-[#232b32] border-gray-700 h-12"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <DatePickerInput
                label="Data"
                value={date}
                onChange={setDate}
                required
                openDirection="bottom"
              />
            </div>
          </div>

          {/* Trades Vinculados */}
          <GlassCard className="p-4 bg-[#1b292b]/60 backdrop-blur-md border border-[#00c853]/50 shadow-[0_0_15px_rgba(0,200,83,0.15)] hover:shadow-[0_0_20px_rgba(0,200,83,0.2)] transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zorin-accent text-sm font-medium">
                Trades Vinculados {trades.length > 0 && <span className="text-cyan-300">({trades.length})</span>}
              </h3>
              <Button
                type="button"
                variant="gradient-success"
                onClick={() => setIsLinkTradeModalOpen(true)}
                className="text-white h-8 px-3 rounded-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide">Adicionar Trade</span>
              </Button>
            </div>
            
            {trades.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {trades.map((trade) => (
                  <GlassCard 
                    key={trade.id} 
                    className="p-2 flex items-center justify-between gap-2 bg-zorin-bg/50 border-white/5"
                  >
                    <div className="flex items-center flex-wrap gap-1 text-sm">
                      <span className="text-gray-400">
                        {dayjs(trade.entryDate).format('DD/MM')} {trade.entryTime?.substring(0, 5)}
                      </span>
                      <span className="text-gray-200 font-medium">{trade.symbol}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                        trade.type === 'Long'
                          ? 'bg-zorin-accent/20 text-zorin-accent'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type}
                        {trade.type === 'Long' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                            <polyline points="17 18 23 18 23 12"></polyline>
                          </svg>
                        )}
                      </span>
                      {trade.pnl !== undefined && (
                        <span className={`text-xs font-bold ${
                          trade.pnl > 0 ? 'text-zorin-accent' : 'text-red-400'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="zorin-ghost"
                      size="icon"
                      type="button"
                      onClick={() => handleRemoveTrade(trade.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors bg-transparent border-0 shadow-none h-6 w-6"
                      title="Remover trade"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </Button>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Nenhum trade vinculado a esta entrada.</p>
            )}
          </GlassCard>

          {/* Análise Multi-Timeframe (Imagens) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Análise Multi-Timeframe (Imagens)</label>
              <span className="text-xs text-gray-500">Clique no ícone de upload ou use CTRL+V para colar</span>
            </div>

            <TimeframeImageGrid
              timeframes={timeframes}
              images={images}
              onPaste={handlePasteImage}
              onFileSelect={handleFileSelect}
              onRemoveImage={removeLastImage}
            />
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
              className=""
            />
          </div>

          {/* Leitura do Ativo */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <span>🔍</span> Leitura do Ativo Operado
            </label>
            <Textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="Descreva sua análise do ativo em cada timeframe..."
              className="h-48 font-mono text-sm border-white/5"
            />
          </div>

          {/* Review */}
          <GlassCard className="space-y-4 p-4 bg-zorin-bg/30 border-white/5">
            <label className="flex items-center gap-2 text-sm text-gray-400 font-medium">
              <span>📜</span> Review
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zorin-accent">
                ✅ Acertos técnicos:
              </label>
              <Textarea
                value={technicalWins}
                onChange={(e) => setTechnicalWins(e.target.value)}
                className="h-20 border-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-yellow-400">
                ⚠️ Pontos a melhorar:
              </label>
              <Textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                className="h-20 border-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-red-400">
                ❌ Erros/Indisciplina:
              </label>
              <Textarea
                value={errors}
                onChange={(e) => setErrors(e.target.value)}
                className="h-20 border-white/5"
              />
            </div>
          </GlassCard>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            {isEditing && (
              <Button type="button" variant="gradient-danger" onClick={onClose} className="flex-1 font-extrabold">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="gradient-success" className="flex-1 font-extrabold" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Entrada'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Trade Modal */}
      {isLinkTradeModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <GlassCard className="bg-zorin-bg border-white/10 w-full max-w-md shadow-2xl overflow-hidden p-0">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zorin-surface/50">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                🔗 Vincular Trade
              </h3>
              <button
                onClick={() => setIsLinkTradeModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                      className="w-full bg-zorin-bg/50 hover:bg-zorin-surface/50 border border-white/5 hover:border-zorin-accent/50 rounded-lg p-3 transition-all text-left group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-200">{t.symbol}</span>
                        <span className={`font-bold ${t.pnl && t.pnl >= 0 ? 'text-zorin-accent' : 'text-red-400'}`}>
                          {formatCurrency(t.pnl || 0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex justify-between">
                        <span className="flex items-center gap-1">
                          <span className={`flex items-center gap-1 ${t.type === 'Long' ? 'text-zorin-accent' : 'text-red-400'}`}>
                            {t.type}
                            {t.type === 'Long' ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                              </svg>
                            )}
                          </span>
                          <span className="text-gray-400">@ {t.entryPrice}</span>
                        </span>
                        <span>
                          {(() => {
                            // Dados já estão armazenados como horário NY
                            const timeFormatted = t.entryTime ? t.entryTime.substring(0, 5) : '';
                            return `${timeFormatted} (NY)`;
                          })()}
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
          </GlassCard>
        </div>,
        document.body
      )}
    </>
  );
}
