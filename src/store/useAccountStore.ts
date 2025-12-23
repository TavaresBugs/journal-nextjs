import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account } from "@/types";
import {
  getAccountsAction,
  saveAccountAction,
  deleteAccountAction,
  updateAccountBalanceAction,
} from "@/app/actions/accounts";

interface AccountStore {
  accounts: Account[];
  currentAccountId: string | null;
  currentAccount: Account | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAccounts: () => Promise<void>;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  updateAccountBalance: (accountId: string, totalPnL: number) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  setCurrentAccount: (id: string) => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      currentAccountId: null,
      currentAccount: null,
      isLoading: false,
      error: null,

      loadAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const accounts = await getAccountsAction();
          set({ accounts, isLoading: false });

          // Refresh current account object if selected
          const { currentAccountId } = get();
          if (currentAccountId) {
            const current = accounts.find((a) => a.id === currentAccountId) || null;
            if (current) {
              set({ currentAccount: current });
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Error loading accounts:", error);
          set({ isLoading: false, error: message });
        }
      },

      addAccount: async (accountData) => {
        const { accounts } = get();
        // Optimistic update
        const tempId = crypto.randomUUID();
        const newAccount: Account = {
          ...accountData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ accounts: [...accounts, newAccount] });

        try {
          const result = await saveAccountAction(accountData);
          if (result.success && result.data) {
            set((state) => ({
              accounts: state.accounts.map((a) => (a.id === tempId ? result.data! : a)),
              // If this was the first account or set as current, update it
              currentAccount:
                state.currentAccountId === tempId ? result.data! : state.currentAccount,
            }));
          } else if (result.error) {
            throw new Error(result.error);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Error adding account:", error);
          set({ error: message, accounts }); // Rollback
        }
      },

      updateAccount: async (account) => {
        const { accounts, currentAccountId } = get();

        // Optimistic
        const updatedAccounts = accounts.map((acc) => (acc.id === account.id ? account : acc));
        set({
          accounts: updatedAccounts,
          currentAccount: currentAccountId === account.id ? account : get().currentAccount,
        });

        try {
          const result = await saveAccountAction(account);
          if (!result.success) {
            throw new Error(result.error);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Error updating account:", error);
          set({ error: message, accounts }); // Rollback
        }
      },

      updateAccountBalance: async (accountId: string, totalPnL: number) => {
        const { accounts } = get();
        const account = accounts.find((acc) => acc.id === accountId);

        if (!account) return;

        const newBalance = account.initialBalance + totalPnL;

        const updatedAccount: Account = {
          ...account,
          currentBalance: newBalance,
          updatedAt: new Date().toISOString(),
        };

        // Optimistic via updateAccount
        get().updateAccount(updatedAccount);

        // Persist logic is in updateAccount, but specific balance update logic exists in server
        // so we might want to ensure we call the specific action if needed, or rely on generic update
        // The detailed plan said `updateAccountBalance` action exists.

        try {
          const result = await updateAccountBalanceAction(accountId, newBalance);
          if (!result.success) throw new Error(result.error);
        } catch (error) {
          console.error("Error updating balance:", error);
          // Rollback handling complex here due to optimistic update call above
          // For now assuming updateAccount handles the view state
          get().loadAccounts();
        }
      },

      removeAccount: async (id: string) => {
        const { accounts, currentAccountId } = get();

        // Optimistic
        const filteredAccounts = accounts.filter((acc) => acc.id !== id);
        set({
          accounts: filteredAccounts,
          currentAccountId: currentAccountId === id ? null : currentAccountId,
          currentAccount: currentAccountId === id ? null : get().currentAccount,
        });

        try {
          const result = await deleteAccountAction(id);
          if (!result.success) throw new Error(result.error);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Error deleting account:", error);
          set({ error: message, accounts }); // Rollback
        }
      },

      setCurrentAccount: (id: string) => {
        const { accounts } = get();
        const account = accounts.find((acc) => acc.id === id);
        set({
          currentAccountId: id,
          currentAccount: account || null,
        });
      },
    }),
    {
      name: "account-storage",
      partialize: (state) => ({
        currentAccountId: state.currentAccountId,
      }),
    }
  )
);
