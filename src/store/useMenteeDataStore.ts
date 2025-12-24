"use client";

/**
 * Mentee Data Store
 *
 * Implements CASCADING PREFETCH pattern:
 * 1. When mentor page opens → load calendar data (trades + availability)
 * 2. When calendar is visible → prefetch day details for days with journals
 * 3. When day modal opens → data is already available
 */

import { create } from "zustand";
import { Trade, JournalEntry, DailyRoutine } from "@/types";
import {
  getMenteeTradesAction,
  getMenteeJournalAvailabilityAction,
  getMenteeDayDataBatchAction,
} from "@/app/actions/mentor";
import dayjs from "dayjs";

interface MenteeCalendarData {
  trades: Trade[];
  journalAvailability: Record<string, number>; // date -> count
  lastLoaded: Date;
}

interface MenteeDayData {
  journalEntries: JournalEntry[];
  routine: DailyRoutine | null;
  lastLoaded: Date;
}

interface MenteeDataStore {
  // Calendar data per mentee
  menteeData: Record<string, MenteeCalendarData>;
  // Day details per mentee+date: { "menteeId:date": { journalEntries, routine } }
  dayData: Record<string, MenteeDayData>;
  isLoading: boolean;

  // Calendar Actions
  loadMenteeCalendarData: (menteeId: string, accountId?: string) => Promise<void>;
  loadAllMenteesData: (menteeIds: string[]) => Promise<void>;
  getMenteeCalendarData: (menteeId: string) => MenteeCalendarData | undefined;

  // Day Data Actions (Cascading Prefetch)
  loadDayData: (menteeId: string, date: string, accountId?: string) => Promise<void>;
  prefetchDaysWithJournals: (menteeId: string, accountId?: string) => Promise<void>;
  getDayData: (menteeId: string, date: string) => MenteeDayData | undefined;

  // Cleanup
  clearMenteeData: (menteeId: string) => void;
  clearAllData: () => void;
}

export const useMenteeDataStore = create<MenteeDataStore>((set, get) => ({
  menteeData: {},
  dayData: {},
  isLoading: false,

  // === CALENDAR DATA ===
  loadMenteeCalendarData: async (menteeId: string, accountId?: string) => {
    const existing = get().menteeData[menteeId];
    if (existing && Date.now() - existing.lastLoaded.getTime() < 5 * 60 * 1000) {
      console.log(`[MenteeDataStore] Using cached calendar for ${menteeId}`);
      return;
    }

    console.log(`[MenteeDataStore] Loading calendar data for ${menteeId}`);

    try {
      const currentMonth = dayjs().month();
      const currentYear = dayjs().year();

      const [trades, journalAvailability] = await Promise.all([
        getMenteeTradesAction(menteeId, accountId),
        getMenteeJournalAvailabilityAction(menteeId, currentMonth, currentYear, accountId),
      ]);

      set((state) => ({
        menteeData: {
          ...state.menteeData,
          [menteeId]: {
            trades,
            journalAvailability,
            lastLoaded: new Date(),
          },
        },
      }));

      console.log(
        `[MenteeDataStore] Loaded ${trades.length} trades, ${Object.keys(journalAvailability).length} journal dates`
      );

      // CASCADING PREFETCH: Trigger prefetch of days with journals
      get().prefetchDaysWithJournals(menteeId, accountId);
    } catch (error) {
      console.error(`[MenteeDataStore] Error loading calendar:`, error);
    }
  },

  loadAllMenteesData: async (menteeIds: string[]) => {
    if (menteeIds.length === 0) return;

    set({ isLoading: true });
    console.log(`[MenteeDataStore] Pre-loading data for ${menteeIds.length} mentees`);

    try {
      await Promise.all(menteeIds.map((menteeId) => get().loadMenteeCalendarData(menteeId)));
    } finally {
      set({ isLoading: false });
    }
  },

  getMenteeCalendarData: (menteeId: string) => {
    return get().menteeData[menteeId];
  },

  // === DAY DATA (Cascading Prefetch) ===
  loadDayData: async (menteeId: string, date: string, accountId?: string) => {
    const key = `${menteeId}:${date}`;
    const existing = get().dayData[key];

    if (existing && Date.now() - existing.lastLoaded.getTime() < 5 * 60 * 1000) {
      console.log(`[MenteeDataStore] Using cached day data for ${date}`);
      return;
    }

    console.log(`[MenteeDataStore] Loading day data for ${date}`);

    try {
      const { journalEntries, routine } = await getMenteeDayDataBatchAction(
        menteeId,
        date,
        accountId
      );

      set((state) => ({
        dayData: {
          ...state.dayData,
          [key]: {
            journalEntries,
            routine,
            lastLoaded: new Date(),
          },
        },
      }));

      console.log(`[MenteeDataStore] Loaded day ${date}: ${journalEntries.length} journals`);
    } catch (error) {
      console.error(`[MenteeDataStore] Error loading day ${date}:`, error);
    }
  },

  prefetchDaysWithJournals: async (menteeId: string, accountId?: string) => {
    const calendarData = get().menteeData[menteeId];
    if (!calendarData) return;

    const datesWithJournals = Object.keys(calendarData.journalAvailability);
    if (datesWithJournals.length === 0) return;

    // Sort by proximity to today (closest first)
    const today = dayjs();
    const sortedDates = datesWithJournals.sort((a, b) => {
      const distanceA = Math.abs(today.diff(dayjs(a), "day"));
      const distanceB = Math.abs(today.diff(dayjs(b), "day"));
      return distanceA - distanceB;
    });

    console.log(
      `[MenteeDataStore] Prefetching ${sortedDates.length} days (sorted by proximity to today)`
    );

    // Prefetch in background (don't await all - just start loading)
    // Limit to first 5 days closest to today
    const datesToPrefetch = sortedDates.slice(0, 5);
    datesToPrefetch.forEach((date) => {
      get().loadDayData(menteeId, date, accountId);
    });
  },

  getDayData: (menteeId: string, date: string) => {
    return get().dayData[`${menteeId}:${date}`];
  },

  // === CLEANUP ===
  clearMenteeData: (menteeId: string) => {
    set((state) => {
      const newMenteeData = { ...state.menteeData };
      delete newMenteeData[menteeId];

      // Also clear all day data for this mentee
      const newDayData = { ...state.dayData };
      Object.keys(newDayData).forEach((key) => {
        if (key.startsWith(`${menteeId}:`)) {
          delete newDayData[key];
        }
      });

      return { menteeData: newMenteeData, dayData: newDayData };
    });
  },

  clearAllData: () => {
    set({ menteeData: {}, dayData: {} });
  },
}));
