'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Input, Textarea, Button } from '@/components/ui';
import type { Trade } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useImageUpload } from '@/hooks/useImageUpload';
import { TimeframeImageGrid } from '@/components/shared';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';

interface JournalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormSubmissionData) => Promise<void>;
  initialData?: Partial<FormSubmissionData>;
  trade: Trade | null | undefined;
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
  tradeId?: string;
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
  trade: linkedTrade,
  availableTrades = [],
  isEditing = false
}: JournalEntryFormProps) {
  const { assets } = useSettingsStore();
  
  // Form state
  const [date, setDate] = useState(initialData?.date || dayjs().format('YYYY-MM-DD'));
  const [title, setTitle] = useState(initialData?.title || `Diário - ${dayjs().format('DD/MM/YYYY')}`);
  const [asset, setAsset] = useState(initialData?.asset || linkedTrade?.symbol || '');
  const [emotion, setEmotion] = useState(initialData?.emotion || '');
  const [analysis, setAnalysis] = useState(initialData?.analysis || '');
  const [technicalWins, setTechnicalWins] = useState(initialData?.technicalWins || '');
  const [improvements, setImprovements] = useState(initialData?.improvements || '');
  const [errors, setErrors] = useState(initialData?.errors || '');
  
  // Trade management
  const [trade, setTrade] = useState<Trade | null | undefined>(linkedTrade);
  const [isLinkTradeModalOpen, setIsLinkTradeModalOpen] = useState(false);
  
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
        tradeId: trade?.id
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkTrade = (selectedTrade: Trade) => {
    setTrade(selectedTrade);
    setAsset(selectedTrade.symbol);
    setIsLinkTradeModalOpen(false);
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
      <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="6xl">
        <form onSubmit={handleFormSubmit} className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ativo
              </label>
              <input
                list="journal-assets-list"
                value={asset}
                onChange={(e) => setAsset(e.target.value.toUpperCase())}
                placeholder="EX: NAS100"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 uppercase"
                required
              />
              <datalist id="journal-assets-list">
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol} />
                ))}
              </datalist>
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
                  className="text-sm bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 font-semibold"
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
              className="bg-gray-900/50"
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
