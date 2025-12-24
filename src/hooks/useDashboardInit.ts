"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToast } from "@/providers/ToastProvider";

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

  // State
  isLoading: boolean;
  isTradesLoading: boolean;
  isStoreLoading: boolean;
  isAccountReady: boolean;
  isAccountFound: boolean;
  sortDirection: "asc" | "desc";
  filterAsset: string;
}

export interface DashboardInitActions {
  loadPage: (accountId: string, page: number) => Promise<void>;
  loadTrades: (accountId: string) => Promise<void>;
  loadEntries: (accountId: string) => Promise<void>;
  loadPlaybooks: () => Promise<void>;
  setSortDirection: (accountId: string, direction: "asc" | "desc") => Promise<void>;
  setFilterAsset: (accountId: string, asset: string) => Promise<void>;
}

/**
 * Hook for initializing dashboard data.
 * Handles loading accounts, trades, entries, playbooks, and settings.
 * Also manages balance synchronization.
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

  // Store State
  const { currentAccount, setCurrentAccount, updateAccountBalance } = useAccountStore();
  const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage } = useTradeStore();
  const { entries, loadEntries } = useJournalStore();
  const { playbooks, loadPlaybooks } = usePlaybookStore();
  const { loadSettings } = useSettingsStore();

  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [isTradesLoading, setIsTradesLoading] = useState(true);
  const [isAccountReady, setIsAccountReady] = useState(false);
  const [isAccountFound, setIsAccountFound] = useState(true);

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

      // Optimistic lock: prevent race conditions (e.g. StrictMode)
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

        await Promise.all([
          loadTrades(accountId),
          loadEntries(accountId),
          loadPlaybooks(),
          loadSettings(),
        ]);
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

  // Balance Update Effect
  // Calculate total PnL with memoization to avoid effect dependencies on array
  const totalPnL = useMemo(() => {
    return allHistory.reduce((sum, trade) => {
      return sum + (trade.pnl || 0);
    }, 0);
  }, [allHistory]);

  // Balance Update Effect
  // Check difference with epsilon to avoid floating point loops
  // Balance Update Effect - Run ONLY ONCE on init to fix potential drifts
  // We rely on trade actions to keep balance updated in real-time
  const isSyncedRef = useRef(false);

  useEffect(() => {
    if (!currentAccount || isLoading) return;

    // Prevent multiple syncs causing infinite loops
    if (isSyncedRef.current) return;

    const currentBal = Number(currentAccount.currentBalance);
    const initBal = Number(currentAccount.initialBalance);
    const pnl = Number(totalPnL);

    if (isNaN(currentBal) || isNaN(initBal) || isNaN(pnl)) return;

    const expectedBalance = initBal + pnl;

    // Only update if difference is significant (> 0.01)
    if (Math.abs(currentBal - expectedBalance) > 0.01) {
      console.log("[DashboardInit] Syncing balance (One-time):", {
        current: currentBal,
        expected: expectedBalance,
      });
      updateAccountBalance(accountId, pnl);
    }

    // Mark as synced so we don't try again until full reload
    isSyncedRef.current = true;
  }, [totalPnL, currentAccount, isLoading, accountId, updateAccountBalance]);

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

    // State
    isLoading, // Kept for backwards compatibility (isTradesLoading)
    isTradesLoading,
    isStoreLoading: useTradeStore((state) => state.isLoading),
    isAccountReady,
    isAccountFound,
    sortDirection: useTradeStore((state) => state.sortDirection),
    filterAsset: useTradeStore((state) => state.filterAsset),

    // Actions
    loadTrades,
    loadPage,
    loadEntries: useJournalStore.getState().loadEntries,
    loadPlaybooks: usePlaybookStore.getState().loadPlaybooks,
    setSortDirection: useTradeStore((state) => state.setSortDirection),
    setFilterAsset: useTradeStore((state) => state.setFilterAsset),
  };
}
