"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAccountStore } from "@/store/useAccountStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  CreateAccountModal,
  EditAccountModal,
  SettingsModal,
} from "@/components/modals/DynamicModals";
import { AccountSelectionSkeleton } from "@/components/accounts/AccountSelectionSkeleton";
import { Button, IconActionButton } from "@/components/ui";
import type { Account } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { usePrefetchAccountData } from "@/hooks/usePrefetchAccountData";
import { getUserProfileAction, type UserProfile } from "@/app/actions/accounts";

export default function HomePage() {
  const router = useRouter();
  const { accounts, loadAccounts, addAccount, updateAccount, setCurrentAccount, removeAccount } =
    useAccountStore();
  const { loadSettings } = useSettingsStore();
  const { showToast } = useToast();
  const { signOut, user, loading: authLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { prefetchWithDelay } = usePrefetchAccountData();

  useEffect(() => {
    const init = async () => {
      // If still loading auth, don't try to load data yet
      if (authLoading) {
        return;
      }

      // If no user after auth is done, we're not logged in
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check network connectivity
      if (!navigator.onLine) {
        console.error("HomePage: No network connection");
        setDataError("Sem conexão com a internet. Verifique sua conexão.");
        setIsLoading(false);
        return;
      }

      // User is authenticated, load their data
      try {
        setDataError(null); // Clear any previous error

        // Timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout loading data")), 8000)
        );

        // Load accounts, settings, and user profile in parallel
        const [, , profile] = (await Promise.race([
          Promise.all([loadAccounts(), loadSettings(), getUserProfileAction()]),
          timeoutPromise,
        ])) as [void, void, UserProfile | null];

        setUserProfile(profile);

        // Fix for race condition (e.g. React Strict Mode or concurrent calls):
        // If store is still loading after loadAccounts returns (meaning we skipped due to "already loading"),
        // we must wait for the actual loading to finish before checking accounts.
        if (useAccountStore.getState().isLoading) {
          await new Promise<void>((resolve) => {
            const unsubscribe = useAccountStore.subscribe((state) => {
              if (!state.isLoading) {
                unsubscribe();
                resolve();
              }
            });
            // Safety timeout of 3s in case store gets stuck
            setTimeout(() => {
              unsubscribe();
              resolve();
            }, 3000);
          });
        }

        setIsLoading(false);

        // Sync all account balances in the background to ensure they're up to date
        // We don't block the UI for this
        import("@/app/actions/accounts").then(async ({ syncAllAccountsBalancesAction }) => {
          try {
            const syncResult = await syncAllAccountsBalancesAction();
            if (syncResult.syncedCount > 0) {
              console.log("Balances synced, reloading accounts...");
              // Reload accounts to reflect updated balances (force refresh)
              await loadAccounts({ force: true });
            }
          } catch (err) {
            console.error("Background sync error:", err);
          }
        });

        // Check if user has no accounts after fully confirming loading is done
        const currentAccounts = useAccountStore.getState().accounts;
        if (currentAccounts.length === 0) {
          setIsCreateModalOpen(true);
        }
      } catch (error) {
        console.error("Error initializing home page:", error);
        setDataError("Erro ao carregar dados. Tente recarregar a página.");
        setIsLoading(false);
      }
    };
    init();
  }, [loadAccounts, loadSettings, user, authLoading]);

  const handleCreateAccount = async (
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt" | "userId">
  ) => {
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      userId: "", // Will be set by storage
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addAccount(newAccount);
  };

  const handleEditAccount = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    setEditingAccount(account);
    setIsEditModalOpen(true);
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
    await updateAccount(updatedAccount);
  };

  const handleSelectAccount = (accountId: string) => {
    setCurrentAccount(accountId);
    router.push(`/dashboard/${accountId}`);
  };

  const handleDeleteAccount = async (
    e: React.MouseEvent,
    accountId: string,
    accountName: string
  ) => {
    e.stopPropagation();

    if (
      confirm(
        `Tem certeza que deseja excluir a carteira "${accountName}"?\n\nEsta ação excluirá permanentemente todos os trades, diários e imagens associados a esta conta.`
      )
    ) {
      await removeAccount(accountId);
      showToast("Carteira excluída com sucesso!", "success");
    }
  };

  if (authLoading || isLoading) {
    return <AccountSelectionSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Removed blocking gradient to show global background image */}
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] bg-size-[20px_20px] opacity-10" />

      <div className="relative z-10">
        {/* Dashboard-style blur header section - from top */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl px-4 py-6 md:px-6">
            {/* Error Banner */}
            {dataError && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/50 bg-red-500/10 p-4">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-6 w-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-medium text-red-400">{dataError}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => window.location.reload()}>
                  Recarregar
                </Button>
              </div>
            )}

            {/* Header - Avatar, Title, User info, Controls */}
            <div className="mb-6 flex items-center justify-between">
              {/* Left: Avatar + User info */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* User Avatar with connected indicator */}
                <div className="relative">
                  {userProfile?.avatarUrl || user?.avatar ? (
                    <Image
                      src={userProfile?.avatarUrl || user?.avatar || ""}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full border-2 border-gray-600 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-700 text-lg font-bold text-white shadow-lg">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  {/* Green connected indicator */}
                  <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500" />
                </div>
                {user && (
                  <div className="flex flex-col">
                    {/* Name - Priority: userProfile > OAuth */}
                    {(userProfile?.name || user.name) && (
                      <span className="text-sm font-medium text-gray-200 md:text-base">
                        {userProfile?.name || user.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 md:text-sm">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2">
                {/* Logout Button */}
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => signOut()}
                  title="Sair da Conta"
                  className="h-10 w-10 rounded-xl hover:text-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </Button>

                {/* Settings Button */}
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Configurações Globais"
                  className="h-10 w-10 rounded-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-spin-slow"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </Button>
              </div>
            </div>

            {/* Summary Cards - Dashboard-style gradient cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {/* Saldo Total - Takes full width on mobile, 1 col on desktop */}
              <div className="group col-span-2 flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/80 to-gray-800/40 p-4 text-center backdrop-blur-sm transition-colors hover:border-gray-600/50 md:col-span-1">
                <div className="mb-1.5 text-green-500 transition-colors group-hover:text-green-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:text-xs">
                  Saldo Total
                </p>
                <p className="max-w-full truncate text-lg font-bold text-gray-100 sm:text-xl md:text-2xl">
                  {formatCurrency(accounts.reduce((acc, curr) => acc + curr.currentBalance, 0))}
                </p>
              </div>

              {/* P&L Total */}
              <div className="group flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/80 to-gray-800/40 p-4 text-center backdrop-blur-sm transition-colors hover:border-gray-600/50">
                <div
                  className={`mb-1.5 transition-colors ${
                    accounts.reduce(
                      (acc, curr) => acc + (curr.currentBalance - curr.initialBalance),
                      0
                    ) >= 0
                      ? "text-green-500 group-hover:text-green-400"
                      : "text-red-500 group-hover:text-red-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <p className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:text-xs">
                  P&L Geral
                </p>
                <p
                  className={`max-w-full truncate text-sm font-bold sm:text-base md:text-lg ${
                    accounts.reduce(
                      (acc, curr) => acc + (curr.currentBalance - curr.initialBalance),
                      0
                    ) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(
                    accounts.reduce(
                      (acc, curr) => acc + (curr.currentBalance - curr.initialBalance),
                      0
                    )
                  )}
                </p>
              </div>

              {/* Carteiras Ativas */}
              <div className="group flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/80 to-gray-800/40 p-4 text-center backdrop-blur-sm transition-colors hover:border-gray-600/50">
                <div className="mb-1.5 text-cyan-500 transition-colors group-hover:text-cyan-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                </div>
                <p className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:text-xs">
                  Carteiras Ativas
                </p>
                <p className="text-sm font-bold text-cyan-400 sm:text-base md:text-lg">
                  {accounts.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Grid - below blur section */}
        <div className="container mx-auto max-w-6xl px-4 py-6 md:px-6">
          <h2 className="mb-6 text-2xl font-bold text-cyan-400">Suas Carteiras</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const pnl = account.currentBalance - account.initialBalance;
              const pnlPercent = (pnl / account.initialBalance) * 100;
              const isProfit = pnl >= 0;

              return (
                <div
                  key={account.id}
                  className="group relative cursor-pointer rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/80 to-gray-800/40 p-3 backdrop-blur-sm transition-all hover:border-gray-600/50"
                  onClick={() => handleSelectAccount(account.id)}
                  onMouseEnter={() => {
                    const { start } = prefetchWithDelay(account.id, 150);
                    start();
                  }}
                >
                  {/* Header: Title + Actions Toggle */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-100">{account.name}</h3>
                    <div className="flex items-center gap-1">
                      {/* Action buttons - visible only when expanded */}
                      <div
                        className={`flex gap-1 transition-all duration-200 ${
                          expandedCardId === account.id
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
                        }`}
                      >
                        <IconActionButton
                          variant="edit"
                          onClick={(e) => handleEditAccount(e, account)}
                        />
                        <IconActionButton
                          variant="delete"
                          onClick={(e) => handleDeleteAccount(e, account.id, account.name)}
                        />
                      </div>
                      {/* Chevron toggle button */}
                      <button
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          expandedCardId === account.id
                            ? "rotate-90 bg-cyan-500/20 text-cyan-400"
                            : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCardId(expandedCardId === account.id ? null : account.id);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div className="mb-2">
                    <p className="mb-0.5 text-[10px] tracking-wide text-gray-500 uppercase">
                      Saldo Atual
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-gray-100">
                        {formatCurrency(account.currentBalance, account.currency)}
                      </p>
                      {/* P&L Badge */}
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isProfit ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {isProfit ? (
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          ) : (
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                          )}
                        </svg>
                        {isProfit ? "+" : ""}
                        {pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* P&L Value */}
                  <div className="mb-2">
                    <p className="text-[10px] tracking-wide text-gray-500 uppercase">P&L Total</p>
                    <p
                      className={`text-base font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}
                    >
                      {isProfit ? "+" : ""}
                      {formatCurrency(pnl, account.currency)}
                    </p>
                  </div>

                  {/* Footer: Leverage & Max DD */}
                  <div className="grid grid-cols-2 gap-3 border-t border-gray-700/50 pt-2 text-xs">
                    <div>
                      <p className="text-xs tracking-wide text-gray-500 uppercase">Alavancagem</p>
                      <p className="font-medium text-gray-300">{account.leverage}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide text-gray-500 uppercase">Max DD</p>
                      <p className="font-medium text-gray-300">{account.maxDrawdown}%</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New Wallet Card */}
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
              className="group h-full w-full rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/20 p-3 transition-all duration-300 hover:border-cyan-500/50 hover:bg-gray-900/40"
            >
              <div className="flex h-full flex-col items-center justify-center py-4">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 transition-colors group-hover:bg-cyan-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 transition-colors group-hover:text-cyan-400"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-400 transition-colors group-hover:text-cyan-400">
                  Nova Carteira
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAccount={handleCreateAccount}
      />

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateAccount}
        account={editingAccount}
      />

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
}
