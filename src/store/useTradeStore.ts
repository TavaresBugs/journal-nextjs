import { create } from 'zustand';
import type { Trade } from '@/types';
import { getTrades, saveTrade, deleteTrade } from '@/lib/storage';

interface TradeStore {
    trades: Trade[];
    isLoading: boolean;

    // Actions
    loadTrades: (accountId: string) => Promise<void>;
    addTrade: (trade: Trade) => Promise<void>;
    updateTrade: (trade: Trade) => Promise<void>;
    removeTrade: (id: string) => Promise<void>;
    clearTrades: () => void;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
    trades: [],
    isLoading: false,

    loadTrades: async (accountId: string) => {
        set({ isLoading: true });
        try {
            const trades = await getTrades(accountId);
            set({ trades, isLoading: false });
        } catch (error) {
            console.error('Error loading trades:', error);
            set({ isLoading: false });
        }
    },

    addTrade: async (trade: Trade) => {
        const { trades } = get();
        await saveTrade(trade);
        set({ trades: [trade, ...trades] });
    },

    updateTrade: async (trade: Trade) => {
        const { trades } = get();
        await saveTrade(trade);

        const updatedTrades = trades.map(t =>
            t.id === trade.id ? trade : t
        );

        set({ trades: updatedTrades });
    },

    removeTrade: async (id: string) => {
        const { trades } = get();
        await deleteTrade(id);

        const filteredTrades = trades.filter(t => t.id !== id);
        set({ trades: filteredTrades });
    },

    clearTrades: () => {
        set({ trades: [] });
    },
}));
