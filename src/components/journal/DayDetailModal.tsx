"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Modal, Button } from "@/components/ui";
import type { Trade, DailyRoutine, JournalEntry } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { useToast } from "@/providers/ToastProvider";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { DailyHabitsRow, DayStatsCards, DayTradesTable } from "@/components/journal/day-detail";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { getMyMentors } from "@/services/mentor/inviteService";
import { getReviewsForContext } from "@/services/reviewService";

dayjs.locale("pt-br");

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  accountId: string;
  onDeleteTrade: (tradeId: string) => void;
  onEditTrade?: (trade: Trade) => void;
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
  onEditTrade,
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

  const [selectedTradeForJournal, setSelectedTradeForJournal] =
    useState<Trade | null>(null);
  const [selectedEntryForEdit, setSelectedEntryForEdit] =
    useState<JournalEntry | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [startModalEditing, setStartModalEditing] = useState(false);

  // Mentor & Review State
  const [hasMentor, setHasMentor] = useState(false);
  const [reviewsMap, setReviewsMap] = useState<Record<string, { hasUnread: boolean; count: number }>>({});

  // Filter standalone entries with useMemo
  const standaloneEntries = useMemo(() =>
    entries.filter((e) => e.date === date && (!e.tradeIds || e.tradeIds.length === 0)),
    [entries, date]
  );

  // Derive current routine directly from store state
  const currentRoutine = routines.find((r) => r.date === date);

  useEffect(() => {
    if (isOpen && accountId) {
      loadRoutines(accountId);
      loadEntries(accountId);
      
      // Check for mentor connection
      getMyMentors().then(mentors => {
        setHasMentor(mentors.length > 0);
      });
    }
  }, [isOpen, accountId, loadRoutines, loadEntries]);

  // Load reviews for context (trades + standalone entries of the day)
  useEffect(() => {
    if (!isOpen || !hasMentor) return;

    const loadReviews = async () => {
      const tradeIds = trades.map(t => t.id);
      const entryIds = standaloneEntries.map(e => e.id);
      
      if (tradeIds.length === 0 && entryIds.length === 0) return;

      const reviews = await getReviewsForContext(tradeIds, entryIds);
      
      // Process reviews into map
      const map: Record<string, { hasUnread: boolean; count: number }> = {};
      
      reviews.forEach(review => {
        // Link to trade OR journal entry
        const key = review.tradeId || review.journalEntryId;
        if (!key) return;

        if (!map[key]) {
          map[key] = { hasUnread: false, count: 0 };
        }

        map[key].count++;
        if (!review.isRead) {
          map[key].hasUnread = true;
        }
      });

      setReviewsMap(map);
    };

    loadReviews();
  }, [isOpen, hasMentor, trades, standaloneEntries, date]); // Re-run when trades/entries update

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

  const handleJournalClick = useCallback((trade: Trade, startEditing: boolean = true) => {
    const entry = getEntryByTradeId(trade.id);
    setSelectedTradeForJournal(trade);
    setSelectedEntryForEdit(entry || null);
    setStartModalEditing(startEditing);
    setIsJournalModalOpen(true);
  }, [getEntryByTradeId]);

  const handleStandaloneEntryClick = useCallback(() => {
    setSelectedTradeForJournal(null);
    setSelectedEntryForEdit(null);
    setStartModalEditing(true);
    setIsJournalModalOpen(true);
  }, []);

  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntryForEdit(entry);
    setSelectedTradeForJournal(null);
    setStartModalEditing(true);
    setIsJournalModalOpen(true);
  }, []);

  const handlePreviewEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntryForEdit(entry);
    setSelectedTradeForJournal(null);
    setStartModalEditing(false);
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
            onEditTrade={onEditTrade}
            onJournalClick={handleJournalClick}
            onEditEntry={handleEditEntry}
            onPreviewEntry={handlePreviewEntry}
            onDeleteEntry={handleDeleteEntry}
            getEntryByTradeId={getEntryByTradeId}
            onNewEntry={handleStandaloneEntryClick}
            hasMentor={hasMentor}
            reviewsMap={reviewsMap}
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
          startEditing={startModalEditing}
          hasMentor={hasMentor}
          hasUnreadComments={(() => {
            const tradeId = selectedTradeForJournal?.id;
            const entryId = selectedEntryForEdit?.id;
            // Check review status for trade OR entry
            if (tradeId && reviewsMap[tradeId]?.hasUnread) return true;
            if (entryId && reviewsMap[entryId]?.hasUnread) return true;
            return false;
          })()}
        />
      )}
    </>
  );
}
