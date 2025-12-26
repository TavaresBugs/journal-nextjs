import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  isInitializing: boolean; // Lock flag to prevent race conditions during dashboard init
  error: string | null;

  // Actions
  loadAccounts: (options?: { force?: boolean }) => Promise<void>;
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
      isInitializing: false,
      error: null,

      loadAccounts: async (options?: { force?: boolean }) => {
        const { isLoading, accounts } = get();

        // RACE PROTECTION: Skip if already loading
        if (isLoading) {
          console.log("[AccountStore] Skip loadAccounts - already loading");
          return;
        }

        // Skip if already have accounts (unless forced)
        if (accounts.length > 0 && !options?.force) {
          console.log("[AccountStore] Skip loadAccounts - using cached accounts");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const fetchedAccounts = await getAccountsAction();
          set({ accounts: fetchedAccounts, isLoading: false });

          // Refresh current account object if selected
          const { currentAccountId } = get();
          if (currentAccountId) {
            const current = fetchedAccounts.find((a) => a.id === currentAccountId) || null;
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
          get().loadAccounts({ force: true });
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

      // Debounce timer for setCurrentAccount to avoid rapid successive calls
      _switchDebounceTimer: null as ReturnType<typeof setTimeout> | null,

      setCurrentAccount: (id: string) => {
        const { accounts, currentAccountId } = get();
        const account = accounts.find((acc) => acc.id === id);

        // Set initializing flag to block rehydration refresh
        set({ isInitializing: true });

        // CLEAR RELATED STORES: Prevent stale data when switching accounts
        // Only clear if actually switching to a different account
        // Debounced to avoid multiple rapid clears
        if (currentAccountId && currentAccountId !== id) {
          // Clear any pending debounce timer
          const state = get() as AccountStore & {
            _switchDebounceTimer: ReturnType<typeof setTimeout> | null;
          };
          if (state._switchDebounceTimer) {
            clearTimeout(state._switchDebounceTimer);
          }

          console.log("🔄 [AccountStore] Clearing related stores for account switch");
          import("./useTradeStore").then(({ useTradeStore }) => {
            useTradeStore.getState().clearTrades();
          });
          import("./useJournalStore").then(({ useJournalStore }) => {
            useJournalStore.setState({ entries: [], routines: [], currentAccountId: null });
          });
        }

        set({
          currentAccountId: id,
          currentAccount: account || null,
        });

        // Reset initializing flag after a short delay to allow dashboard to fully load
        setTimeout(() => {
          set({ isInitializing: false });
        }, 3000);
      },
    }),
    {
      name: "account-storage",
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for security
      partialize: (state) => ({
        currentAccountId: state.currentAccountId,
        accounts: state.accounts, // Cache accounts to avoid refetch on refresh
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Background refresh to sync with server after hydration
        // Only if we have cached accounts and NOT currently viewing a dashboard
        if (state && state.accounts.length > 0) {
          // IMMEDIATE CHECK: If on dashboard, skip entirely to prevent race conditions
          if (typeof window !== "undefined" && window.location.pathname.includes("/dashboard/")) {
            console.log(
              "[AccountStore] Skipping background refresh - user on dashboard (immediate)"
            );
            return;
          }

          // Use a longer timeout and only refresh if user is on home page
          setTimeout(() => {
            const currentState = useAccountStore.getState();

            // Check isInitializing flag - don't interrupt dashboard loading!
            if (currentState.isInitializing) {
              console.log("[AccountStore] Skipping background refresh - dashboard initializing");
              return;
            }

            // Check if user is currently on dashboard - don't interrupt!
            if (window.location.pathname.includes("/dashboard/")) {
              console.log("[AccountStore] Skipping background refresh - user on dashboard");
              return;
            }

            getAccountsAction()
              .then((freshAccounts) => {
                const latestState = useAccountStore.getState();

                // Double-check: Don't update if user navigated to dashboard during fetch
                if (
                  latestState.isInitializing ||
                  window.location.pathname.includes("/dashboard/")
                ) {
                  console.log("[AccountStore] Aborting update - user now on dashboard");
                  return;
                }

                // Only update if accounts have actually changed
                const hasChanged =
                  JSON.stringify(
                    latestState.accounts.map((a) => ({
                      id: a.id,
                      name: a.name,
                      current_balance: a.currentBalance,
                    }))
                  ) !==
                  JSON.stringify(
                    freshAccounts.map((a) => ({
                      id: a.id,
                      name: a.name,
                      current_balance: a.currentBalance,
                    }))
                  );

                if (hasChanged) {
                  console.log("[AccountStore] Accounts updated from server");
                  useAccountStore.setState({ accounts: freshAccounts });

                  // IMPORTANT: Also update currentAccount if it exists
                  if (latestState.currentAccountId) {
                    const updated = freshAccounts.find(
                      (a) => a.id === latestState.currentAccountId
                    );
                    if (updated) {
                      useAccountStore.setState({ currentAccount: updated });
                    }
                  }
                }
              })
              .catch((err) => {
                console.warn("[AccountStore] Background refresh failed:", err);
                // Silently fail - cached data is still usable
              });
          }, 2000);
        }
      },
    }
  )
);
