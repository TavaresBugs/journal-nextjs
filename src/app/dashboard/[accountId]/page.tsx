'use client';

import { use, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isAdmin } from '@/services/adminService';
import { isMentor } from '@/services/mentor/inviteService';
import { useToast } from '@/contexts/ToastContext';
import { CreateTradeModal } from '@/components/trades/CreateTradeModal';
import { EditTradeModal } from '@/components/trades/EditTradeModal';
import { TradeList } from '@/components/trades/TradeList';
import { TradeCalendar } from '@/components/trades/TradeCalendar';
import { TradeForm } from '@/components/trades/TradeForm';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { PlaybookGrid } from '@/components/playbook/PlaybookGrid';
import { CreatePlaybookModal } from '@/components/playbook/CreatePlaybookModal';
import { EditPlaybookModal } from '@/components/playbook/EditPlaybookModal';
import { ViewPlaybookModal } from '@/components/playbook/ViewPlaybookModal';
import { SharePlaybookModal } from '@/components/playbook/SharePlaybookModal';
import { DayDetailModal } from '@/components/journal/DayDetailModal';
import { ChecklistFab } from '@/components/checklist';
import { MentalButton } from '@/components/mental';
import { Card, CardHeader, CardTitle, CardContent, Button, GlassCard } from '@/components/ui';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { NotificationBell } from '@/components/notifications';
import { ImportModal } from '@/components/import/ImportModal';
import type { Trade, Playbook } from '@/types';
import { 
    formatCurrency, 
    calculateTradeMetrics,
    calculateSharpeRatio,
    calculateCalmarRatio,
    calculateAverageHoldTime,
    calculateConsecutiveStreaks,
    formatTimeMinutes
} from '@/lib/calculations';
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('@/components/reports/Charts').then(mod => mod.Charts), { 
    ssr: false,
    loading: () => <div className="text-center py-10 text-gray-500">Carregando gráficos...</div>
});

