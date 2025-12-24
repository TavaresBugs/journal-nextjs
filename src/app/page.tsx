"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/useAccountStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { EditAccountModal } from "@/components/accounts/EditAccountModal";
import { CreateAccountModal } from "@/components/accounts/CreateAccountModal";
import { AccountSelectionSkeleton } from "@/components/accounts/AccountSelectionSkeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  IconActionButton,
} from "@/components/ui";
import type { Account } from "@/types";
import { formatCurrency } from "@/lib/calculations";

import { SettingsModal } from "@/components/settings/SettingsModal";

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

        await Promise.race([Promise.all([loadAccounts(), loadSettings()]), timeoutPromise]);

        // Sync all account balances to ensure they're up to date
        const { syncAllAccountsBalancesAction } = await import("@/app/actions/accounts");
        const syncResult = await syncAllAccountsBalancesAction();
        if (syncResult.syncedCount > 0) {
          // Reload accounts to reflect updated balances
          await loadAccounts();
        }

        // Check if user has no accounts after loading
        const currentAccounts = useAccountStore.getState().accounts;
        if (currentAccounts.length === 0) {
          setIsCreateModalOpen(true);
        }
      } catch (error) {
        console.error("Error initializing home page:", error);
        setDataError("Erro ao carregar dados. Tente recarregar a página.");
      } finally {
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
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] [background-size:20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-6">
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

        {/* Header Box */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur-sm md:flex-row">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-700 bg-gray-800/50 text-3xl shadow-inner">
              💼
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">Minhas Carteiras</h1>
              <p className="text-gray-400">Gerenciador Multi-Contas</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="hidden items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-950/30 px-3 py-2 md:flex">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-400">{user.email}</span>
              </div>
            )}

            {/* Logout Button */}
            <Button
              variant="primary"
              size="icon"
              onClick={() => signOut()}
              title="Sair da Conta"
              className="h-12 w-12 rounded-xl hover:!text-red-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              className="h-12 w-12 rounded-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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

        {/* Summary Section - Always visible */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
            <p className="mb-1 text-sm text-gray-400">Saldo Total</p>
            <p className="text-3xl font-bold text-gray-100">
              {formatCurrency(accounts.reduce((acc, curr) => acc + curr.currentBalance, 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
            <p className="mb-1 text-sm text-gray-400">P&L Geral</p>
            <p
              className={`text-3xl font-bold ${accounts.reduce((acc, curr) => acc + (curr.currentBalance - curr.initialBalance), 0) >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {formatCurrency(
                accounts.reduce((acc, curr) => acc + (curr.currentBalance - curr.initialBalance), 0)
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
            <p className="mb-1 text-sm text-gray-400">Carteiras Ativas</p>
            <p className="text-3xl font-bold text-cyan-400">{accounts.length}</p>
          </div>
        </div>

        {/* Accounts Section - Always visible */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-200">Suas Carteiras</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const pnl = account.currentBalance - account.initialBalance;
            const pnlPercent = (pnl / account.initialBalance) * 100;
            const isProfit = pnl >= 0;

            return (
              <Card
                key={account.id}
                hover
                onClick={() => handleSelectAccount(account.id)}
                className="group relative"
              >
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Edit Button */}
                  <IconActionButton variant="edit" onClick={(e) => handleEditAccount(e, account)} />

                  {/* Delete Button */}
                  <IconActionButton
                    variant="delete"
                    onClick={(e) => handleDeleteAccount(e, account.id, account.name)}
                  />
                </div>
                <CardHeader>
                  <CardTitle>{account.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Balance */}
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Saldo Atual</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {formatCurrency(account.currentBalance, account.currency)}
                    </p>
                  </div>

                  {/* P&L */}
                  <div>
                    <p className="mb-1 text-sm text-gray-400">P&L Total</p>
                    <p
                      className={`text-lg font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}
                    >
                      {isProfit ? "+" : ""}
                      {formatCurrency(pnl, account.currency)}
                      <span className="ml-2 text-sm">
                        ({isProfit ? "+" : ""}
                        {pnlPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-700 pt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Alavancagem:</span>
                      <p className="font-medium text-gray-300">{account.leverage}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max DD:</span>
                      <p className="font-medium text-gray-300">{account.maxDrawdown}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* New Wallet Card */}
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="group h-full min-h-[300px] w-full rounded-2xl border-2 border-dashed border-gray-800 bg-gray-900/20 p-0 transition-all duration-300 hover:border-cyan-500/50 hover:bg-gray-900/40"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 transition-colors group-hover:bg-cyan-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
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
              <span className="text-lg font-medium text-gray-400 transition-colors group-hover:text-cyan-400">
                Nova Carteira
              </span>
            </div>
          </Button>
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
