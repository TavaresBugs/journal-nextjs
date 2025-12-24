"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { getTradeDashboardMetricsAction } from "@/app/actions/trades"; // Correct import

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
  const { currentAccount, setCurrentAccount } = useAccountStore();
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
      // Check if already initialized for this account
      if (isInitRef.current === accountId) {
        setIsLoading(false);
        return;
      }

      // Optimistic lock: prevent race conditions
      isInitRef.current = accountId;

      try {
        let currentAccounts = useAccountStore.getState().accounts;
        if (currentAccounts.length === 0) {
          await useAccountStore.getState().loadAccounts();
          currentAccounts = useAccountStore.getState().accounts;
        }

        const account = currentAccounts.find((acc) => acc.id === accountId);

        if (!account) {
          console.error("Account not found after loading:", accountId);
          setIsAccountFound(false);
          router.push("/");
          return;
        }

        setCurrentAccount(accountId);
        setIsAccountReady(true); // Account is ready, can render header

        // CRITICAL PHASE: Load Page 1 of trades AND Server Metrics in parallel
        // We use server metrics for the header to avoid loading full history
        const [metricsResult] = await Promise.all([
          getTradeDashboardMetricsAction(accountId),
          loadTrades(accountId),
        ]);

        if (metricsResult) {
          setServerMetrics(metricsResult);
        }
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
