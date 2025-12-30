"use client";

import { useState, useEffect, useRef } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import {
  batchDashboardInitAction,
  type DashboardInitResult,
} from "@/app/actions/_batch/dashboardInit";

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

  // Metrics (Server-Side) - Type matches DashboardInitResult["metrics"]
  serverMetrics: {
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    totalPnl: number;
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
  loadHistoryForMonth: (date: Date) => Promise<void>; // New
}

/**
 * Hook for initializing dashboard data.
 * Handles loading accounts, trades, entries, playbooks, and settings.
 * Now uses Server Actions for aggregated metrics to avoid loading full history.
 *
 * @param accountId - The account ID to initialize
 * @param isValidAccount - Whether the account ID format is valid
 * @param initialData - Optional full data prefetched from server component (LCP optimization)
 * @returns Dashboard data, loading states, and action handlers
 */
export function useDashboardInit(
  accountId: string,
  isValidAccount: boolean,
  initialData?: DashboardInitResult
): DashboardInitData & DashboardInitActions {
  const { showToast } = useToast();

  // Stratified Loading
  const {
    phases,
    loadCalendarData,
    loadReportsData,
    playbookStats,
    loadPlaybookStats,
    loadHistoryForMonth,
  } = useStratifiedLoading(accountId);

  // Store State
  const { currentAccount } = useAccountStore();
  const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage } = useTradeStore();
  const { entries, loadEntries } = useJournalStore();
  const { playbooks, loadPlaybooks } = usePlaybookStore();

  // Local State - If initialData exists, start with everything ready
  const [isLoading, setIsLoading] = useState(!initialData?.account);
  // If we have initial trades, we are not loading trades
  const [isTradesLoading, setIsTradesLoading] = useState(!initialData?.trades);
  const [isAccountReady, setIsAccountReady] = useState(!!initialData?.account);
  const [isAccountFound, setIsAccountFound] = useState(true);
  const [serverMetrics, setServerMetrics] = useState<DashboardInitResult["metrics"]>(
    initialData?.metrics || null
  );

  // Refs
  const isInitRef = useRef<string | null>(null);

  // LCP OPTIMIZATION: If initialData exists, inject it into store immediately
  // This must run before effects to ensure render consistency
  if (initialData?.account && !useAccountStore.getState().currentAccount) {
    // Direct store manipulation for hydration before mount/effect if possible,
    // or rely on the effect below. React 18 concurrent mode prefers effects or specific hydration flow.
    // But for this LCP fix, we want data avail immediately.
  }

  useEffect(() => {
    if (initialData?.account) {
      // Inject Account
      useAccountStore.setState((state) => ({
        accounts: state.accounts.some((a) => a.id === accountId)
          ? state.accounts
          : [...state.accounts, initialData.account!],
        currentAccount: initialData.account,
        currentAccountId: accountId,
      }));
      setIsAccountReady(true);

      // Inject Trades
      if (initialData.trades) {
        useTradeStore.setState({
          trades: initialData.trades.data,
          totalCount: initialData.trades.count,
          currentPage: 1,
        });
        setIsTradesLoading(false);
      }

      // Inject Metrics
      if (initialData.metrics) {
        setServerMetrics(initialData.metrics);
      }

      console.log("⚡ [LCP] Initial data injected into store");
    }
  }, [initialData, accountId]);

  // Initialization Effect
  useEffect(() => {
    if (!isValidAccount) {
      setIsLoading(false);
      return;
    }

    // Skip if we already have initialData for this account
    if (initialData?.account && initialData.account.id === accountId) {
      return;
    }

    const init = async () => {
      // RESET: Clear previous init state when switching accounts
      if (isInitRef.current && isInitRef.current !== accountId) {
        isInitRef.current = null;
        setServerMetrics(null); // Clear old metrics
        setIsTradesLoading(true);
      }

      // Check if already initialized for this account
      if (isInitRef.current === accountId) {
        // Already initializing, let the running effect handle it
        return;
      }

      // Optimistic lock: prevent race conditions
      isInitRef.current = accountId;

      try {
        // Check if we have cached account data first (fallback if no initialData)
        let account = useAccountStore.getState().accounts.find((acc) => acc.id === accountId);

        if (account) {
          // Fast path: Account cached
          useAccountStore.getState().setCurrentAccount(accountId);
          setIsAccountReady(true);

          // Still need to fetch fresh metrics and trades
          try {
            const batchResult = await batchDashboardInitAction(accountId, 1, 10, true);
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
          }
        } else {
          // Slow path: Need full batch fetch
          const batchResult = await batchDashboardInitAction(accountId, 1, 10);

          if (!batchResult) {
            console.error("Batch init failed");
            showToast("Erro de conexão. Tente recarregar.", "error");
            setIsLoading(false);
            return;
          }

          if (!batchResult.account) {
            // Account not found - show error state instead of redirecting
            // (middleware handles auth redirects server-side)
            setIsAccountFound(false);
            showToast("Conta não encontrada.", "error");
            return;
          }

          account = batchResult.account;

          // Inject account
          useAccountStore.setState((state) => ({
            accounts: state.accounts.some((a) => a.id === accountId)
              ? state.accounts
              : [...state.accounts, batchResult.account!],
            currentAccount: batchResult.account,
            currentAccountId: accountId,
          }));

          setIsAccountReady(true);

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
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        showToast("Erro ao carregar dados do dashboard", "error");
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
  // NOTE: Now loads only last 12 months to reduce data transfer for large accounts
  useEffect(() => {
    // Only trigger after init is complete and we have an account
    if (isLoading || !currentAccount) return;

    const currentAccountId = currentAccount.id;
    const storeHistory = useTradeStore.getState().allHistory;
    const storeAccountId = useTradeStore.getState().currentAccountId;

    // Skip if already have history for this account
    if (storeHistory.length > 0 && storeAccountId === currentAccountId) return;

    // RACE PROTECTION: Skip if another load is in progress
    if (useTradeStore.getState().isLoadingHistory) return;

    // Use requestIdleCallback for true background loading (or setTimeout fallback)
    const loadInBackground = () => {
      // Mark as loading BEFORE starting
      useTradeStore.setState({ isLoadingHistory: true, currentAccountId: currentAccountId });

      import("@/app/actions/trades").then(({ getTradeHistoryLiteAction }) => {
        // Calculate date range for last 12 months for performance
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const dateFrom = oneYearAgo.toISOString().split("T")[0];
        const dateTo = now.toISOString().split("T")[0];

        getTradeHistoryLiteAction(currentAccountId, { dateFrom, dateTo })
          .then((history) => {
            // Only set if still on same account (user didn't navigate away)
            if (
              useTradeStore.getState().currentAccountId === currentAccountId ||
              !useTradeStore.getState().currentAccountId
            ) {
              useTradeStore.setState({
                allHistory: history,
                currentAccountId: currentAccountId,
                isLoadingHistory: false,
              });
              console.log(
                `✅ Background history loaded: ${history.length} trades (last 12 months)`
              );
            } else {
              useTradeStore.setState({ isLoadingHistory: false });
            }
          })
          .catch((err) => {
            console.warn("Background history load failed:", err);
            useTradeStore.setState({ isLoadingHistory: false });
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
    loadHistoryForMonth,
  };
}
