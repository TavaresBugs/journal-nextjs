"use client";

import { useState, useEffect, useRef } from "react";
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
  isAccountFound: boolean;
}

export interface DashboardInitActions {
  loadPage: (accountId: string, page: number) => Promise<void>;
  loadTrades: (accountId: string) => Promise<void>;
  loadEntries: (accountId: string) => Promise<void>;
  loadPlaybooks: () => Promise<void>;
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
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, showToast]);

  // Balance Update Effect
  useEffect(() => {
    if (!currentAccount || isLoading) return;

    const totalPnL = allHistory.reduce((sum, trade) => {
      return sum + (trade.pnl || 0);
    }, 0);

    const expectedBalance = currentAccount.initialBalance + totalPnL;
    if (Math.abs(currentAccount.currentBalance - expectedBalance) > 0.001) {
      updateAccountBalance(accountId, totalPnL);
    }
  }, [allHistory.length, accountId, currentAccount, isLoading, allHistory, updateAccountBalance]);

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
    isLoading,
    isAccountFound,

    // Actions
    loadPage,
    loadTrades,
    loadEntries,
    loadPlaybooks,
  };
}
