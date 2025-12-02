"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui";
import type { Trade, DailyRoutine, JournalEntry } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { formatCurrency } from "@/lib/calculations";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  accountId: string;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
}

export function DayDetailModal({
  isOpen,
  onClose,
  date,
  trades,
  accountId,
  onEditTrade,
  onDeleteTrade,
}: DayDetailModalProps) {
  const {
    routines,
    entries,
    addRoutine,
    updateRoutine,
    loadRoutines,
    loadEntries,
    getEntryByTradeId,
    removeEntry,
  } = useJournalStore();

  // Journal Modal State
  const [selectedTradeForJournal, setSelectedTradeForJournal] =
    useState<Trade | null>(null);
  const [selectedEntryForEdit, setSelectedEntryForEdit] =
    useState<JournalEntry | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Derive current routine directly from store state
  const currentRoutine = routines.find((r) => r.date === date);

  useEffect(() => {
    if (isOpen && accountId) {
      loadRoutines(accountId);
      loadEntries(accountId);
    }
  }, [isOpen, accountId, loadRoutines, loadEntries]);

  const handleToggleHabit = async (
    habit: keyof Omit<
      DailyRoutine,
      "id" | "accountId" | "date" | "createdAt" | "updatedAt"
    >
  ) => {
    if (currentRoutine) {
      await updateRoutine({
        ...currentRoutine,
        [habit]: !currentRoutine[habit],
      });
    } else {
      await addRoutine({
        userId: "", // Will be set by storage
        accountId,
        date,
        aerobic: habit === "aerobic",
        diet: habit === "diet",
        reading: habit === "reading",
        meditation: habit === "meditation",
        preMarket: habit === "preMarket",
        prayer: habit === "prayer",
      });
    }
  };

  const handleJournalClick = (trade: Trade) => {
    const entry = getEntryByTradeId(trade.id);
    setSelectedTradeForJournal(trade);
    setSelectedEntryForEdit(entry || null);
    setIsJournalModalOpen(true);
  };

  const handleStandaloneEntryClick = () => {
    setSelectedTradeForJournal(null);
    setSelectedEntryForEdit(null);
    setIsJournalModalOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntryForEdit(entry);
    setSelectedTradeForJournal(null);
    setIsJournalModalOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm("Tem certeza que deseja excluir esta entrada do diário?")) {
      await removeEntry(entryId);
    }
  };

  // Calculate Stats
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const tradeCount = trades.length;

  // Habits Configuration
  const habits = [
    { key: "aerobic", label: "Aeróbico", icon: "🏃" },
    { key: "diet", label: "Alimentação", icon: "🍎" },
    { key: "reading", label: "Leitura", icon: "📚" },
    { key: "meditation", label: "Meditação", icon: "🧘" },
    { key: "preMarket", label: "PréMarket", icon: "📊" },
    { key: "prayer", label: "Oração", icon: "🙏" },
  ] as const;

  const formattedDate = date ? dayjs(date).format("dddd, DD/MM/YYYY") : "";
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Filter standalone entries (entries for this date that are NOT linked to any of the displayed trades)
  // Actually, we want to show ALL entries for this date.
  // If an entry is linked to a trade, it's usually accessed via the trade row.
  // But the user wants to see "standalone" entries in the list too.
  // Let's filter entries that have NO tradeId, OR entries whose tradeId is not in the current trades list (though that shouldn't happen if data is consistent).
  const standaloneEntries = entries.filter(
    (e) => e.date === date && !e.tradeId
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="6xl"
        title={
          <div className="text-center w-full">
            <h2 className="text-xl font-bold text-gray-100">
              {capitalizedDate}
            </h2>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Habits Row */}
          <div className="flex flex-wrap gap-3 justify-center">
            {habits.map((habit) => {
              const isChecked = currentRoutine?.[habit.key] || false;
              return (
                <button
                  key={habit.key}
                  onClick={() => handleToggleHabit(habit.key)}
                  className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                                        ${
                                          isChecked
                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                            : "bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600"
                                        }
                                    `}
                >
                  <div
                    className={`
                                        w-5 h-5 rounded flex items-center justify-center border
                                        ${
                                          isChecked
                                            ? "bg-cyan-500 border-cyan-500 text-black"
                                            : "border-gray-600"
                                        }
                                    `}
                  >
                    {isChecked && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {habit.label} {habit.icon}
                  </span>
                </button>
              );
            })}

            {/* Diário Button */}
            <button
              onClick={handleStandaloneEntryClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-cyan-400 transition-colors"
            >
              <span className="text-sm font-medium">Diário 📓</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                P/L
              </span>
              <span
                className={`text-3xl font-bold ${
                  totalPnL >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(totalPnL)}
              </span>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                TRADES COUNT
              </span>
              <span className="text-3xl font-bold text-gray-100">
                {tradeCount}
              </span>
            </div>
          </div>

          {/* Trades & Entries List */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-12">DIÁRIO</th>
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
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="w-8 h-8 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded transition-colors mx-auto text-cyan-400"
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
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-blue-400 transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
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
                      Diário
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
                    const start = dayjs(trade.entryDate);
                    const end = dayjs(trade.exitDate);
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
                        <button
                          onClick={() => handleJournalClick(trade)}
                          className="w-8 h-8 flex items-center justify-center bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded transition-colors mx-auto text-cyan-400"
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
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTrade(trade)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-blue-400 transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteTrade(trade.id)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
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
                        {trade.symbol}
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

          {/* Footer Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {/* Journal Modal */}
      {(selectedTradeForJournal ||
        selectedEntryForEdit ||
        isJournalModalOpen) && (
        <JournalEntryModal
          key={
            selectedTradeForJournal?.id ||
            selectedEntryForEdit?.id ||
            "new-entry"
          }
          isOpen={isJournalModalOpen}
          onClose={() => {
            setIsJournalModalOpen(false);
            setSelectedTradeForJournal(null);
            setSelectedEntryForEdit(null);
          }}
          trade={selectedTradeForJournal}
          existingEntry={selectedEntryForEdit || undefined}
          initialDate={date}
          accountId={accountId}
          availableTrades={trades}
        />
      )}
    </>
  );
}
