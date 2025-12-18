"use client";

import { useCallback } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useToast } from "@/providers/ToastProvider";
import type { Trade } from "@/types";

export interface DashboardActions {
  // Trade Actions
  handleCreateTrade: (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  handleUpdateTrade: (trade: Trade) => Promise<void>;
  handleDeleteTrade: (tradeId: string) => Promise<void>;
  handleDeleteAllTrades: () => Promise<void>;

  // Balance Actions
  handleUpdateBalance: (newBalance: number) => Promise<void>;

  // Playbook Actions
  handlePlaybookCreated: () => Promise<void>;
  handleUpdatePlaybook: () => Promise<void>;
  handleDeletePlaybook: (playbookId: string) => Promise<void>;
  handleShareSuccess: () => void;
}

/**
 * Custom hook for dashboard action handlers.
 * Encapsulates all CRUD operations and side effects.
 *
 * @param accountId - The account ID for context
 * @param callbacks - Optional callbacks for UI state updates
 * @returns Action handlers
 */
export function useDashboardActions(
  accountId: string,
  callbacks?: {
    onTradeCreated?: () => void;
    onTradeDeleted?: () => void;
    onPlaybookUpdated?: () => void;
    onBalanceUpdated?: () => void;
  }
): DashboardActions {
  const { showToast } = useToast();

  // Store actions
  const { addTrade, updateTrade, removeTrade, loadTrades } = useTradeStore();
  const { currentAccount, updateAccount } = useAccountStore();
  const { loadPlaybooks, removePlaybook } = usePlaybookStore();
  const allHistory = useTradeStore((state) => state.allHistory);

  // Trade Actions
  const handleCreateTrade = useCallback(
    async (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
      const newTrade: Trade = {
        ...tradeData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Trade;

      await addTrade(newTrade);
      callbacks?.onTradeCreated?.();
    },
    [addTrade, callbacks]
  );

  const handleUpdateTrade = useCallback(
    async (trade: Trade) => {
      await updateTrade(trade);
    },
    [updateTrade]
  );

  const handleDeleteTrade = useCallback(
    async (tradeId: string) => {
      if (!confirm("⚠️ Tem certeza que deseja excluir este trade?")) {
        return;
      }
      try {
        await removeTrade(tradeId, accountId);
        showToast("Trade excluído com sucesso!", "success");
        callbacks?.onTradeDeleted?.();
      } catch (error) {
        console.error("Error deleting trade:", error);
        showToast("Erro ao excluir trade", "error");
      }
    },
    [removeTrade, accountId, showToast, callbacks]
  );

  // Balance Actions
  const handleUpdateBalance = useCallback(
    async (newBalance: number) => {
      if (!currentAccount) return;

      const totalPnL = allHistory.reduce((sum, trade) => {
        return sum + (trade.pnl || 0);
      }, 0);

      const newInitialBalance = newBalance - totalPnL;

      const updatedAccount = {
        ...currentAccount,
        initialBalance: newInitialBalance,
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      };

      await updateAccount(updatedAccount);
      showToast("Saldo atualizado com sucesso!", "success");
      callbacks?.onBalanceUpdated?.();
    },
    [currentAccount, allHistory, updateAccount, showToast, callbacks]
  );

  // Playbook Actions
  const handlePlaybookCreated = useCallback(async () => {
    await loadPlaybooks();
  }, [loadPlaybooks]);

  const handleUpdatePlaybook = useCallback(async () => {
    await loadPlaybooks();
    showToast("Playbook atualizado com sucesso!", "success");
    callbacks?.onPlaybookUpdated?.();
  }, [loadPlaybooks, showToast, callbacks]);

  const handleDeletePlaybook = useCallback(
    async (playbookId: string) => {
      try {
        await removePlaybook(playbookId);
        showToast("Playbook excluído com sucesso!", "success");
      } catch (error) {
        console.error("Error deleting playbook:", error);
        showToast("Erro ao excluir playbook.", "error");
      }
    },
    [removePlaybook, showToast]
  );

  const handleShareSuccess = useCallback(() => {
    showToast("Playbook compartilhado com sucesso!", "success");
  }, [showToast]);

  // Bulk Actions
  const handleDeleteAllTrades = useCallback(async () => {
    try {
      for (const trade of allHistory) {
        await removeTrade(trade.id, accountId);
      }
      showToast("Todos os trades foram deletados!", "success");
      loadTrades(accountId);
    } catch (error) {
      console.error("Error deleting all trades:", error);
      showToast("Erro ao deletar trades", "error");
    }
  }, [allHistory, removeTrade, accountId, showToast, loadTrades]);

  return {
    handleCreateTrade,
    handleUpdateTrade,
    handleDeleteTrade,
    handleDeleteAllTrades,
    handleUpdateBalance,
    handlePlaybookCreated,
    handleUpdatePlaybook,
    handleDeletePlaybook,
    handleShareSuccess,
  };
}
