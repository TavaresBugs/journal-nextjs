import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from '@/components/ui';
import { formatCurrency } from '@/lib/calculations';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import type { Trade, JournalEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getReviewsForJournalEntry, markReviewAsRead, type MentorReview } from '@/services/journal/review';
import { ensureFreshImageUrl } from '@/lib/utils/general';
import dayjs from 'dayjs';

interface JournalEntryContentProps {
  entry: JournalEntry;
  linkedTrades?: Trade[];
  showComments?: boolean;
}

export function JournalEntryContent({ entry, linkedTrades = [], showComments = false }: JournalEntryContentProps) {
  const { user } = useAuth();
  const [previewImageKey, setPreviewImageKey] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Reviews State
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Fetch reviews when sidebar is opened
  useEffect(() => {
    if (showComments && entry.id) {
      // eslint-disable-next-line
      setIsLoadingReviews(true);
      getReviewsForJournalEntry(entry.id)
        .then(data => {
          setReviews(data);
          
          // Mark unread reviews as read if I am the recipient (Mentee)
          if (user) {
             const unread = data.filter(r => !r.isRead && r.menteeId === user.id);
             if (unread.length > 0) {
                 Promise.all(unread.map(r => markReviewAsRead(r.id)))
                   .catch(err => console.error('Error marking reviews as read:', err));
             }
          }
        })
        .catch(err => console.error('Error fetching reviews:', err))
        .finally(() => setIsLoadingReviews(false));
    }
  }, [showComments, entry.id, user]);

  // Group reviews
  const corrections = reviews.filter(r => r.reviewType === 'correction');
  const suggestions = reviews.filter(r => r.reviewType === 'suggestion');
  const comments = reviews.filter(r => r.reviewType === 'comment');

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

  // Parse images and ensure all URLs are complete
  const images: Record<string, string[]> = {};
  if (entry.images && Array.isArray(entry.images)) {
    const sortedImages = [...entry.images].sort((a, b) => a.displayOrder - b.displayOrder);
    sortedImages.forEach(img => {
      if (!images[img.timeframe]) images[img.timeframe] = [];
      // Ensure URL is complete with Supabase storage base and cache buster
      images[img.timeframe].push(ensureFreshImageUrl(img.url));
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

  // Parse notes for Left Side (User Self-Review)
  const parsedNotes = entry.notes ? JSON.parse(entry.notes) : {};

  // ... (keep images logic)

  // ... (keep lightbox logic)

  return (
    <>
      <div className={`grid gap-6 transition-all duration-300 ease-in-out ${showComments ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Left Side: Journal Content */}
        {/* ... (keep existing Left Side content exactly as is) ... */}
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-zorin-ice">{entry.title}</h2>
              <div className="text-gray-400 text-sm mt-1">
                {(() => {
                  // entry.date é apenas YYYY-MM-DD sem hora
                  // Adiciona T12:00 para evitar shift de timezone ao converter para NY
                  const dateStr = entry.date.includes('T') ? entry.date : `${entry.date}T12:00`;
                  return formatTz(toZonedTime(dateStr, 'America/New_York'), 'dd/MM/yyyy', { timeZone: 'America/New_York' });
                })()} • {linkedTrades[0]?.symbol || entry.asset || 'Diário'}
              </div>
            </div>
          </div>

          {/* Trades Info */}
          <GlassCard className="p-4 bg-[#1b292b]/60 backdrop-blur-md border border-[#00c853]/50 shadow-[0_0_15px_rgba(0,200,83,0.15)] hover:shadow-[0_0_20px_rgba(0,200,83,0.2)] transition-shadow duration-300">
            <h3 className="text-zorin-accent text-sm font-medium mb-2">
              Trades Vinculados {linkedTrades.length > 0 && <span className="text-white/60">({linkedTrades.length})</span>}
            </h3>
            {linkedTrades.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {linkedTrades.map((trade) => (
                  <GlassCard key={trade.id} className="p-2 flex items-center flex-wrap gap-1 text-sm bg-zorin-bg/50 border-white/5">
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
                      <span className={`text-xs font-bold ${trade.pnl > 0 ? 'text-zorin-accent' : 'text-red-400'}`}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    )}
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Nenhum trade vinculado a esta entrada.</p>
            )}
          </GlassCard>

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeframes.map(tf => {
              const tfImages = images[tf.key] || [];
              return (
                <GlassCard key={tf.key} className="aspect-video relative group p-0 overflow-hidden bg-zorin-bg/50 border-gray-700">
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
                </GlassCard>
              );
            })}
          </div>

          {/* Analysis & Emotion */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <span>🧠</span> Estado Emocional
              </h3>
              <GlassCard className="p-3 bg-zorin-bg/50 border-white/10 text-gray-200">
                {entry.emotion || <span className="text-gray-500 italic">Não informado</span>}
              </GlassCard>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <span>🔍</span> Análise
              </h3>
              <GlassCard className="p-4 bg-zorin-bg/50 border-white/10 text-gray-200 whitespace-pre-wrap min-h-[120px]">
                {entry.analysis || <span className="text-gray-500 italic">Sem análise registrada</span>}
              </GlassCard>
            </div>
          </div>

          {/* User Self-Review Section */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <span>📝</span> Auto-Review
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                 <h4 className="text-xs font-bold text-zorin-accent uppercase tracking-wider">Acertos Técnicos</h4>
                 <GlassCard className="p-3 bg-zorin-bg/50 border-white/10 text-gray-200 text-sm whitespace-pre-wrap">
                    {parsedNotes.technicalWins || <span className="text-gray-500 italic">Não preenchido</span>}
                 </GlassCard>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Pontos a Melhorar</h4>
                 <GlassCard className="p-3 bg-zorin-bg/50 border-white/10 text-gray-200 text-sm whitespace-pre-wrap">
                    {parsedNotes.improvements || <span className="text-gray-500 italic">Não preenchido</span>}
                 </GlassCard>
              </div>
              <div className="space-y-2">
                 <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Erros/Indisciplina</h4>
                 <GlassCard className="p-3 bg-zorin-bg/50 border-white/10 text-gray-200 text-sm whitespace-pre-wrap">
                    {parsedNotes.errors || <span className="text-gray-500 italic">Não preenchido</span>}
                 </GlassCard>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Mentor Review */}
        {showComments && (
          <div id="mentor-review-section" className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in border-l border-gray-800 pl-6 h-full">
             <GlassCard className="p-6 bg-zorin-bg/30 border-white/5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                    <span>💬</span> Comentários do Mentor
                 </h3>
                 <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                   Feedback
                 </span>
              </div>
              
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {isLoadingReviews ? (
                    <div className="flex justify-center py-8">
                        <span className="text-purple-400 animate-pulse">Carregando comentários...</span>
                    </div>
                ) : (
                    <>
                        {/* Win / Comments Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider border-b border-green-500/20 pb-1">
                                Comentários / Acertos
                            </h4>
                            <div className="space-y-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10 min-h-[80px]">
                                {comments.length > 0 ? (
                                    comments.map(review => (
                                        <div key={review.id} className="text-sm text-gray-300 border-b border-green-500/10 last:border-0 pb-2 last:pb-0">
                                            <div className="text-[10px] text-green-500/70 mb-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                                            {review.content}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-500 italic">Sem comentários registrados.</span>
                                )}
                            </div>
                        </div>

                        {/* Suggestions Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider border-b border-yellow-500/20 pb-1">
                                Pontos de Melhora / Sugestões
                            </h4>
                            <div className="space-y-3 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 min-h-[80px]">
                                {suggestions.length > 0 ? (
                                    suggestions.map(review => (
                                        <div key={review.id} className="text-sm text-gray-300 border-b border-yellow-500/10 last:border-0 pb-2 last:pb-0">
                                            <div className="text-[10px] text-yellow-500/70 mb-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                                            {review.content}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-500 italic">Sem sugestões registradas.</span>
                                )}
                            </div>
                        </div>

                        {/* Corrections Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-red-500/20 pb-1">
                                Erros / Correções
                            </h4>
                           <div className="space-y-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10 min-h-[80px]">
                                {corrections.length > 0 ? (
                                    corrections.map(review => (
                                        <div key={review.id} className="text-sm text-gray-300 border-b border-red-500/10 last:border-0 pb-2 last:pb-0">
                                            <div className="text-[10px] text-red-500/70 mb-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                                            {review.content}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-500 italic">Sem correções registradas.</span>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-8 pt-4 border-t border-gray-800">
                    <p className="text-xs text-center text-gray-500 italic">
                        Este é o espaço onde o seu mentor revisa sua performance.
                    </p>
                </div>
                </div>
              </GlassCard>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {previewImageKey && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
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
}
