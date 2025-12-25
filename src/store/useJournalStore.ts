import { create } from "zustand";
import type { JournalEntry, DailyRoutine } from "@/types";
import {
  getJournalEntriesAction,
  saveJournalEntryAction,
  deleteJournalEntryAction,
} from "@/app/actions/journal";
import { getDailyRoutinesAction, saveDailyRoutineAction } from "@/app/actions/routines";
import { uploadJournalImages, isRawImageMap } from "@/services/journal/imageUpload";
import { getCurrentUserIdClient } from "@/lib/supabase";

interface JournalStore {
  entries: JournalEntry[];
  routines: DailyRoutine[];
  currentAccountId: string | null; // Track which account data is loaded for
  isLoading: boolean;
  error: string | null;

  // Journal Actions
  loadEntries: (accountId: string) => Promise<void>;
  addEntry: (
    entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | undefined>;
  updateEntry: (entry: JournalEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  removeEntryByTradeId: (tradeId: string) => void;
  getEntriesByTradeId: (tradeId: string) => JournalEntry[];
  getEntryByTradeId: (tradeId: string) => JournalEntry | undefined;

  // Routine Actions
  loadRoutines: (accountId: string) => Promise<void>;
  addRoutine: (routine: Omit<DailyRoutine, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateRoutine: (routine: DailyRoutine) => Promise<void>;
  getRoutineByDate: (date: string) => DailyRoutine | undefined;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  routines: [],
  currentAccountId: null,
  isLoading: false,
  error: null,

  // Journal Actions
  loadEntries: async (accountId: string) => {
    const { entries, isLoading, currentAccountId } = get();

    // Skip if already loading
    if (isLoading) return;

    // Skip if already has entries for this account
    if (entries.length > 0 && currentAccountId === accountId) {
      return;
    }

    // Clear entries if switching accounts
    if (currentAccountId !== null && currentAccountId !== accountId) {
      set({ entries: [], currentAccountId: accountId });
    }

    set({ isLoading: true, error: null, currentAccountId: accountId });
    try {
      const newEntries = await getJournalEntriesAction(accountId);
      set({ entries: newEntries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addEntry: async (entryData) => {
    set({ isLoading: true, error: null });
    try {
      // Generate entry ID upfront for image paths
      const entryId = crypto.randomUUID();

      // Get current user ID for image upload
      const userId = await getCurrentUserIdClient();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Process and upload images if they are in raw format (base64 map)
      let processedImages = entryData.images;
      if (isRawImageMap(entryData.images)) {
        console.log("[useJournalStore] Processing images before save...");
        processedImages = await uploadJournalImages(entryData.images as Record<string, string[]>, {
          userId,
          accountId: entryData.accountId,
          entryId,
          date: entryData.date,
          asset: entryData.asset,
        });
        console.log(`[useJournalStore] Uploaded ${processedImages.length} images`);
      }

      // Create entry with processed images
      const newEntry: JournalEntry = {
        ...entryData,
        id: entryId,
        images: processedImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      set((state) => ({
        entries: [newEntry, ...state.entries],
        isLoading: false,
      }));

      console.log("[useJournalStore] Calling createJournalEntry Server Action...");

      // Call Server Action with processed data
      const result = await saveJournalEntryAction({
        ...entryData,
        id: entryId,
        images: processedImages,
      });

      console.log("[useJournalStore] Server Action result:", result);

      // OPTIMIZED: Use the returned entry instead of reloading all entries
      // This saves ~100-300ms per save operation
      if (result.entry) {
        set((state) => ({
          entries: state.entries.map((e) => (e.id === entryId ? result.entry! : e)),
          isLoading: false,
        }));
      }

      return result.entry?.id || entryId;
    } catch (error) {
      console.error("[useJournalStore] Error in addEntry:", error);
      set({ error: (error as Error).message, isLoading: false });
      // Rollback would go here
      return undefined;
    }
  },

  updateEntry: async (entry) => {
    set({ isLoading: true, error: null });
    try {
      // Get current user ID for image upload
      const userId = await getCurrentUserIdClient();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Process and upload images if they are in raw format (base64 map)
      let processedImages = entry.images;
      if (isRawImageMap(entry.images)) {
        console.log("[useJournalStore] Processing images for update...");
        processedImages = await uploadJournalImages(
          entry.images as unknown as Record<string, string[]>,
          {
            userId,
            accountId: entry.accountId,
            entryId: entry.id,
            date: entry.date,
            asset: entry.asset,
          }
        );
        console.log(`[useJournalStore] Uploaded ${processedImages.length} images`);
      }

      // Create updated entry with processed images
      const updatedEntry = {
        ...entry,
        images: processedImages,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      set((state) => ({
        entries: state.entries.map((e) => (e.id === entry.id ? updatedEntry : e)),
        isLoading: false,
      }));

      // Call Server Action with processed data
      // OPTIMIZED: Server action persists the data, optimistic update already applied
      // No need to reload all entries - saves ~100-300ms per update
      await saveJournalEntryAction(updatedEntry);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    const { entries } = get();
    try {
      // Optimistic update
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));

      await deleteJournalEntryAction(id);
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        entries, // Rollback
      });
    }
  },

  removeEntryByTradeId: (tradeId: string) => {
    set((state) => ({
      entries: state.entries.filter((e) => !e.tradeIds?.includes(tradeId)),
    }));
  },

  getEntriesByTradeId: (tradeId: string) => {
    return get().entries.filter((e) => e.tradeIds?.includes(tradeId));
  },

  getEntryByTradeId: (tradeId: string) => {
    return get().entries.find((e) => e.tradeIds?.includes(tradeId));
  },

  // Routine Actions
  loadRoutines: async (accountId: string) => {
    set({ isLoading: true, error: null });
    try {
      const routines = await getDailyRoutinesAction(accountId);
      set({ routines, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addRoutine: async (routineData) => {
    set({ isLoading: true, error: null });
    try {
      // Optimistic update
      const newRoutine: DailyRoutine = {
        ...routineData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        routines: [newRoutine, ...state.routines],
        isLoading: false,
      }));

      await saveDailyRoutineAction(routineData);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateRoutine: async (routine) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRoutine = {
        ...routine,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        routines: state.routines.map((r) => (r.id === routine.id ? updatedRoutine : r)),
        isLoading: false,
      }));

      await saveDailyRoutineAction(updatedRoutine);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getRoutineByDate: (date: string) => {
    return get().routines.find((r) => r.date === date);
  },
}));