// Validate if accountId is a valid UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function DashboardPage({ params, searchParams }: { params: Promise<{ accountId: string }>, searchParams: Promise<{ date?: string }> }) {
    const router = useRouter();
    // Unwrap params Promise using React.use()
    const { accountId } = use(params);
    const { date: queryDate } = use(searchParams);

    // uuidRegex definition removed from here

    useEffect(() => {
        if (!uuidRegex.test(accountId)) {
            // Redirect if invalid UUID format to prevent processing
            router.push('/');
        }
    }, [accountId, router]);

    // Handle Deep Linking
    useEffect(() => {
        if (queryDate) {
            setSelectedDate(queryDate);
            setIsDayDetailModalOpen(true);
        }
    }, [queryDate]);


    
    const { accounts, currentAccount, setCurrentAccount, updateAccountBalance, updateAccount } = useAccountStore();
    const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage, addTrade, updateTrade, removeTrade } = useTradeStore();
    const { entries, loadEntries } = useJournalStore();
    const { playbooks, loadPlaybooks, removePlaybook } = usePlaybookStore();
    const { loadSettings } = useSettingsStore();
    const { showToast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCreatePlaybookModalOpen, setIsCreatePlaybookModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | null>(null);
    const [sharingPlaybook, setSharingPlaybook] = useState<Playbook | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [activeTab, setActiveTab] = useState('novo');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isMentorUser, setIsMentorUser] = useState(false);
    


    const streakMetrics = useMemo(() => {
        // Combine dates from trades and journal entries
        const tradeDates = allHistory.map(t => t.entryDate.split('T')[0]);
        const journalDates = entries.map(e => e.date);
        
        // Create a unique sorted list of all activity dates
        const dates = Array.from(new Set([...tradeDates, ...journalDates])).sort();
        const daysAccessed = dates.length;
        
        if (dates.length === 0) return { daysAccessed: 0, streak: 0 };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDate = dates[dates.length - 1];

        // Se a última atividade não foi hoje nem ontem, a sequência quebrou
        if (lastDate !== todayStr && lastDate !== yesterdayStr) return { daysAccessed, streak: 0 };

        let streak = 1;
        for (let i = dates.length - 1; i > 0; i--) {
            const current = new Date(dates[i]);
            const prev = new Date(dates[i-1]);
            const diffTime = Math.abs(current.getTime() - prev.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) streak++;
            else break;
        }
        return { daysAccessed, streak };
    }, [allHistory, entries]);

    // Track if we have already initialized data for this account
    const isInitRef = useRef<string | null>(null);

    useEffect(() => {
        const init = async () => {
            // Prevent double initialization for same account
            if (isInitRef.current === accountId) {
                // If it's already initialized but we are just re-rendering, 
                // ensure loading is off and return
                setIsLoading(false);
                return;
            }

            try {
                // 1. Ensure accounts are loaded
                // Use getState to avoid dependency cycle if we just want to check current state
                let currentAccounts = useAccountStore.getState().accounts;
                if (currentAccounts.length === 0) {
                    await useAccountStore.getState().loadAccounts();
                    currentAccounts = useAccountStore.getState().accounts;
                }

                // 2. Find account
                const account = currentAccounts.find(acc => acc.id === accountId);
                
                if (!account) {
                    console.error('Account not found after loading:', accountId);
                    router.push('/');
                    return;
                }

                // 3. Load data
                setCurrentAccount(accountId);
                
                // Load data in parallel
                await Promise.all([
                    loadTrades(accountId),
                    loadEntries(accountId),
                    loadPlaybooks(),
                    loadSettings()
                ]);

                // Check if user is admin or mentor
                const [adminStatus, mentorStatus] = await Promise.all([
                    isAdmin(),
                    isMentor()
                ]);
                setIsAdminUser(adminStatus);
                setIsMentorUser(mentorStatus);
                
                // Mark as initialized for this account
                isInitRef.current = accountId;

            } catch (error) {
                console.error('Error initializing dashboard:', error);
                showToast('Erro ao carregar dados do dashboard', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        init();
        // accounts.length is stable enough for this initialization effect
    }, [accountId, accounts.length, setCurrentAccount, loadTrades, loadEntries, loadPlaybooks, loadSettings, router, showToast]);

    // Update account balance when trades change - with debounce to prevent loops
    useEffect(() => {
        if (!currentAccount || isLoading) return;

        const totalPnL = allHistory.reduce((sum, trade) => {
            return sum + (trade.pnl || 0);
        }, 0);

        // Only update if balance actually changed
        const expectedBalance = currentAccount.initialBalance + totalPnL;
        if (Math.abs(currentAccount.currentBalance - expectedBalance) > 0.001) {
            updateAccountBalance(accountId, totalPnL);
        }
    }, [allHistory.length, accountId, currentAccount, isLoading, allHistory, updateAccountBalance]);



    const handleCreateTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTrade: Trade = {
            ...tradeData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await addTrade(newTrade);
        setActiveTab('lista'); // Switch to list tab after creating
    };

    const handleEditTrade = (trade: Trade) => {
        // Use existing trade data directly - no need to fetch again
        // The trade object already has all the necessary fields
        setSelectedTrade(trade);
        setIsEditModalOpen(true);
    };

    const handleUpdateTrade = async (trade: Trade) => {
        await updateTrade(trade);
        // TradeForm handles closing the modal and showing toast
        setSelectedTrade(null);
    };

    const handleDeleteTrade = async (tradeId: string) => {
        if (!confirm('⚠️ Tem certeza que deseja excluir este trade?')) {
            return;
        }
        
        try {
            await removeTrade(tradeId, accountId);
            showToast('Trade excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting trade:', error);
            showToast('Erro ao excluir trade', 'error');
        }
    };

    // const _handlePlaybookCreated = async () => {
    //    await loadPlaybooks();
    //    showToast('Playbook criado com sucesso!', 'success');
    // };

    const handleEditPlaybook = (playbook: Playbook) => {
        setEditingPlaybook(playbook);
    };

    const handleViewPlaybook = (playbook: Playbook) => {
        setViewingPlaybook(playbook);
    };

    const handleUpdatePlaybook = async () => {
        await loadPlaybooks();
        showToast('Playbook atualizado com sucesso!', 'success');
        setEditingPlaybook(null);
    };

    const handleDeletePlaybook = async (playbookId: string) => {
        try {
            await removePlaybook(playbookId);
            showToast('Playbook excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting playbook:', error);
            showToast('Erro ao excluir playbook.', 'error');
        }
    };

    const handleSharePlaybook = (playbook: Playbook) => {
        setSharingPlaybook(playbook);
    };

    const handleShareSuccess = () => {
        showToast('Playbook compartilhado com sucesso!', 'success');
    };

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setIsDayDetailModalOpen(true);
    };

    const handleUpdateBalance = async (newBalance: number) => {
        if (!currentAccount) return;

        const totalPnL = allHistory.reduce((sum, trade) => {
            return sum + (trade.pnl || 0);
        }, 0);

        const newInitialBalance = newBalance - totalPnL;

        const updatedAccount = {
            ...currentAccount,
            initialBalance: newInitialBalance,
            currentBalance: newBalance,
            updatedAt: new Date().toISOString()
        };

        await updateAccount(updatedAccount);
        showToast('Saldo atualizado com sucesso!', 'success');
        setIsSettingsModalOpen(false);
    };

    const metrics = useMemo(() => calculateTradeMetrics(allHistory as unknown as Trade[]), [allHistory]);
    
    // Calculate advanced metrics
    const advancedMetrics = useMemo(() => {
        return {
            sharpe: calculateSharpeRatio(allHistory as unknown as Trade[]),
            calmar: calculateCalmarRatio(allHistory as unknown as Trade[], currentAccount?.initialBalance || 0),
            holdTime: calculateAverageHoldTime(allHistory as unknown as Trade[]),
            streaks: calculateConsecutiveStreaks(allHistory as unknown as Trade[])
        };
    }, [allHistory, currentAccount?.initialBalance]);

    if (!uuidRegex.test(accountId)) {
        return null;
    }

    if (isLoading || !currentAccount) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }
    const pnl = currentAccount.currentBalance - currentAccount.initialBalance;
    const pnlPercent = (pnl / currentAccount.initialBalance) * 100;
    const isProfit = pnl >= 0;



    const tabs = [
        { id: 'novo', label: 'Novo Trade', icon: '➕' },
        { id: 'lista', label: 'Histórico', icon: '📋' },
        { id: 'calendario', label: 'Calendário', icon: '📅' },
        { id: 'playbook', label: 'Playbook', icon: '📖' },
        { id: 'relatorios', label: 'Relatórios', icon: '📊' },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Content Overlay */}
            <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-6" style={{ maxWidth: '1200px' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                leftIcon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                                        <path d="m12 19-7-7 7-7"/>
                                        <path d="M19 12H5"/>
                                    </svg>
                                }
                            >
                                Voltar
                            </Button>
                            <div className="h-6 w-px bg-gray-700"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-100">{currentAccount.name}</h1>
                                <p className="text-sm text-gray-400">{currentAccount.currency} • {currentAccount.leverage}</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Admin Button - Only visible for admins */}
                            {isAdminUser && (
                                <Button
                                    variant="primary"
                                    size="icon"
                                    onClick={() => router.push('/admin')}
                                    title="Painel Admin"
                                    className="w-12 h-12 rounded-xl"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                                        <path d="m9 12 2 2 4-4"/>
                                    </svg>
                                </Button>
                            )}

                            {/* Mentor Button - Only visible for mentors or admins */}
                            {(isMentorUser || isAdminUser) && (
                                <Button
                                    variant="primary"
                                    size="icon"
                                    onClick={() => router.push('/mentor')}
                                    title="Mentoria"
                                    className="w-12 h-12 rounded-xl"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </Button>
                            )}

                            {/* Community Button - Visible to all */}
                            <Button
                                variant="primary"
                                size="icon"
                                onClick={() => router.push('/comunidade')}
                                title="Comunidade"
                                className="w-12 h-12 rounded-xl"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M2 12h20"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                            </Button>

                            {/* Notification Bell */}
                            <NotificationBell />

                            {/* Mental Button - Mindset Debugger */}
                            <MentalButton />
                            
                            {/* Settings Button */}
                            <Button
                                variant="primary"
                                size="icon"
                                onClick={() => setIsSettingsModalOpen(true)}
                                title="Configurações"
                                className="w-12 h-12 rounded-xl"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </Button>
                        </div>
                    </div>

                    {/* Métricas resumidas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                        {/* Saldo Atual */}
                        <div className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors">
                            <div className="text-gray-500 mb-2 group-hover:text-emerald-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                                </svg>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Saldo Atual</div>
                            <div className="text-lg font-bold text-gray-100">
                                {formatCurrency(currentAccount.currentBalance, currentAccount.currency)}
                            </div>
                        </div>

                        {/* P&L Total */}
                        <div className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors">
                            <div className={`mb-2 transition-colors ${isProfit ? 'text-green-500 group-hover:text-green-400' : 'text-red-500 group-hover:text-red-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">P&L Total</div>
                            <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                {isProfit ? '+' : ''}{formatCurrency(pnl, currentAccount.currency)}
                            </div>
                            <div className={`text-xs ${isProfit ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </div>
                        </div>

                        {/* Win Rate */}
                        <div className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors">
                            <div className="text-gray-500 mb-2 group-hover:text-cyan-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                            <div className="text-lg font-bold text-cyan-400">
                                {metrics.winRate.toFixed(1)}%
                            </div>
                        </div>

                        {/* Total Trades */}
                        <div className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors">
                            <div className="text-gray-500 mb-2 group-hover:text-indigo-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20v-6M6 20V10M18 20V4" />
                                </svg>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                            <div className="text-lg font-bold text-gray-100">
                                {metrics.totalTrades}
                            </div>
                        </div>
                        
                        {/* Sequência de Anotação */}
                        <div className="bg-linear-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-gray-600/50 transition-colors">
                            <div className="text-orange-500/80 mb-2 group-hover:text-orange-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3a9 9 0 0 0 3 3.3z"></path>
                                </svg>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Sequência de Anotação</div>
                            <div className="text-lg font-bold text-orange-400">
                                {streakMetrics.streak}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Tabs */}
            <div className="container mx-auto px-4 mt-6" style={{ maxWidth: '1200px' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-4" style={{ maxWidth: '1200px' }}>
                <TabPanel value="novo" activeTab={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>➕ Novo Trade</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TradeForm
                                accountId={accountId}
                                onSubmit={handleCreateTrade}
                            />
                        </CardContent>
                    </Card>
                </TabPanel>

                <TabPanel value="lista" activeTab={activeTab}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Histórico de Trades</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsImportModalOpen(true)}
                                    leftIcon={
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    }
                                >
                                    Importar
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={async () => {
                                        const confirmText = prompt(
                                            '⚠️ ATENÇÃO: Esta ação irá DELETAR TODOS os trades desta conta!\n\n' +
                                            'Para confirmar, digite "DELETAR" (em maiúsculas):'
                                        );
                                        if (confirmText === 'DELETAR') {
                                            try {
                                                // Delete all trades one by one
                                                for (const trade of allHistory) {
                                                    await removeTrade(trade.id, accountId);
                                                }
                                                showToast('Todos os trades foram deletados!', 'success');
                                                loadTrades(accountId);
                                            } catch (error) {
                                                console.error('Error deleting all trades:', error);
                                                showToast('Erro ao deletar trades', 'error');
                                            }
                                        } else if (confirmText !== null) {
                                            showToast('Texto incorreto. Nenhum trade foi deletado.', 'warning');
                                        }
                                    }}
                                    leftIcon={
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"/>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                        </svg>
                                    }
                                >
                                    Deletar Todos
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TradeList 
                                trades={trades}
                                currency={currentAccount.currency}
                                onEditTrade={handleEditTrade}
                                onDeleteTrade={handleDeleteTrade}
                                onViewDay={(date) => {
                                    setSelectedDate(date);
                                    setIsDayDetailModalOpen(true);
                                }}
                                totalCount={totalCount}
                                currentPage={currentPage}
                                onPageChange={(p) => loadPage(accountId, p)}
                            />
                        </CardContent>
                    </Card>
                </TabPanel>

                <TabPanel value="calendario" activeTab={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>📅 Calendário de Trades</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TradeCalendar
                                trades={allHistory as unknown as Trade[]}
                                onDayClick={handleDayClick}
                            />
                        </CardContent>
                    </Card>
                </TabPanel>

                <TabPanel value="playbook" activeTab={activeTab}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>📖 Playbook</CardTitle>
                            <Button
                                variant="gradient-success"
                                onClick={() => setIsCreatePlaybookModalOpen(true)}
                                leftIcon={<span>+</span>}
                            >
                                Criar Playbook
                            </Button>
                        </CardHeader>
                        <CardContent>
                           <PlaybookGrid 
                                trades={allHistory as unknown as Trade[]} 
                                playbooks={playbooks} 
                                currency={currentAccount?.currency || 'USD'} 
                                onEdit={handleEditPlaybook}
                                onDelete={handleDeletePlaybook}
                                onView={handleViewPlaybook}
                                onShare={handleSharePlaybook}
                           />
                        </CardContent>
                    </Card>
                </TabPanel>



                <TabPanel value="relatorios" activeTab={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Relatórios de Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Unified Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Row 1 - Basic Metrics */}
                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Profit Factor</div>
                                        <div className="text-2xl font-bold text-gray-100">{metrics.profitFactor.toFixed(2)}</div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                                        </div>
                                    </GlassCard>
                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Lucro</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            {formatCurrency(metrics.avgWin, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                        </div>
                                    </GlassCard>
                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Perda</div>
                                        <div className="text-2xl font-bold text-red-400">
                                            {formatCurrency(metrics.avgLoss, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                        </div>
                                    </GlassCard>
                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Max Drawdown</div>
                                        <div className="text-2xl font-bold text-yellow-400">
                                            {formatCurrency(metrics.maxDrawdown, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/></svg>
                                        </div>
                                    </GlassCard>

                                    {/* Row 2 - Advanced Metrics */}
                                    {/* Row 2 - Advanced Metrics */}
                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Índice Sharpe</div>
                                        <div className={`text-2xl font-bold ${
                                            advancedMetrics.sharpe >= 2 ? 'text-green-400' : 
                                            advancedMetrics.sharpe >= 1 ? 'text-cyan-400' : 
                                            advancedMetrics.sharpe >= 0 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {advancedMetrics.sharpe.toFixed(2)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Índice Calmar</div>
                                        <div className={`text-2xl font-bold ${
                                            advancedMetrics.calmar >= 3 ? 'text-green-400' : 
                                            advancedMetrics.calmar >= 1 ? 'text-cyan-400' : 
                                            advancedMetrics.calmar >= 0 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {advancedMetrics.calmar.toFixed(2)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Tempo Médio (G/P)</div>
                                        <div className={`text-xl font-bold ${
                                            advancedMetrics.holdTime.avgWinnerTime > advancedMetrics.holdTime.avgLoserTime ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {formatTimeMinutes(advancedMetrics.holdTime.avgWinnerTime)} / {formatTimeMinutes(advancedMetrics.holdTime.avgLoserTime)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="p-4 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Sequência Atual</div>
                                        <div className={`text-2xl font-bold ${
                                            advancedMetrics.streaks.currentStreak.type === 'win' ? 'text-green-400' : 
                                            advancedMetrics.streaks.currentStreak.type === 'loss' ? 'text-red-400' : 'text-gray-400'
                                        }`}>
                                            {advancedMetrics.streaks.currentStreak.type === 'none' ? '-' : 
                                             `${advancedMetrics.streaks.currentStreak.count} ${advancedMetrics.streaks.currentStreak.type === 'win' ? 'Ganhos' : 'Perdas'}`}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                        </div>
                                    </GlassCard>
                                </div>
                                
                                {/* Additional Info Row */}
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400">
                                        <div>
                                            <span className="font-semibold text-gray-400">Sharpe: </span>
                                            {advancedMetrics.sharpe < 1 ? 'Ruim' : advancedMetrics.sharpe < 2 ? 'Bom' : advancedMetrics.sharpe < 3 ? 'Muito Bom' : 'Excepcional'}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-400">Calmar: </span>
                                            {advancedMetrics.calmar < 1 ? 'Fraco' : advancedMetrics.calmar < 3 ? 'Aceitável' : 'Bom'}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-400">Tempo Médio: </span>
                                            {formatTimeMinutes(advancedMetrics.holdTime.avgAllTrades)}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-400">Sequências: </span>
                                            {advancedMetrics.streaks.maxWinStreak}G / {advancedMetrics.streaks.maxLossStreak}P
                                        </div>
                                    </div>
                                    </div>

                                
                                <Charts 
                                    trades={allHistory as unknown as Trade[]} 
                                    currency={currentAccount.currency} 
                                    initialBalance={currentAccount.initialBalance}
                                    accountCreatedAt={currentAccount.createdAt}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabPanel>
            </div>

            <CreateTradeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                accountId={accountId}
                onCreateTrade={handleCreateTrade}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                defaultAccountId={accountId}
                onImportComplete={() => {
                   loadTrades(accountId);
                   showToast('Importação concluída!', 'success');
                }}
            />

            <EditTradeModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedTrade(null);
                }}
                trade={selectedTrade}
                onUpdateTrade={handleUpdateTrade}
            />

            {/* Day Detail Modal */}
            <DayDetailModal
                isOpen={isDayDetailModalOpen}
                onClose={() => setIsDayDetailModalOpen(false)}
                date={selectedDate}
                trades={allHistory.filter(t => t.entryDate.split('T')[0] === selectedDate) as unknown as Trade[]}
                accountId={accountId}
                onDeleteTrade={handleDeleteTrade}
                onEditTrade={handleEditTrade}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                accountId={accountId}
                currentBalance={currentAccount.currentBalance}
                onUpdateBalance={handleUpdateBalance}
            />

            {/* Playbook Modal */}
            <CreatePlaybookModal
                isOpen={isCreatePlaybookModalOpen}
                onClose={() => setIsCreatePlaybookModalOpen(false)}
                onCreatePlaybook={() => {
                    loadPlaybooks();
                }}
            />
            <EditPlaybookModal
                isOpen={!!editingPlaybook}
                onClose={() => setEditingPlaybook(null)}
                playbook={editingPlaybook}
                onUpdatePlaybook={handleUpdatePlaybook}
            />

            <ViewPlaybookModal
                isOpen={!!viewingPlaybook}
                onClose={() => setViewingPlaybook(null)}
                playbook={viewingPlaybook}
                trades={allHistory as unknown as Trade[]}
                currency={currentAccount?.currency || 'USD'}
                onEdit={(playbook) => {
                    setViewingPlaybook(null);
                    setEditingPlaybook(playbook);
                }}
            />

            {sharingPlaybook && (
                <SharePlaybookModal
                    playbook={sharingPlaybook}
                    isOpen={!!sharingPlaybook}
                    onClose={() => setSharingPlaybook(null)}
                    onSuccess={handleShareSuccess}
                />
            )}

            {/* Pre-Flight Checklist FAB */}
            <ChecklistFab />
            </div>
        </div>
    );
}
