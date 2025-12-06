'use client';

import { memo } from 'react';
import type { Trade, JournalEntry } from '@/types';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';


interface DayTradesTableProps {
  trades: Trade[];
  standaloneEntries: JournalEntry[];
  onDeleteTrade: (tradeId: string) => void;
  onJournalClick: (trade: Trade) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  getEntryByTradeId: (tradeId: string) => JournalEntry | undefined;
  onNewEntry: () => void;
}

/**
 * Component for displaying trades and journal entries table
 * Shows standalone entries and trades with action buttons
 * Memoized to prevent unnecessary re-renders
 */
const DayTradesTableComponent = ({
  trades,
  standaloneEntries,
  onDeleteTrade,
  onJournalClick,
  onEditEntry,
  onDeleteEntry,
  getEntryByTradeId,
  onNewEntry,
}: DayTradesTableProps) => {
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-3 text-center w-24">
              <div className="flex items-center justify-center gap-2">
                <span>DIÁRIO</span>
                <button
                  onClick={onNewEntry}
                  className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  title="Novo Diário"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </th>
            <th className="px-4 py-3 text-center">AÇÕES</th>
            <th className="px-4 py-3 text-center">TIPO</th>
            <th className="px-4 py-3 text-center">P/L</th>
            <th className="px-4 py-3 text-center">SÍMBOLO</th>
            <th className="px-4 py-3 text-center">VOLUME</th>
            <th className="px-4 py-3 text-center">DURAÇÃO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {/* Standalone Entries */}
          {standaloneEntries.map((entry) => (
            <tr
              key={entry.id}
              className="hover:bg-gray-800/30 transition-colors group"
            >
              <td className="px-4 py-3 text-center">
                <Button
                  variant="success"
                  size="icon"
                  onClick={() => onEditEntry(entry)}
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
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="gold"
                    size="icon"
                    onClick={() => onEditEntry(entry)}
                    className="w-8 h-8"
                    title="Editar"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="w-8 h-8"
                    title="Excluir"
                  >
                    🗑️
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-500">
                    #{entry.id.slice(0, 13)}
                  </span>
                  <span className="text-xs font-bold text-gray-300">
                    Diário
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-500">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-300 font-medium">
                <span className="font-bold text-gray-200 bg-gray-700/50 px-2 py-1 rounded">
                  {entry.asset || 'Diário'}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-gray-400">-</td>
              <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">
                -
              </td>
            </tr>
          ))}

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

            return (
              <tr
                key={trade.id}
                className="hover:bg-gray-800/30 transition-colors group"
              >
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="success"
                    size="icon"
                    onClick={() => onJournalClick(trade)}
                    className="w-8 h-8 mx-auto"
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
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    )}
                  </Button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="gold"
                      size="icon"
                      onClick={() => onJournalClick(trade)}
                      className="w-8 h-8"
                      title="Editar Diário"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      onClick={() => onDeleteTrade(trade.id)}
                      className="w-8 h-8"
                      title="Excluir"
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500">
                      #{trade.id.slice(0, 13)}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        trade.type === "Long"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      1 {trade.type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-bold">
                  <span
                    className={
                      trade.pnl && trade.pnl >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {formatCurrency(trade.pnl || 0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-300 font-medium">
                  <span className="font-bold text-gray-200 bg-gray-700/50 px-2 py-1 rounded">
                    {trade.symbol}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {trade.lot}
                </td>
                <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">
                  {duration}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const DayTradesTable = memo(DayTradesTableComponent);
