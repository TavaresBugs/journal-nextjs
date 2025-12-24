import { create } from "zustand";
import type { Trade, TradeLite } from "@/types";
// Using Prisma Server Actions for type-safe database queries
import {
  fetchTrades,
  fetchTradeHistory,
  createTrade as createTradeAction,
  updateTrade as updateTradeAction,
  deleteTradePrisma,
} from "@/actions/trades";

interface TradeStore {
  trades: Trade[]; // Current page trades
  allHistory: TradeLite[]; // Lightweight history for charts
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  sortDirection: "asc" | "desc"; // NEW: Sort direction state
  filterAsset: string; // NEW: Filter asset state
  isLoading: boolean;
  isLoadingHistory: boolean;

  // Actions
  loadTrades: (accountId: string) => Promise<void>;
  loadAllHistory: (accountId: string) => Promise<void>; // NEW action
  setAllHistory: (history: TradeLite[]) => void; // NEW action
  loadPage: (accountId: string, page: number) => Promise<void>;
  setSortDirection: (accountId: string, direction: "asc" | "desc") => Promise<void>; // NEW action
  setFilterAsset: (accountId: string, asset: string) => Promise<void>; // NEW action
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (trade: Trade) => Promise<void>;
  removeTrade: (id: string, accountId: string) => Promise<void>;
  clearTrades: () => void;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  trades: [],
  allHistory: [],
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 10,
  sortDirection: "desc", // Default to newest first
  filterAsset: "TODOS OS ATIVOS",
  isLoading: false,
  isLoadingHistory: false,

