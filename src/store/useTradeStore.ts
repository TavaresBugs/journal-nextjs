import { create } from 'zustand';
import type { Trade, TradeLite } from '@/types';
import { getTradesPaginated, getTradeHistoryLite, saveTrade, deleteTrade } from '@/lib/storage'; // Update imports to use new service functions

interface TradeStore {
    trades: Trade[]; // Current page trades
    allHistory: TradeLite[]; // Lightweight history for charts
    totalCount: number;
    currentPage: number;
    itemsPerPage: number;
    isLoading: boolean;
    isLoadingHistory: boolean;

    // Actions
    loadTrades: (accountId: string) => Promise<void>;
    loadPage: (accountId: string, page: number) => Promise<void>;
    addTrade: (trade: Trade) => Promise<void>;
    updateTrade: (trade: Trade) => Promise<void>;
    removeTrade: (id: string, accountId: string) => Promise<void>; // Added accountId param
    clearTrades: () => void;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
    trades: [],
    allHistory: [],
    totalCount: 0,
    currentPage: 1,
    itemsPerPage: 10, // Match UI
    isLoading: false,
    isLoadingHistory: false,

    loadTrades: async (accountId: string) => {
        set({ isLoading: true, isLoadingHistory: true });
        try {
            // Parallel fetch: Page 1 (Detailed) + All History (Lite)
            const [pageResponse, historyLite] = await Promise.all([
                getTradesPaginated(accountId, 1, get().itemsPerPage),
                getTradeHistoryLite(accountId)
            ]);

            set({
                trades: pageResponse.data,
                totalCount: pageResponse.count,
                allHistory: historyLite,
                currentPage: 1,
                isLoading: false,
                isLoadingHistory: false
            });
        } catch (error) {
            console.error('Error loading trades:', error);
            set({ isLoading: false, isLoadingHistory: false });
        }
    },

    loadPage: async (accountId: string, page: number) => {
        set({ isLoading: true });
        try {
            const { data, count } = await getTradesPaginated(accountId, page, get().itemsPerPage);
            set({
                trades: data,
                totalCount: count, // Update count just in case
                currentPage: page,
                isLoading: false
            });
        } catch (error) {
            console.error('Error loading page:', error);
            set({ isLoading: false });
        }
    },

    addTrade: async (trade: Trade) => {
        const { trades, allHistory, totalCount } = get();
        await saveTrade(trade);

        // Convert to Lite
        const tradeLite: TradeLite = {
            id: trade.id,
            entryDate: trade.entryDate,
            entryTime: trade.entryTime,
            exitDate: trade.exitDate,
            exitTime: trade.exitTime,
            pnl: trade.pnl,
            outcome: trade.outcome,
            accountId: trade.accountId,
            symbol: trade.symbol,
            type: trade.type,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit,
            lot: trade.lot,
            tags: trade.tags,
            strategy: trade.strategy,
            setup: trade.setup,
            tfAnalise: trade.tfAnalise,
            tfEntrada: trade.tfEntrada,
            session: trade.session,
            entry_quality: trade.entry_quality,
            market_condition_v2: trade.market_condition_v2,
            commission: trade.commission,
            swap: trade.swap
        };

        // Optimistic update
        // Add to history (newest first)
        const newHistory = [tradeLite, ...allHistory].sort((a, b) =>
            new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        );

        // Add to current page if we are on page 1, else just update count
        let newTrades = trades;
        if (get().currentPage === 1) {
            newTrades = [trade, ...trades].slice(0, get().itemsPerPage);
        }

        set({
            trades: newTrades,
            allHistory: newHistory,
            totalCount: totalCount + 1
        });
    },

    updateTrade: async (trade: Trade) => {
        const { trades, allHistory } = get();
        await saveTrade(trade);

        // Update in current page list if exists
        const updatedTrades = trades.map(t =>
            t.id === trade.id ? trade : t
        );

        // Update in history lite
        const updatedHistory = allHistory.map(t =>
            t.id === trade.id ? {
                ...t,
                entryDate: trade.entryDate,
                pnl: trade.pnl,
                outcome: trade.outcome,
                symbol: trade.symbol,
                type: trade.type,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                stopLoss: trade.stopLoss,
                takeProfit: trade.takeProfit,
                lot: trade.lot,
                tags: trade.tags,
                strategy: trade.strategy,
                setup: trade.setup,
                tfAnalise: trade.tfAnalise,
                tfEntrada: trade.tfEntrada,
                marketCondition: trade.marketCondition,
                entry_quality: trade.entry_quality,
                market_condition_v2: trade.market_condition_v2,
                session: trade.session,
                commission: trade.commission,
                swap: trade.swap
            } : t
        ).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

        set({
            trades: updatedTrades,
            allHistory: updatedHistory
        });
    },

    removeTrade: async (id: string, accountId: string) => {
        const { trades, allHistory, totalCount } = get();
        await deleteTrade(id);

        // Also remove from local journal store since backend deletes it via cascade
        // We import here to avoid circular dependency issues if any
        const { useJournalStore } = await import('./useJournalStore');
        useJournalStore.getState().removeEntryByTradeId(id);

        const filteredTrades = trades.filter(t => t.id !== id);
        const filteredHistory = allHistory.filter(t => t.id !== id);
        
        // Use functional set to ensure latest state if called rapidly, but mostly safe here
        set({ 
            trades: filteredTrades,
            allHistory: filteredHistory,
            totalCount: Math.max(0, totalCount - 1)
        });
        
        // Ideally we should reload the page if trades empty out, but this is fine for now
        if (filteredTrades.length === 0 && get().currentPage > 1) {
             const prevPage = get().currentPage - 1;
             get().loadPage(accountId, prevPage);
        }
    },

    clearTrades: () => {
        set({ trades: [], allHistory: [], totalCount: 0, currentPage: 1 });
    },
}));
