'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountStore } from '@/store/useAccountStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { Account } from '@/types';
import { formatCurrency } from '@/lib/calculations';

import { SettingsModal } from '@/components/settings/SettingsModal';

export default function HomePage() {
  const router = useRouter();
  const { accounts, loadAccounts, addAccount, setCurrentAccount, removeAccount } = useAccountStore();
  const { loadSettings } = useSettingsStore();
  const { showToast } = useToast();
  const { signOut, user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadAccounts(),
        loadSettings() // Load user settings on app init
      ]);
      setIsLoading(false);
    };
    init();
  }, [loadAccounts, loadSettings]);
  
  const handleCreateAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      userId: '', // Will be set by storage
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await addAccount(newAccount);
  };
  
  const handleSelectAccount = (accountId: string) => {
    setCurrentAccount(accountId);
    router.push(`/dashboard/${accountId}`);
  };

  const handleDeleteAccount = async (e: React.MouseEvent, accountId: string, accountName: string) => {
    e.stopPropagation();
    
    if (confirm(`Tem certeza que deseja excluir a carteira "${accountName}"?\n\nEsta ação excluirá permanentemente todos os trades, diários e imagens associados a esta conta.`)) {
      await removeAccount(accountId);
      showToast('Carteira excluída com sucesso!', 'success');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Removed blocking gradient to show global background image */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Box */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-800/50 rounded-xl flex items-center justify-center text-3xl border border-gray-700 shadow-inner">
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
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-950/30 border border-gray-700/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">{user.email}</span>
              </div>
            )}
            
            {/* Logout Button */}
            <button 
              onClick={() => signOut()}
              className="p-3 text-gray-400 hover:text-red-400 bg-gray-950/50 hover:bg-gray-900 border border-gray-700 hover:border-red-500/50 rounded-lg transition-all duration-200"
              title="Sair da Conta"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
            
            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-3 text-gray-400 hover:text-cyan-400 bg-gray-950/50 hover:bg-gray-900 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-200"
              title="Configurações Globais"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Summary Section - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">Saldo Total</p>
            <p className="text-3xl font-bold text-gray-100">
              {formatCurrency(accounts.reduce((acc, curr) => acc + curr.currentBalance, 0))}
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">P&L Geral</p>
            <p className={`text-3xl font-bold ${accounts.reduce((acc, curr) => acc + (curr.currentBalance - curr.initialBalance), 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(accounts.reduce((acc, curr) => acc + (curr.currentBalance - curr.initialBalance), 0))}
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">Carteiras Ativas</p>
            <p className="text-3xl font-bold text-cyan-400">
              {accounts.length}
            </p>
          </div>
        </div>

        {/* Accounts Section - Always visible */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-200">
            Suas Carteiras
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const pnl = account.currentBalance - account.initialBalance;
            const pnlPercent = (pnl / account.initialBalance) * 100;
            const isProfit = pnl >= 0;
            
            return (
              <Card 
                key={account.id} 
                hover
                onClick={() => handleSelectAccount(account.id)}
                className="relative group"
              >
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => handleDeleteAccount(e, account.id, account.name)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Excluir Carteira"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <CardHeader>
                  <CardTitle>{account.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Balance */}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Saldo Atual</p>
                    <p className="text-2xl font-bold text-gray-100">
                      {formatCurrency(account.currentBalance, account.currency)}
                    </p>
                  </div>
                  
                  {/* P&L */}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">P&L Total</p>
                    <p className={`text-lg font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(pnl, account.currency)} 
                      <span className="text-sm ml-2">
                        ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>
                  
                  {/* Details */}
                  <div className="pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Alavancagem:</span>
                      <p className="text-gray-300 font-medium">{account.leverage}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max DD:</span>
                      <p className="text-gray-300 font-medium">{account.maxDrawdown}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* New Wallet Card */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-800 hover:border-cyan-500/50 rounded-2xl bg-gray-900/20 hover:bg-gray-900/40 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 group-hover:bg-cyan-500/20 flex items-center justify-center mb-4 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="text-lg font-medium text-gray-400 group-hover:text-cyan-400 transition-colors">
              Nova Carteira
            </span>
          </button>
        </div>
      </div>
      
      <CreateAccountModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAccount={handleCreateAccount}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
