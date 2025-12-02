import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '@/types';
import { getAccounts, saveAccount, deleteAccount } from '@/lib/storage';

interface AccountStore {
    accounts: Account[];
    currentAccountId: string | null;
    currentAccount: Account | null;
    isLoading: boolean;

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

            loadAccounts: async () => {
                set({ isLoading: true });
                try {
                    const accounts = await getAccounts();
                    set({ accounts, isLoading: false });
                } catch (error) {
                    console.error('Error loading accounts:', error);
                    set({ isLoading: false });
                }
            },

            addAccount: async (account: Account) => {
                const { accounts } = get();
                await saveAccount(account);
                set({ accounts: [...accounts, account] });
            },

            updateAccount: async (account: Account) => {
                const { accounts, currentAccountId } = get();
                await saveAccount(account);

                const updatedAccounts = accounts.map(acc =>
                    acc.id === account.id ? account : acc
                );

                set({
                    accounts: updatedAccounts,
                    currentAccount: currentAccountId === account.id ? account : get().currentAccount
                });
            },

            updateAccountBalance: async (accountId: string, totalPnL: number) => {
                const { accounts } = get();
                const account = accounts.find(acc => acc.id === accountId);
                
                if (!account) return;

                const updatedAccount: Account = {
                    ...account,
                    currentBalance: account.initialBalance + totalPnL,
                    updatedAt: new Date().toISOString()
                };

                await get().updateAccount(updatedAccount);
            },

            removeAccount: async (id: string) => {
                const { accounts, currentAccountId } = get();
                await deleteAccount(id);

                const filteredAccounts = accounts.filter(acc => acc.id !== id);

                set({
                    accounts: filteredAccounts,
                    currentAccountId: currentAccountId === id ? null : currentAccountId,
                    currentAccount: currentAccountId === id ? null : get().currentAccount
                });
            },

            setCurrentAccount: (id: string) => {
                const { accounts } = get();
                const account = accounts.find(acc => acc.id === id);
                set({
                    currentAccountId: id,
                    currentAccount: account || null
                });
            },
        }),
        {
            name: 'account-storage',
            partialize: (state) => ({
                currentAccountId: state.currentAccountId
            }),
        }
    )
);