  loadTrades: async (accountId: string) => {
    set({ isLoading: true });
    try {
      // Only fetch Page 1 initially
      const pageResponse = await fetchTrades(
        accountId,
        1,
        get().itemsPerPage,
        get().sortDirection,
        get().filterAsset
      );

      set({
        trades: pageResponse.data,
        totalCount: pageResponse.count,
        currentPage: 1,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading trades:", error);
      set({ isLoading: false });
    }
  },

  loadAllHistory: async (accountId: string) => {
    if (get().allHistory.length > 0 && !get().isLoadingHistory) return;

    set({ isLoadingHistory: true });
    try {
      const historyLite = await fetchTradeHistory(accountId);
      set({
        allHistory: historyLite,
        isLoadingHistory: false,
      });
    } catch (error) {
      console.error("Error loading history:", error);
      set({ isLoadingHistory: false });
    }
  },

  setAllHistory: (history: TradeLite[]) => {
    set({ allHistory: history });
  },

  loadPage: async (accountId: string, page: number) => {
    set({ isLoading: true });
    try {
      const { data, count } = await fetchTrades(
        accountId,
        page,
        get().itemsPerPage,
        get().sortDirection,
        get().filterAsset
      );
      set({
        trades: data,
        totalCount: count,
        currentPage: page,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading page:", error);
      set({ isLoading: false });
    }
  },

  setSortDirection: async (accountId: string, direction: "asc" | "desc") => {
    // Only reload if changed
    if (get().sortDirection === direction && get().trades.length > 0) return;

    set({ sortDirection: direction, currentPage: 1 });
    await get().loadPage(accountId, 1);
  },

  setFilterAsset: async (accountId: string, asset: string) => {
    // Only reload if changed
    if (get().filterAsset === asset) return;

    set({ filterAsset: asset, currentPage: 1 }); // Reset to page 1 on filter change
    await get().loadPage(accountId, 1);
  },

  addTrade: async (trade: Trade) => {
    const { trades, allHistory, totalCount, sortDirection } = get();
    // Await the server action result - will throw if fails
    const createdTrade = await createTradeAction(trade);

    // Use the returned trade which has the real ID and timestamps
    const tradeLite: TradeLite = {
      id: createdTrade.id,
      entryDate: createdTrade.entryDate,
      entryTime: createdTrade.entryTime,
      exitDate: createdTrade.exitDate,
      exitTime: createdTrade.exitTime,
      pnl: createdTrade.pnl,
      outcome: createdTrade.outcome,
      accountId: createdTrade.accountId,
      symbol: createdTrade.symbol,
      type: createdTrade.type,
      entryPrice: createdTrade.entryPrice,
      exitPrice: createdTrade.exitPrice,
      stopLoss: createdTrade.stopLoss,
      takeProfit: createdTrade.takeProfit,
      lot: createdTrade.lot,
      tags: createdTrade.tags,
      strategy: createdTrade.strategy,
      setup: createdTrade.setup,
      tfAnalise: createdTrade.tfAnalise,
      tfEntrada: createdTrade.tfEntrada,
      session: createdTrade.session,
      entry_quality: createdTrade.entry_quality,
      market_condition_v2: createdTrade.market_condition_v2,
      commission: createdTrade.commission,
      swap: createdTrade.swap,
    };

    // Optimistic update (now actually confirmed update)
    // Add to history (newest first hardcoded for history usually, or matches sort?)
    // History usually for charts, assumes time order. Keeping desc for history consistency.
    const newHistory = [tradeLite, ...allHistory].sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );

    // For the list, IF we are on page 1 AND sort is DESC, we prepend.
    // If sort is ASC, we might append if page is last? Too complex.
    // Simplest: Just prepend if DESC and Page 1. If ASC, it goes to end (last page).
    // If we are strictly server-side sorting, adding to local list is tricky without re-sort.
    // We will just re-fetch page 1 if we want to be 100% sure, OR just prepend if sort is desc.

    let newTrades = trades;
    if (sortDirection === "desc" && get().currentPage === 1) {
      newTrades = [createdTrade, ...trades].slice(0, get().itemsPerPage);
    } else if (sortDirection === "asc") {
      // If asc, new trade (latest date) likely goes to last page.
      // We won't see it on current page unless we are on the last page.
      // For better UX, we might just want to reload the page or accept it won't appear immediately if we are looking at old trades.
      // Let's leave current page as is for ASC.
    }

    set({
      trades: newTrades,
      allHistory: newHistory,
      totalCount: totalCount + 1,
    });
  },

  updateTrade: async (trade: Trade) => {
    const { trades, allHistory } = get();
    const updatedTrade = await updateTradeAction(trade.id, trade);

    // Update in current page list if exists
    const updatedTrades = trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t));

    // Update in history lite
    const updatedHistory = allHistory
      .map((t) =>
        t.id === updatedTrade.id
          ? {
              ...t,
              entryDate: updatedTrade.entryDate,
              pnl: updatedTrade.pnl,
              outcome: updatedTrade.outcome,
              symbol: updatedTrade.symbol,
              type: updatedTrade.type,
              entryPrice: updatedTrade.entryPrice,
              exitPrice: updatedTrade.exitPrice,
              stopLoss: updatedTrade.stopLoss,
              takeProfit: updatedTrade.takeProfit,
              lot: updatedTrade.lot,
              tags: updatedTrade.tags,
              strategy: updatedTrade.strategy,
              setup: updatedTrade.setup,
              tfAnalise: updatedTrade.tfAnalise,
              tfEntrada: updatedTrade.tfEntrada,
              marketCondition: updatedTrade.marketCondition,
              entry_quality: updatedTrade.entry_quality,
              market_condition_v2: updatedTrade.market_condition_v2,
              session: updatedTrade.session,
              commission: updatedTrade.commission,
              swap: updatedTrade.swap,
            }
          : t
      )
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    set({
      trades: updatedTrades,
      allHistory: updatedHistory,
    });
  },

  removeTrade: async (id: string, accountId: string) => {
    const { trades, allHistory, totalCount } = get();
    await deleteTradePrisma(id);

    // Also remove from local journal store since backend deletes it via cascade
    // We import here to avoid circular dependency issues if any
    const { useJournalStore } = await import("./useJournalStore");
    useJournalStore.getState().removeEntryByTradeId(id);

    const filteredTrades = trades.filter((t) => t.id !== id);
    const filteredHistory = allHistory.filter((t) => t.id !== id);

    // Use functional set to ensure latest state if called rapidly, but mostly safe here
    set({
      trades: filteredTrades,
      allHistory: filteredHistory,
      totalCount: Math.max(0, totalCount - 1),
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
