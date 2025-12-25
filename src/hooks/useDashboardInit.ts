"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { batchDashboardInitAction } from "@/app/actions/_batch/dashboardInit";

import { useToast } from "@/providers/ToastProvider";

import { useStratifiedLoading } from "./useStratifiedLoading";
import { PlaybookStats } from "@/types";

export interface DashboardInitData {
  // Account
  currentAccount: ReturnType<typeof useAccountStore.getState>["currentAccount"];

  // Data
  trades: ReturnType<typeof useTradeStore.getState>["trades"];
  allHistory: ReturnType<typeof useTradeStore.getState>["allHistory"];
  totalCount: number;
  currentPage: number;
  entries: ReturnType<typeof useJournalStore.getState>["entries"];
  playbooks: ReturnType<typeof usePlaybookStore.getState>["playbooks"];

  // Metrics (Server-Side)
  serverMetrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number; // Note: Action might return null properties if no trades
    totalPnl: number;
    wins: number;
    losses: number;
    breakeven: number;
  } | null;
  playbookStats: PlaybookStats[];

  // State
  isLoading: boolean;
  isTradesLoading: boolean;
  isStoreLoading: boolean;
  isAccountReady: boolean;
  isAccountFound: boolean;
  sortDirection: "asc" | "desc";
  filterAsset: string;
  loadingPhases: ReturnType<typeof useStratifiedLoading>["phases"];
}

export interface DashboardInitActions {
  loadPage: (accountId: string, page: number) => Promise<void>;
  loadTrades: (accountId: string) => Promise<void>;
  loadEntries: (accountId: string) => Promise<void>;
  loadPlaybooks: () => Promise<void>;
  setSortDirection: (accountId: string, direction: "asc" | "desc") => Promise<void>;
  setFilterAsset: (accountId: string, asset: string) => Promise<void>;
  loadCalendarData: () => Promise<void>;
  loadReportsData: () => Promise<void>;
  loadPlaybookStats: () => Promise<void>;
}

/**
 * Hook for initializing dashboard data.
 * Handles loading accounts, trades, entries, playbooks, and settings.
 * Now uses Server Actions for aggregated metrics to avoid loading full history.
 *
 * @param accountId - The account ID to initialize
 * @param isValidAccount - Whether the account ID format is valid
 * @returns Dashboard data, loading states, and action handlers
 */
