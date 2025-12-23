import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui";
import { formatCurrency } from "@/lib/calculations";
import type { Trade, JournalEntry } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { getReviewsForJournalEntryAction, markReviewAsReadAction } from "@/app/actions/reviews";
import type { MentorReview } from "@/types";
import { getCachedImageUrl } from "@/lib/utils/general";
import { ImagePreviewLightbox, type ImageItem } from "@/components/shared/ImagePreviewLightbox";
import dayjs from "dayjs";

// Extended interface for Optimistic UI
interface ExtendedJournalEntry extends JournalEntry {
  _isPending?: boolean;
  _optimisticImages?: Record<string, string[]>;
}

interface JournalEntryContentProps {
  entry: JournalEntry | ExtendedJournalEntry;
  linkedTrades?: Trade[];
  showComments?: boolean;
}

export function JournalEntryContent({
  entry,
  linkedTrades = [],
  showComments = false,
}: JournalEntryContentProps) {
  const { user } = useAuth();

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isPending = (entry as ExtendedJournalEntry)._isPending;
  const optimisticImages = (entry as ExtendedJournalEntry)._optimisticImages;

  // Reviews State
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Fetch reviews when sidebar is opened
  useEffect(() => {
    if (showComments && entry.id && !isPending) {
      // eslint-disable-next-line
      setIsLoadingReviews(true);
      getReviewsForJournalEntryAction(entry.id)
        .then((data) => {
          setReviews(data);

          // Mark unread reviews as read if I am the recipient (Mentee)
          if (user) {
            const unread = data.filter((r) => !r.isRead && r.menteeId === user.id);
            if (unread.length > 0) {
              Promise.all(unread.map((r) => markReviewAsReadAction(r.id))).catch((err) =>
                console.error("Error marking reviews as read:", err)
              );
            }
          }
        })
        .catch((err) => console.error("Error fetching reviews:", err))
        .finally(() => setIsLoadingReviews(false));
    }
  }, [showComments, entry.id, user, isPending]);

  // Group reviews
  const corrections = reviews.filter((r) => r.reviewType === "correction");
  const suggestions = reviews.filter((r) => r.reviewType === "suggestion");
  const comments = reviews.filter((r) => r.reviewType === "comment");

  // Timeframes configuration
  const timeframes = [
    { key: "tfM", label: "Mensal" },
    { key: "tfW", label: "Semanal" },
    { key: "tfD", label: "Diário" },
    { key: "tfH4", label: "4H" },
    { key: "tfH1", label: "1H" },
    { key: "tfM15", label: "M15" },
    { key: "tfM5", label: "M5" },
    { key: "tfM3", label: "M3/M1" },
  ] as const;

  // Parse images and ensure all URLs are complete
  const images: Record<string, string[]> = {};

  if (optimisticImages) {
    // OPTIMISTIC PREVIEW: Use local base64 images
    Object.assign(images, optimisticImages);
  } else if (entry.images && Array.isArray(entry.images)) {
    // STANDARD VIEW: Use server images
    const sortedImages = [...entry.images].sort((a, b) => a.displayOrder - b.displayOrder);
    sortedImages.forEach((img) => {
      if (!images[img.timeframe]) images[img.timeframe] = [];
      // Ensure URL is complete with Supabase storage base and cache buster
      images[img.timeframe].push(getCachedImageUrl(img.url));
    });
  }

  // Flatten images for lightbox
  // We need to keep track of the original structure to map clicks correctly,
  // but for the lightbox we just need a flat list of ImageItems
  const allImagesFlat: (ImageItem & { key: string; index: number })[] = timeframes.flatMap((tf) => {
    const imgs = (images[tf.key] || []) as string[];
    return imgs.map((url, idx) => ({
      url,
      label: tf.label,
      key: tf.key, // helper to identify image source
      index: idx, // helper to identify image index within timeframe
    }));
  });

  const handleImageClick = (key: string, index: number) => {
    const flatIndex = allImagesFlat.findIndex((img) => img.key === key && img.index === index);
    if (flatIndex !== -1) {
      setLightboxIndex(flatIndex);
    }
  };

  // Parse notes for Left Side (User Self-Review)
  const parsedNotes = entry.notes ? JSON.parse(entry.notes) : {};

  return (
    <>
      <div
        className={`grid gap-6 transition-all duration-300 ease-in-out ${showComments ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Left Side: Journal Content */}
        <div className="space-y-6">
          {/* Trades Info */}
          <GlassCard className="border border-[#00c853]/50 bg-[#1b292b]/60 p-4 shadow-[0_0_15px_rgba(0,200,83,0.15)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(0,200,83,0.2)]">
            <h3 className="text-zorin-accent mb-2 text-sm font-medium">
              Trades Vinculados{" "}
              {linkedTrades.length > 0 && (
                <span className="text-white/60">({linkedTrades.length})</span>
              )}
            </h3>
            {linkedTrades.length > 0 ? (
              <div className="max-h-[150px] space-y-2 overflow-y-auto">
                {linkedTrades.map((trade) => (
                  <GlassCard
                    key={trade.id}
                    className="bg-zorin-bg/50 flex flex-wrap items-center gap-1 border-white/5 p-2 text-sm"
                  >
                    <span className="text-gray-400">
                      {dayjs(trade.entryDate).format("DD/MM")} {trade.entryTime?.substring(0, 5)}
                    </span>
                    <span className="font-medium text-gray-200">{trade.symbol}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                        trade.type === "Long"
                          ? "bg-zorin-accent/20 text-zorin-accent"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {trade.type}
                      {trade.type === "Long" ? (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                          <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                      ) : (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                          <polyline points="17 18 23 18 23 12"></polyline>
                        </svg>
                      )}
                    </span>
                    {trade.pnl !== undefined && (
                      <span
                        className={`text-xs font-bold ${trade.pnl > 0 ? "text-zorin-accent" : "text-red-400"}`}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                    )}
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhum trade vinculado a esta entrada.</p>
            )}
          </GlassCard>

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {timeframes.map((tf) => {
              const tfImages = images[tf.key] || [];
              return (
                <GlassCard
                  key={tf.key}
                  className="group bg-zorin-bg/50 relative aspect-video overflow-hidden border-gray-700 p-0"
                >
                  <div className="absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                    {tf.label} {tfImages.length > 1 && `(${tfImages.length})`}
                  </div>
                  {tfImages.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tfImages[0]}
                      alt={tf.label}
                      className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
                      onClick={() => handleImageClick(tf.key, 0)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-900/30">
                      <span className="text-2xl font-bold text-gray-700 opacity-20 select-none">
                        {tf.label}
                      </span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>

          {/* Analysis & Emotion */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <span>🧠</span> Estado Emocional
              </h3>
              <GlassCard className="bg-zorin-bg/50 border-white/10 p-3 text-gray-200">
                {entry.emotion || <span className="text-gray-500 italic">Não informado</span>}
              </GlassCard>
            </div>
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <span>🔍</span> Análise
              </h3>
              <GlassCard className="bg-zorin-bg/50 min-h-[120px] border-white/10 p-4 whitespace-pre-wrap text-gray-200">
                {entry.analysis || (
                  <span className="text-gray-500 italic">Sem análise registrada</span>
                )}
              </GlassCard>
            </div>
          </div>

          {/* User Self-Review Section */}
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <span>📝</span> Auto-Review
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="text-zorin-accent text-xs font-bold tracking-wider uppercase">
                  Acertos Técnicos
                </h4>
                <GlassCard className="bg-zorin-bg/50 border-white/10 p-3 text-sm whitespace-pre-wrap text-gray-200">
                  {parsedNotes.technicalWins || (
                    <span className="text-gray-500 italic">Não preenchido</span>
                  )}
                </GlassCard>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold tracking-wider text-yellow-400 uppercase">
                  Pontos a Melhorar
                </h4>
                <GlassCard className="bg-zorin-bg/50 border-white/10 p-3 text-sm whitespace-pre-wrap text-gray-200">
                  {parsedNotes.improvements || (
                    <span className="text-gray-500 italic">Não preenchido</span>
                  )}
                </GlassCard>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold tracking-wider text-red-400 uppercase">
                  Erros/Indisciplina
                </h4>
                <GlassCard className="bg-zorin-bg/50 border-white/10 p-3 text-sm whitespace-pre-wrap text-gray-200">
                  {parsedNotes.errors || (
                    <span className="text-gray-500 italic">Não preenchido</span>
                  )}
                </GlassCard>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Mentor Review */}
        {showComments && (
          <div
            id="mentor-review-section"
            className="animate-in slide-in-from-right-4 fade-in h-full space-y-6 border-l border-gray-800 pl-6 duration-500"
          >
            <GlassCard className="bg-zorin-bg/30 flex h-full flex-col border-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-purple-400">
                  <span>💬</span> Comentários do Mentor
                </h3>
                <span className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                  Feedback
                </span>
              </div>

              <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2">
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <span className="animate-pulse text-purple-400">Carregando comentários...</span>
                  </div>
                ) : (
                  <>
                    {/* Win / Comments Section */}
                    <div className="space-y-2">
                      <h4 className="border-b border-green-500/20 pb-1 text-sm font-bold tracking-wider text-green-400 uppercase">
                        Comentários / Acertos
                      </h4>
                      <div className="min-h-[80px] space-y-3 rounded-lg border border-green-500/10 bg-green-500/5 p-3">
                        {comments.length > 0 ? (
                          comments.map((review) => (
                            <div
                              key={review.id}
                              className="border-b border-green-500/10 pb-2 text-sm text-gray-300 last:border-0 last:pb-0"
                            >
                              <div className="mb-1 text-[10px] text-green-500/70">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
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
                      <h4 className="border-b border-yellow-500/20 pb-1 text-sm font-bold tracking-wider text-yellow-400 uppercase">
                        Pontos de Melhora / Sugestões
                      </h4>
                      <div className="min-h-[80px] space-y-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-3">
                        {suggestions.length > 0 ? (
                          suggestions.map((review) => (
                            <div
                              key={review.id}
                              className="border-b border-yellow-500/10 pb-2 text-sm text-gray-300 last:border-0 last:pb-0"
                            >
                              <div className="mb-1 text-[10px] text-yellow-500/70">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
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
                      <h4 className="border-b border-red-500/20 pb-1 text-sm font-bold tracking-wider text-red-400 uppercase">
                        Erros / Correções
                      </h4>
                      <div className="min-h-[80px] space-y-3 rounded-lg border border-red-500/10 bg-red-500/5 p-3">
                        {corrections.length > 0 ? (
                          corrections.map((review) => (
                            <div
                              key={review.id}
                              className="border-b border-red-500/10 pb-2 text-sm text-gray-300 last:border-0 last:pb-0"
                            >
                              <div className="mb-1 text-[10px] text-red-500/70">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
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

                <div className="mt-8 border-t border-gray-800 pt-4">
                  <p className="text-center text-xs text-gray-500 italic">
                    Este é o espaço onde o seu mentor revisa sua performance.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Shared Image Preview Lightbox */}
      {lightboxIndex !== null && (
        <ImagePreviewLightbox
          images={allImagesFlat}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
