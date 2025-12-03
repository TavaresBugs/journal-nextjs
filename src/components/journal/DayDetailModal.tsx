"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Modal, Button } from "@/components/ui";
import type { Trade, DailyRoutine, JournalEntry } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { useToast } from "@/contexts/ToastContext";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { DailyHabitsRow, DayStatsCards, DayTradesTable } from "@/components/journal/day-detail";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  accountId: string;
  onDeleteTrade: (tradeId: string) => void;
}

/**
 * Modal for displaying and managing day details
 * Orchestrates DailyHabitsRow, DayStatsCards, and DayTradesTable components
 */
export function DayDetailModal({
  isOpen,
  onClose,
  date,
  trades,
  accountId,
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

  const { showToast } = useToast();

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

  const handleToggleHabit = useCallback(async (
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
  }, [currentRoutine, updateRoutine, addRoutine, accountId, date]);

  const handleJournalClick = useCallback((trade: Trade) => {
    const entry = getEntryByTradeId(trade.id);
    setSelectedTradeForJournal(trade);
    setSelectedEntryForEdit(entry || null);
    setIsJournalModalOpen(true);
  }, [getEntryByTradeId]);

  const handleStandaloneEntryClick = useCallback(() => {
    setSelectedTradeForJournal(null);
    setSelectedEntryForEdit(null);
    setIsJournalModalOpen(true);
  }, []);

  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntryForEdit(entry);
    setSelectedTradeForJournal(null);
    setIsJournalModalOpen(true);
  }, []);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!confirm("⚠️ Tem certeza que deseja excluir esta entrada do diário?")) {
      return;
    }
    
    try {
      await removeEntry(entryId);
      showToast('Entrada excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showToast('Erro ao excluir entrada', 'error');
    }
  }, [removeEntry, showToast]);

  // Calculate Stats with useMemo
  const totalPnL = useMemo(() => 
    trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    [trades]
  );

  const capitalizedDate = useMemo(() => {
    const formatted = date ? dayjs(date).format("dddd, DD/MM/YYYY") : "";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [date]);

  // Filter standalone entries with useMemo
  const standaloneEntries = useMemo(() =>
    entries.filter((e) => e.date === date && !e.tradeId),
    [entries, date]
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
          <div className="space-y-3">
            <DailyHabitsRow
              currentRoutine={currentRoutine || null}
              onToggleHabit={handleToggleHabit}
            />
          </div>

          {/* Stats Cards */}
          <DayStatsCards trades={trades} totalPnL={totalPnL} />

          {/* Trades & Entries Table */}
          <DayTradesTable
            trades={trades}
            standaloneEntries={standaloneEntries}
            onDeleteTrade={onDeleteTrade}
            onJournalClick={handleJournalClick}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            getEntryByTradeId={getEntryByTradeId}
            onNewEntry={handleStandaloneEntryClick}
          />

          {/* Footer Button */}
          <Button
            variant="gradient-danger"
            onClick={onClose}
            className="w-full py-3 font-extrabold"
          >
            Fechar
          </Button>
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
          startEditing={true}
        />
      )}
    </>
  );
}
