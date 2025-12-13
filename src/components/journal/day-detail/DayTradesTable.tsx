'use client';

import { memo, useState, useEffect } from 'react';
import type { Trade, JournalEntry } from '@/types';
import { Button, GlassCard } from '@/components/ui';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';


interface DayTradesTableProps {
  trades: Trade[];
  standaloneEntries: JournalEntry[];
  onDeleteTrade: (tradeId: string) => void;
  onEditTrade?: (trade: Trade) => void;
  onJournalClick: (trade: Trade, startEditing?: boolean) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onPreviewEntry?: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  getEntryByTradeId: (tradeId: string) => JournalEntry | undefined;
  onNewEntry: () => void;
  hasMentor?: boolean;
  reviewsMap?: Record<string, { hasUnread: boolean; count: number }>;
}

/**
 * Component for displaying trades and journal entries table
 * Shows standalone entries and trades with action buttons
 * Memoized to prevent unnecessary re-renders
 * 
 * Mobile UX: Horizontal scroll enabled with visual indicators
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
}: DayTradesTableProps) => {
  // Scroll hint disappears after 3 seconds
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowScrollHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlassCard className="relative p-0 bg-zorin-bg/30 border-white/5">
      {/* Horizontal scroll wrapper for mobile */}
      <div 
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity',
        }}
        role="region"
        aria-label="Tabela de trades com scroll horizontal"
        tabIndex={0}
      >
        <table className="w-full min-w-[700px]">
        <thead>
          <tr className="bg-zorin-surface/50 text-xs text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-3 text-center w-24">
              <div className="flex items-center justify-center gap-2">
                <span>DIÁRIO</span>
                <Button
                  variant="gradient-success"
                  size="icon"
                  onClick={onNewEntry}
                  className="w-5 h-5 rounded flex items-center justify-center shadow-[0_0_10px_rgba(0,200,83,0.3)] bg-zorin-accent hover:bg-zorin-accent-hover text-white border-0"
                  title="Novo Diário"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Button>
              </div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap">AÇÕES</th>
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
            <tr
              key={entry.id}
              className="hover:bg-zorin-surface/50 transition-colors group"
            >
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <div className="relative inline-block">
                  <Button
                    variant="zorin-success"
                    size="icon"
                    onClick={() => onPreviewEntry ? onPreviewEntry(entry) : onEditEntry(entry)}
                    className="w-8 h-8 mx-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </Button>
                  {hasMentor && reviewStatus?.hasUnread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 pointer-events-none" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="zorin-warning"
                    size="icon"
                    onClick={() => onEditEntry(entry)}
                    className="w-8 h-8"
                    title="Editar"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="zorin-danger"
                    size="icon"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="w-8 h-8"
                    title="Excluir"
                  >
                    🗑️
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-500">
                    #{entry.id.slice(0, 13)}
                  </span>
                  <span className="text-xs font-bold text-gray-300">
                    Diário
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-500 whitespace-nowrap">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-300 font-medium whitespace-nowrap">
                <span className="font-bold text-gray-200 bg-zorin-surface px-2 py-1 rounded">
                  {entry.asset || 'Diário'}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-gray-400 whitespace-nowrap">-</td>
              <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs whitespace-nowrap">
                -
              </td>
            </tr>
          );})}

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

            const journalEntry = getEntryByTradeId(trade.id);
            const reviewStatus = reviewsMap[trade.id] || (journalEntry ? reviewsMap[journalEntry.id] : undefined);

            return (
              <tr
                key={trade.id}
                className="hover:bg-zorin-surface/50 transition-colors group"
              >
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="relative inline-block">
                    <Button
                      variant={journalEntry ? "zorin-success" : "zorin-ghost"}
                      size="icon"
                      onClick={() => onJournalClick(trade, !journalEntry)}
                      className={`w-8 h-8 mx-auto ${!journalEntry ? 'opacity-40 border border-gray-600 hover:opacity-70' : ''}`}
                      title={journalEntry ? "Ver Diário" : "Criar Diário"}
                    >
                      {journalEntry ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-500"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      )}
                    </Button>
                    {hasMentor && reviewStatus?.hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 pointer-events-none" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    {/* Edit Trade Button */}
                    <Button
                      variant="zorin-warning"
                      size="icon"
                      onClick={() => onEditTrade?.(trade)}
                      className={`w-8 h-8 ${!onEditTrade ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Editar Trade"
                      disabled={!onEditTrade}
                    >
                      ✏️
                    </Button>
                    {/* Delete Trade Button */}
                    <Button
                      variant="zorin-danger"
                      size="icon"
                      onClick={() => onDeleteTrade(trade.id)}
                      className="w-8 h-8"
                      title="Excluir Trade"
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500">
                      #{trade.id.slice(0, 13)}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                        trade.type === "Long"
                          ? "bg-zorin-accent/20 text-zorin-accent"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      <span>{trade.type}</span>
                      {trade.type === "Long" ? (
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
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-bold whitespace-nowrap">
                  <span
                    className={
                      trade.pnl && trade.pnl >= 0
                        ? "text-zorin-accent"
                        : "text-red-400"
                    }
                  >
                    {formatCurrency(trade.pnl || 0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-300 font-medium whitespace-nowrap">
                  <span className="font-bold text-gray-200 bg-zorin-surface px-2 py-1 rounded">
                    {trade.symbol}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400 whitespace-nowrap">
                  {trade.lot}
                </td>
                <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs whitespace-nowrap">
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
        className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none 
                   bg-gradient-to-l from-zorin-bg/80 to-transparent 
                   md:hidden transition-opacity"
        aria-hidden="true"
      />
      
      {/* Scroll hint - disappears after 3 seconds */}
      {showScrollHint && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 animate-pulse md:hidden pointer-events-none flex items-center gap-1">
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
