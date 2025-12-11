import { create } from 'zustand';
import type { JournalEntry, DailyRoutine } from '@/types';
import { 
    getJournalEntries, 
    saveJournalEntry, 
    deleteJournalEntry,
    getDailyRoutines,
    saveDailyRoutine
} from '@/lib/storage';

interface JournalStore {
    entries: JournalEntry[];
    routines: DailyRoutine[];
    isLoading: boolean;
    error: string | null;

    // Journal Actions
    loadEntries: (accountId: string) => Promise<void>;
    addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
    updateEntry: (entry: JournalEntry) => Promise<void>;
    removeEntry: (id: string) => Promise<void>;
    removeEntryByTradeId: (tradeId: string) => void;
    getEntriesByTradeId: (tradeId: string) => JournalEntry[];
    getEntryByTradeId: (tradeId: string) => JournalEntry | undefined;

    // Routine Actions
    loadRoutines: (accountId: string) => Promise<void>;
    addRoutine: (routine: Omit<DailyRoutine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRoutine: (routine: DailyRoutine) => Promise<void>;
    getRoutineByDate: (date: string) => DailyRoutine | undefined;
}

export const useJournalStore = create<JournalStore>((set, get) => ({
    entries: [],
    routines: [],
    isLoading: false,
    error: null,

    // Journal Actions
    loadEntries: async (accountId: string) => {
        set({ isLoading: true, error: null });
        try {
            const entries = await getJournalEntries(accountId);
            set({ entries, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addEntry: async (entryData) => {
        set({ isLoading: true, error: null });
        try {
            const newEntry: JournalEntry = {
                ...entryData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const success = await saveJournalEntry(newEntry);

            if (success) {
                set(state => ({
                    entries: [newEntry, ...state.entries],
                    isLoading: false
                }));
                return newEntry.id;
            } else {
                throw new Error('Failed to save journal entry');
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            return undefined;
        }
    },

    updateEntry: async (entry) => {
        set({ isLoading: true, error: null });
        try {
            const updatedEntry = {
                ...entry,
                updatedAt: new Date().toISOString()
            };

            const success = await saveJournalEntry(updatedEntry);

            if (success) {
                // Reload from DB to get fresh data including junction table relations
                const freshEntries = await getJournalEntries(entry.accountId);
                set({ entries: freshEntries, isLoading: false });
            } else {
                throw new Error('Failed to update journal entry');
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    removeEntry: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const success = await deleteJournalEntry(id);

            if (success) {
                set(state => ({
                    entries: state.entries.filter(e => e.id !== id),
                    isLoading: false
                }));
            } else {
                throw new Error('Failed to delete journal entry');
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    removeEntryByTradeId: (tradeId: string) => {
        set(state => ({
            entries: state.entries.filter(e => !e.tradeIds?.includes(tradeId))
        }));
    },

    getEntriesByTradeId: (tradeId: string) => {
        return get().entries.filter(e => e.tradeIds?.includes(tradeId));
    },

    getEntryByTradeId: (tradeId: string) => {
        return get().entries.find(e => e.tradeIds?.includes(tradeId));
    },

    // Routine Actions
    loadRoutines: async (accountId: string) => {
        set({ isLoading: true, error: null });
        try {
            const routines = await getDailyRoutines(accountId);
            set({ routines, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addRoutine: async (routineData) => {
        set({ isLoading: true, error: null });
        try {
            const newRoutine: DailyRoutine = {
                ...routineData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const success = await saveDailyRoutine(newRoutine);

            if (success) {
                set(state => ({
                    routines: [newRoutine, ...state.routines],
                    isLoading: false
                }));
            } else {
                throw new Error('Failed to save daily routine');
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    updateRoutine: async (routine) => {
        set({ isLoading: true, error: null });
        try {
            const updatedRoutine = {
                ...routine,
                updatedAt: new Date().toISOString()
            };

            const success = await saveDailyRoutine(updatedRoutine);

            if (success) {
                set(state => ({
                    routines: state.routines.map(r => 
                        r.id === routine.id ? updatedRoutine : r
                    ),
                    isLoading: false
                }));
            } else {
                throw new Error('Failed to update daily routine');
            }
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    getRoutineByDate: (date: string) => {
        return get().routines.find(r => r.date === date);
    }
}));