export function useDashboardInit(
  accountId: string,
  isValidAccount: boolean
): DashboardInitData & DashboardInitActions {
  const router = useRouter();
  const { showToast } = useToast();

  // Stratified Loading
  const { phases, loadCalendarData, loadReportsData, playbookStats, loadPlaybookStats } =
    useStratifiedLoading(accountId);

  // Store State
  const { currentAccount } = useAccountStore();
  const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage } = useTradeStore();
  const { entries, loadEntries } = useJournalStore();
  const { playbooks, loadPlaybooks } = usePlaybookStore();

  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [isTradesLoading, setIsTradesLoading] = useState(true);
  const [isAccountReady, setIsAccountReady] = useState(false);
  const [isAccountFound, setIsAccountFound] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [serverMetrics, setServerMetrics] = useState<any>(null);

  // Refs
  const isInitRef = useRef<string | null>(null);

  // Initialization Effect
  useEffect(() => {
    if (!isValidAccount) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      const perfStart = performance.now();
      console.log("🚀 Dashboard init started");

      // RESET: Clear previous init state when switching accounts
      if (isInitRef.current && isInitRef.current !== accountId) {
        console.log("🔄 Switching accounts, resetting init state");
        isInitRef.current = null;
        setServerMetrics(null); // Clear old metrics
      }

      // Check if already initialized for this account
      if (isInitRef.current === accountId) {
        setIsLoading(false);
        return;
      }

      // Optimistic lock: prevent race conditions
      isInitRef.current = accountId;

      try {
        const perfT1 = performance.now();

        // Check if we have cached account data first
        let account = useAccountStore.getState().accounts.find((acc) => acc.id === accountId);

        if (account) {
          // Fast path: Account in cache, just set it
          useAccountStore.getState().setCurrentAccount(accountId);
          setIsAccountReady(true);
          console.log(`✅ Account (cached): ${(performance.now() - perfT1).toFixed(0)}ms`);

          // Still need to fetch fresh metrics and trades - use batch for efficiency
          try {
            const batchResult = await batchDashboardInitAction(accountId, 1, 10);
            if (batchResult?.metrics) {
              setServerMetrics(batchResult.metrics);
            }
            if (batchResult?.trades) {
              useTradeStore.setState({
                trades: batchResult.trades.data,
                totalCount: batchResult.trades.count,
                currentPage: 1,
              });
            }
          } catch (batchErr) {
            console.warn("Fast path batch fetch failed:", batchErr);
            // Don't redirect - we have the account, just missing fresh data
          }
        } else {
          // Slow path: Need full batch fetch including account
          const batchResult = await batchDashboardInitAction(accountId, 1, 10);

          if (!batchResult?.account) {
            console.error("Account not found:", accountId);
            setIsAccountFound(false);
            router.push("/");
            return;
          }

          account = batchResult.account;

          // Inject account into store
          useAccountStore.setState((state) => ({
            accounts: state.accounts.some((a) => a.id === accountId)
              ? state.accounts
              : [...state.accounts, batchResult.account!],
            currentAccount: batchResult.account,
            currentAccountId: accountId,
          }));

          setIsAccountReady(true);

          // Set metrics and trades from batch result
          if (batchResult.metrics) {
            setServerMetrics(batchResult.metrics);
          }
          if (batchResult.trades) {
            useTradeStore.setState({
              trades: batchResult.trades.data,
              totalCount: batchResult.trades.count,
              currentPage: 1,
            });
          }
        }

        console.log(`🏁 [Batch] Total init: ${(performance.now() - perfStart).toFixed(0)}ms`);
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        showToast("Erro ao carregar dados do dashboard", "error");
        // Reset lock on failure so we can try again
        isInitRef.current = null;
      } finally {
        setIsLoading(false);
        setIsTradesLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, showToast]);

  // OPTIMIZATION: Background load allHistory after critical phase completes
  // This makes Calendar and Reports tabs open instantly
  useEffect(() => {
    // Only trigger after init is complete and we have an account
    if (isLoading || !currentAccount) return;

    const currentAccountId = currentAccount.id;
    const storeHistory = useTradeStore.getState().allHistory;
    const storeAccountId = useTradeStore.getState().currentAccountId;

    // Skip if already have history for this account
    if (storeHistory.length > 0 && storeAccountId === currentAccountId) return;

    // Use requestIdleCallback for true background loading (or setTimeout fallback)
    const loadInBackground = () => {
      import("@/app/actions/trades").then(({ getTradeHistoryLiteAction }) => {
        getTradeHistoryLiteAction(currentAccountId)
          .then((history) => {
            // Only set if still on same account (user didn't navigate away)
            if (
              useTradeStore.getState().currentAccountId === currentAccountId ||
              !useTradeStore.getState().currentAccountId
            ) {
              useTradeStore.setState({
                allHistory: history,
                currentAccountId: currentAccountId,
              });
              console.log(`✅ Background history loaded: ${history.length} trades`);
            }
          })
          .catch((err) => {
            console.warn("Background history load failed:", err);
          });
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(loadInBackground, { timeout: 2000 });
    } else {
      setTimeout(loadInBackground, 500);
    }
  }, [isLoading, currentAccount]);

  return {
    // Account
    currentAccount,

    // Data
    trades,
    allHistory,
    totalCount,
    currentPage,
    entries,
    playbooks,
    serverMetrics,
    playbookStats,

    // State
    isLoading, // Kept for backwards compatibility (isTradesLoading)
    isTradesLoading,
    isStoreLoading: useTradeStore((state) => state.isLoading),
    isAccountReady,
    isAccountFound,
    sortDirection: useTradeStore((state) => state.sortDirection),
    filterAsset: useTradeStore((state) => state.filterAsset),
    loadingPhases: phases,

    // Actions
    loadTrades,
    loadPage,
    loadEntries,
    loadPlaybooks,
    setSortDirection: useTradeStore((state) => state.setSortDirection),
    setFilterAsset: useTradeStore((state) => state.setFilterAsset),
    loadCalendarData,
    loadReportsData,
    loadPlaybookStats,
  };
}
