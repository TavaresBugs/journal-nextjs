"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui";
import type { Trade, JournalEntry } from "@/types";
import { useMenteeDataStore } from "@/store/useMenteeDataStore";
import { MenteeJournalReviewModal } from "@/components/mentor/MenteeJournalReviewModal";
import { DailyHabitsRow, DayStatsCards, DayTradesTable } from "@/components/journal/day-detail";

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

/**
 * Modal for mentors to view a mentee's day details
 * Uses same components as user calendar (DailyHabitsRow, DayStatsCards)
 * Read-only view with habits, journal entries, and trades
 * OPTIMIZED: Uses cached data from store (prefetched when calendar loads)
 */
export function MenteeDayDetailModal({
  isOpen,
  onClose,
  date,
  trades,
  menteeName: _, // eslint-disable-line @typescript-eslint/no-unused-vars
  menteeId,
  accountId,
}: MenteeDayDetailModalProps) {
  // Get store functions
  const loadDayData = useMenteeDataStore((state) => state.loadDayData);

  // Subscribe to dayData for this specific mentee+date (reactive!)
  const dayDataKey = `${menteeId}:${date}`;
  const cachedDayData = useMenteeDataStore((state) => state.dayData[dayDataKey]);

  // Derive state from store (reactive - updates when store updates)
  const routine = cachedDayData?.routine || null;
  const journalEntries = cachedDayData?.journalEntries || [];

  // Trigger load if not cached (no local loading state needed - cachedDayData will update reactively)
  useEffect(() => {
    if (isOpen && menteeId && date && !cachedDayData) {
      console.log(`[MenteeDayDetailModal] No cached data for ${date}, loading...`);
      loadDayData(menteeId, date, accountId);
    } else if (isOpen && cachedDayData) {
      console.log(`[MenteeDayDetailModal] Using cached data for ${date} - INSTANT!`);
    }
  }, [isOpen, menteeId, date, accountId, cachedDayData, loadDayData]);

  // Loading is when modal is open but no cached data yet
  const loadingExtra = isOpen && !cachedDayData;

  // Review Modal State
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewEntry, setSelectedReviewEntry] = useState<JournalEntry | null>(null);
  const [selectedReviewTrade, setSelectedReviewTrade] = useState<Trade | null>(null);

  // Calculate total PnL for DayStatsCards
  const totalPnL = useMemo(() => trades.reduce((sum, t) => sum + (t.pnl || 0), 0), [trades]);

  const formattedDate = useMemo(() => {
    const formatted = date ? dayjs(date).format("dddd, DD/MM/YYYY") : "";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [date]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      title={
        <div className="w-full text-center">
          <h2 className="text-xl font-bold text-gray-100">{formattedDate}</h2>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Habits Row - Same component as user calendar (read-only) */}
        <DailyHabitsRow currentRoutine={routine} readOnly />

        {/* Stats Cards - Same component as user calendar */}
        <DayStatsCards trades={trades} totalPnL={totalPnL} />

        {/* Trades & Entries Table - Same component as user calendar (read-only) */}
        <DayTradesTable
          trades={trades}
          standaloneEntries={journalEntries.filter(
            (e) => !trades.some((t) => e.tradeIds?.includes(t.id) || e.asset === t.symbol)
          )}
          getEntryByTradeId={(tradeId) => journalEntries.find((e) => e.tradeIds?.includes(tradeId))}
          onPreviewEntry={(entry) => {
            setSelectedReviewEntry(entry);
            setSelectedReviewTrade(null);
            setReviewModalOpen(true);
          }}
          onJournalClick={(trade) => {
            const linkedEntry = journalEntries.find(
              (e) => e.tradeIds?.includes(trade.id) || e.asset === trade.symbol
            );
            if (linkedEntry) {
              setSelectedReviewEntry(linkedEntry);
              setSelectedReviewTrade(trade);
              setReviewModalOpen(true);
            }
          }}
          readOnly
        />

        {trades.length === 0 && journalEntries.length === 0 && !routine && !loadingExtra && (
          <div className="py-8 text-center text-gray-400">
            Nenhuma atividade registrada neste dia.
          </div>
        )}
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
