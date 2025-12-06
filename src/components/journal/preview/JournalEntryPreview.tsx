'use client';

import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Button } from '@/components/ui';
import type { Trade, JournalEntry } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

interface JournalEntryPreviewProps {
  entry: JournalEntry;
  trade: Trade | null | undefined;
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
  isSharingLoading: boolean;
}

/**
 * Preview mode component for viewing journal entries.
 * Displays all entry information in a read-only format with edit and share options.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @param entry - The journal entry to display
 * @param trade - The linked trade (optional)
 * @param onClose - Callback to close the preview
 * @param onEdit - Callback to switch to edit mode
 * @param onShare - Callback to share the entry
 * @param isSharingLoading - Loading state for share action
 */
const JournalEntryPreviewComponent = ({
  entry,
  trade,
  onClose,
  onEdit,
  onShare,
  isSharingLoading
}: JournalEntryPreviewProps) => {
  const [previewImageKey, setPreviewImageKey] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Parse notes
  const parsedNotes = entry.notes ? JSON.parse(entry.notes) : {};
  const technicalWins = parsedNotes.technicalWins || '';
  const improvements = parsedNotes.improvements || '';
  const errors = parsedNotes.errors || '';

  // Timeframes configuration
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

  // Parse images
  const images: Record<string, string[]> = {};
  if (entry.images && Array.isArray(entry.images)) {
    const sortedImages = [...entry.images].sort((a, b) => a.displayOrder - b.displayOrder);
    sortedImages.forEach(img => {
      if (!images[img.timeframe]) images[img.timeframe] = [];
      images[img.timeframe].push(img.url);
    });
  }

  // Flatten images for lightbox
  const allImages = timeframes.flatMap(tf => {
    const imgs = (images[tf.key] || []) as string[];
    return imgs.map((url, idx) => ({ key: tf.key, url, index: idx, label: tf.label }));
  });

  const currentLightboxIndex = allImages.findIndex(
    img => img.key === previewImageKey && img.index === previewImageIndex
  );

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

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="📖 Visualizar Diário" maxWidth="6xl">
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-100">{entry.title}</h2>
              <div className="text-gray-400 text-sm mt-1">
                {formatTz(toZonedTime(entry.date, 'America/New_York'), 'dd/MM/yyyy', { timeZone: 'America/New_York' })} • {trade?.symbol || entry.asset || 'Diário'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onShare} variant="info" disabled={isSharingLoading}>
                {isSharingLoading ? '⏳' : '📤'} Compartilhar
              </Button>
              <Button onClick={onEdit} variant="gold">
                ✏️ Editar
              </Button>
            </div>
          </div>

          {/* Trade Info */}
          <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-cyan-400 text-sm font-medium mb-1">Trade Vinculado</h3>
            {trade ? (
              <p className="text-gray-300 text-sm">
                {(() => {
                  let dateTimeStr = trade.entryDate;
                  if (!dateTimeStr.includes('T') && trade.entryTime) {
                    dateTimeStr = `${trade.entryDate}T${trade.entryTime}`;
                  }
                  return formatTz(toZonedTime(dateTimeStr, 'America/New_York'), 'dd/MM/yyyy - HH:mm:ss', { timeZone: 'America/New_York' });
                })()} (NY) - {trade.symbol} - {trade.type} - #{trade.id.slice(0, 13)} -
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

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeframes.map(tf => {
              const tfImages = images[tf.key] || [];
              return (
                <div key={tf.key} className="aspect-video bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700 relative group">
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400 z-10">
                    {tf.label} {tfImages.length > 1 && `(${tfImages.length})`}
                  </div>
                  {tfImages.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                      <span className="text-gray-700 text-2xl font-bold opacity-20 select-none">{tf.label}</span>
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
                {entry.emotion || <span className="text-gray-500 italic">Não informado</span>}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <span>🔍</span> Análise
              </h3>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-gray-200 whitespace-pre-wrap min-h-[120px]">
                {entry.analysis || <span className="text-gray-500 italic">Sem análise registrada</span>}
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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
                  onClick={handlePrevImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
                  onClick={handleNextImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
    </>
  );
};

export const JournalEntryPreview = memo(JournalEntryPreviewComponent);
