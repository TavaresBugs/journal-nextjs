"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "@/components/ui";
import type { Trade, DailyRoutine, JournalEntry } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import {
  getMenteeJournalEntriesAction as getMenteeJournalEntries,
  getMenteeRoutineAction as getMenteeRoutine,
} from "@/app/actions/mentor";
import { MenteeJournalReviewModal } from "@/components/mentor/MenteeJournalReviewModal";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface MenteeDayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  menteeName: string;
  menteeId: string;
  accountId?: string;
}

// Habit icons/emojis
const HABIT_CONFIG = {
  aerobic: { emoji: "🏃", label: "Aeróbico" },
  diet: { emoji: "🥗", label: "Dieta" },
  reading: { emoji: "📚", label: "Leitura" },
  meditation: { emoji: "🧘", label: "Meditação" },
  preMarket: { emoji: "📈", label: "Pré-Market" },
  prayer: { emoji: "🙏", label: "Oração" },
};

/**
 * Modal for mentors to view a mentee's day details
 * Read-only view with habits, journal entries, and trades
 */
export function MenteeDayDetailModal({
  isOpen,
  onClose,
  date,
  trades,
  menteeName,
  menteeId,
  accountId,
}: MenteeDayDetailModalProps) {
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewEntry, setSelectedReviewEntry] = useState<JournalEntry | null>(null);
  const [selectedReviewTrade, setSelectedReviewTrade] = useState<Trade | null>(null);

  // Fetch routine and journal entries when modal opens
  useEffect(() => {
    if (isOpen && menteeId && date) {
      const fetchData = async () => {
        setLoadingExtra(true);
        try {
          const [routineData, entriesData] = await Promise.all([
            getMenteeRoutine(menteeId, date, accountId),
            getMenteeJournalEntries(menteeId, date, accountId),
          ]);
          setRoutine(routineData);
          setJournalEntries(entriesData);
        } catch (error) {
          console.error("Error fetching mentee day data:", error);
        } finally {
          setLoadingExtra(false);
        }
      };
      fetchData();
    }
  }, [isOpen, menteeId, date, accountId]);

  // Stats
  const stats = useMemo(() => {
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    return { totalPnL, wins, losses, winRate, total: trades.length };
  }, [trades]);

  // Count completed habits
  const completedHabits = useMemo(() => {
    if (!routine) return 0;
    let count = 0;
    if (routine.aerobic) count++;
    if (routine.diet) count++;
    if (routine.reading) count++;
    if (routine.meditation) count++;
    if (routine.preMarket) count++;
    if (routine.prayer) count++;
    return count;
  }, [routine]);

  const formattedDate = useMemo(() => {
    const formatted = date ? dayjs(date).format("dddd, DD/MM/YYYY") : "";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [date]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="w-full text-center">
          <h2 className="text-xl font-bold text-gray-100">📅 {formattedDate}</h2>
          <p className="mt-1 text-sm text-gray-400">Trades e Diário de {menteeName}</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Habits Row */}
        {routine && (
          <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">Rotina Matinal</h3>
              <span className="text-xs text-gray-500">{completedHabits}/6 concluídos</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(HABIT_CONFIG).map(([key, config]) => {
                const isCompleted = routine[key as keyof typeof HABIT_CONFIG];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      isCompleted
                        ? "border-green-500/40 bg-green-900/30"
                        : "border-gray-700 bg-gray-800/50 opacity-50"
                    }`}
                    title={config.label}
                  >
                    <span className="text-xl">{config.emoji}</span>
                    <span className={`text-xs ${isCompleted ? "text-green-400" : "text-gray-500"}`}>
                      {config.label}
                    </span>
                    {isCompleted && <span className="text-xs text-green-400">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!routine && !loadingExtra && (
          <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4 text-center text-sm text-gray-500">
            Nenhuma rotina registrada neste dia.
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Trades</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
            <div className="text-xs text-gray-400">Ganhos</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-xs text-gray-400">Perdas</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
            <div
              className={`text-2xl font-bold ${stats.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {stats.totalPnL >= 0 ? "+" : ""}
              {formatCurrency(stats.totalPnL)}
            </div>
            <div className="text-xs text-gray-400">P&L Total</div>
          </div>
        </div>

        {trades.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <span className="text-yellow-400">📊</span> Trades
            </h3>
            {trades.map((trade) => {
              // Find matching journal entry by tradeIds OR symbol/asset
              const linkedEntry = journalEntries.find(
                (e) => e.tradeIds?.includes(trade.id) || e.asset === trade.symbol
              );

              return (
                <div
                  key={trade.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                    trade.outcome === "win"
                      ? "border-green-500/30 bg-green-900/20"
                      : trade.outcome === "loss"
                        ? "border-red-500/30 bg-red-900/20"
                        : "border-gray-700 bg-gray-800/50"
                  }`}
                >
                  {/* LEFT COLUMN: Info & Details */}
                  <div className="flex flex-1 flex-col gap-3">
                    {/* Symbol & Outcome */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{trade.symbol}</span>
                      {trade.outcome && (
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            trade.outcome === "win"
                              ? "bg-green-500/30 text-green-300"
                              : trade.outcome === "loss"
                                ? "bg-red-500/30 text-red-300"
                                : "bg-gray-500/30 text-gray-300"
                          }`}
                        >
                          {trade.outcome === "win"
                            ? "WIN"
                            : trade.outcome === "loss"
                              ? "LOSS"
                              : "B/E"}
                        </span>
                      )}
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span>
                        <span className="text-gray-500">Entrada:</span>{" "}
                        <span className="text-gray-300">{trade.entryPrice?.toFixed(2)}</span>
                      </span>
                      <span>
                        <span className="text-gray-500">Saída:</span>{" "}
                        <span className="text-gray-300">{trade.exitPrice?.toFixed(2) || "-"}</span>
                      </span>
                      <span>
                        <span className="text-gray-500">Lote:</span>{" "}
                        <span className="text-gray-300">{trade.lot}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          <span className="text-gray-500">Hora:</span>{" "}
                          <span className="text-gray-300">{trade.entryTime || "-"}</span>
                        </span>

                        {/* Type Tag with Icon */}
                        <div
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            trade.type === "Long"
                              ? "bg-green-500/20 text-green-400"
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

                      {trade.strategy && (
                        <span>
                          <span className="text-gray-500">Estratégia:</span>{" "}
                          <span className="text-cyan-400">{trade.strategy}</span>
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {trade.notes && (
                      <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3 text-sm text-gray-300">
                        <span className="mb-1 block text-xs text-gray-500">Notas:</span>
                        {trade.notes}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: PnL & Button (Centered Vertically) */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 items-center text-lg font-bold ${
                        (trade.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {(trade.pnl || 0) >= 0 ? "+" : ""}
                      {formatCurrency(trade.pnl || 0)}
                    </div>

                    {/* Journal Button */}
                    <button
                      disabled={!linkedEntry}
                      onClick={() => {
                        if (linkedEntry) {
                          setSelectedReviewEntry(linkedEntry);
                          setSelectedReviewTrade(trade);
                          setReviewModalOpen(true);
                        }
                      }}
                      title={linkedEntry ? "Ver/Avaliar Diário" : "Sem diário vinculado"}
                      className={`flex h-8 w-8 items-center justify-center rounded-[8px] border transition-all ${
                        linkedEntry
                          ? "cursor-pointer border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:bg-cyan-500/30"
                          : "cursor-not-allowed border-gray-700/50 bg-gray-800/20 text-gray-600"
                      }`}
                    >
                      <span className="text-[16px]">📖</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {trades.length === 0 && journalEntries.length === 0 && !routine && (
          <div className="py-8 text-center text-gray-400">
            Nenhuma atividade registrada neste dia.
          </div>
        )}

        {/* Close Button */}
        <Button variant="gradient-danger" onClick={onClose} className="w-full py-3 font-bold">
          Fechar
        </Button>
      </div>

      {selectedReviewEntry && (
        <MenteeJournalReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedReviewEntry(null);
            setSelectedReviewTrade(null);
          }}
          entry={selectedReviewEntry}
          trade={selectedReviewTrade}
          menteeId={menteeId}
        />
      )}
    </Modal>
  );
}
