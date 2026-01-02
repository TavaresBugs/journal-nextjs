"use client";

import { memo, useState, useEffect } from "react";
import type { Trade, JournalEntry } from "@/types";
import { Button, GlassCard, IconActionButton, AssetBadge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/trading";
import { getCachedImageUrl } from "@/lib/utils/general";
import dayjs from "dayjs";

/**
 * Preloads images in background so they're cached when user opens the preview.
 * Same effect as Recap's visible thumbnails, but invisible.
 */
function useImagePreloader(entries: JournalEntry[]) {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    entries.forEach((entry) => {
      if (entry.images && Array.isArray(entry.images)) {
        // Group by timeframe and get first image of each
        const byTimeframe: Record<string, string> = {};
        entry.images.forEach((img) => {
          if (!byTimeframe[img.timeframe]) {
            byTimeframe[img.timeframe] = getCachedImageUrl(img.url);
          }
        });
        imagesToPreload.push(...Object.values(byTimeframe));
      }
    });

    // Preload all images in background
    imagesToPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [entries]);
}

interface DayTradesTableProps {
  trades: Trade[];
  standaloneEntries: JournalEntry[];
  onDeleteTrade?: (tradeId: string) => void;
  onEditTrade?: (trade: Trade) => void;
  onJournalClick?: (trade: Trade, startEditing?: boolean) => void;
  onEditEntry?: (entry: JournalEntry) => void;
  onPreviewEntry?: (entry: JournalEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
  getEntryByTradeId?: (tradeId: string) => JournalEntry | undefined;
  onNewEntry?: () => void;
  hasMentor?: boolean;
  reviewsMap?: Record<string, { hasUnread: boolean; count: number }>;
  /** Read-only mode - hides action buttons (for mentor view) */
  readOnly?: boolean;
}

/**
 * Component for displaying trades and journal entries table
 * Shows standalone entries and trades with action buttons
 * Memoized to prevent unnecessary re-renders
 *
 * Mobile UX: Horizontal scroll enabled with visual indicators
 * @param readOnly - If true, hides action buttons (for mentor view)
 */
const DayTradesTableComponent = ({
  trades,
  standaloneEntries,
  onDeleteTrade,
  onEditTrade,
  onJournalClick,
  onEditEntry,
  onPreviewEntry,
  onDeleteEntry,
  getEntryByTradeId,
  onNewEntry,
  hasMentor = false,
  reviewsMap = {},
  readOnly = false,
}: DayTradesTableProps) => {
  // Scroll hint disappears after 3 seconds
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Collect all journal entries (standalone + trade-linked) for image preloading
  const allEntries = [
    ...standaloneEntries,
    ...trades.map((t) => getEntryByTradeId?.(t.id)).filter((e): e is JournalEntry => !!e),
  ];

  // Preload images in background (same effect as Recap's visible thumbnails)
  useImagePreloader(allEntries);

  useEffect(() => {
    const timer = setTimeout(() => setShowScrollHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlassCard className="bg-zorin-bg/30 relative border-white/5 p-0">
      {/* Horizontal scroll wrapper for mobile */}
      <div
        className="scrollbar-thin scrollbar-thumb-gray-600 overflow-x-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x proximity",
        }}
        role="region"
        aria-label="Tabela de trades com scroll horizontal"
        tabIndex={0}
      >
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-zorin-surface/50 text-xs tracking-wider text-gray-400 uppercase">
              <th className="w-24 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>DIÁRIO</span>
                  {!readOnly && onNewEntry && (
                    <Button
                      variant="gradient-success"
                      size="icon"
                      onClick={onNewEntry}
                      className="bg-zorin-accent hover:bg-zorin-accent-hover flex h-5 w-5 items-center justify-center rounded border-0 text-white shadow-[0_0_10px_rgba(0,200,83,0.3)]"
                      title="Novo Diário"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Button>
                  )}
                </div>
              </th>
              {!readOnly && <th className="px-4 py-3 text-center whitespace-nowrap">AÇÕES</th>}
              <th className="px-4 py-3 text-center whitespace-nowrap">TIPO</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">P/L</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">SÍMBOLO</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">VOLUME</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">DURAÇÃO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {/* Standalone Entries */}
            {standaloneEntries.map((entry) => {
              const reviewStatus = reviewsMap[entry.id];
              return (
                <tr key={entry.id} className="hover:bg-zorin-surface/50 group transition-colors">
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="relative inline-block">
                      <IconActionButton
                        variant="journal"
                        size="md"
                        onClick={() => onPreviewEntry?.(entry)}
                        title="Ver Diário"
                      />
                      {hasMentor && reviewStatus?.hasUnread && (
                        <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-red-500" />
                      )}
                    </div>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <IconActionButton
                          variant="edit"
                          size="md"
                          onClick={() => onEditEntry?.(entry)}
                          title="Editar"
                        />
                        <IconActionButton
                          variant="delete"
                          size="md"
                          onClick={() => onDeleteEntry?.(entry.id)}
                          title="Excluir"
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500">#{entry.id.slice(0, 13)}</span>
                      <span className="text-xs font-bold text-gray-300">Diário</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold whitespace-nowrap text-gray-500">
                    -
                  </td>
                  <td className="px-4 py-3 text-center font-medium whitespace-nowrap text-gray-300">
                    <div className="flex justify-center">
                      <AssetBadge symbol={entry.asset || "Diário"} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap text-gray-400">-</td>
                  <td className="px-4 py-3 text-center font-mono text-xs whitespace-nowrap text-gray-400">
                    -
                  </td>
                </tr>
              );
            })}

            {/* Trades */}
            {trades.map((trade) => {
              // Calculate duration if exitDate exists
              let duration = "-";
              if (trade.entryDate && trade.exitDate) {
                // Combine date and time for accurate calculation
                const entryDateTime = trade.entryTime
                  ? `${trade.entryDate} ${trade.entryTime}`
                  : trade.entryDate;
                const exitDateTime = trade.exitTime
                  ? `${trade.exitDate} ${trade.exitTime}`
                  : trade.exitDate;

                const start = dayjs(entryDateTime);
                const end = dayjs(exitDateTime);
                const diffInMinutes = end.diff(start, "minute");
                const hours = Math.floor(diffInMinutes / 60);
                const minutes = diffInMinutes % 60;
                duration = `${hours.toString().padStart(2, "0")}:${minutes
                  .toString()
                  .padStart(2, "0")}:00`;
              }

              const journalEntry = getEntryByTradeId?.(trade.id);
              const reviewStatus =
                reviewsMap[trade.id] || (journalEntry ? reviewsMap[journalEntry.id] : undefined);

              return (
                <tr key={trade.id} className="hover:bg-zorin-surface/50 group transition-colors">
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="relative inline-block">
                      <IconActionButton
                        variant={journalEntry ? "journal" : "add"}
                        size="md"
                        onClick={() => onJournalClick?.(trade, !journalEntry)}
                        title={
                          journalEntry ? "Ver Diário" : readOnly ? "Sem diário" : "Criar Diário"
                        }
                        className={
                          readOnly && !journalEntry
                            ? "cursor-not-allowed opacity-20 grayscale"
                            : !journalEntry
                              ? "opacity-40 hover:opacity-70"
                              : ""
                        }
                        disabled={readOnly && !journalEntry}
                      />
                      {hasMentor && reviewStatus?.hasUnread && (
                        <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-red-500" />
                      )}
                    </div>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <IconActionButton
                          variant="edit"
                          size="md"
                          onClick={() => onEditTrade?.(trade)}
                          title="Editar Trade"
                          disabled={!onEditTrade}
                        />
                        <IconActionButton
                          variant="delete"
                          size="md"
                          onClick={() => onDeleteTrade?.(trade.id)}
                          title="Excluir Trade"
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500">#{trade.id.slice(0, 13)}</span>
                      <div
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                          trade.type === "Long"
                            ? "bg-zorin-accent/20 text-zorin-accent"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <span>{trade.type}</span>
                        {trade.type === "Long" ? (
                          <svg
                            width="12"
                            height="12"
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
                            width="12"
                            height="12"
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
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold whitespace-nowrap">
                    <span
                      className={trade.pnl && trade.pnl >= 0 ? "text-zorin-accent" : "text-red-400"}
                    >
                      {formatCurrency(trade.pnl || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium whitespace-nowrap text-gray-300">
                    <div className="flex justify-center">
                      <AssetBadge symbol={trade.symbol} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap text-gray-400">
                    {trade.lot}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs whitespace-nowrap text-gray-400">
                    {duration}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fade indicator - mobile only, suggests more content to the right */}
      <div
        className="from-zorin-bg/80 pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-linear-to-l to-transparent transition-opacity md:hidden"
        aria-hidden="true"
      />

      {/* Scroll hint - disappears after 3 seconds */}
      {showScrollHint && (
        <div className="pointer-events-none absolute right-2 bottom-2 flex animate-pulse items-center gap-1 text-xs text-gray-400 md:hidden">
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Arraste para ver mais
        </div>
      )}
    </GlassCard>
  );
};

export const DayTradesTable = memo(DayTradesTableComponent);
