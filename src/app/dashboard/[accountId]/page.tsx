'use client';

import { use, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isAdmin } from '@/services/admin/admin';
import { isMentor } from '@/services/mentor/invites';
import { useToast } from '@/providers/ToastProvider';
import { usePrefetchCommunityData } from '@/hooks/useCommunityData';
import { usePrefetchAdminData } from '@/hooks/useAdminData';
import { usePrefetchMentorData } from '@/hooks/useMentorData';

// Components
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { NotificationBell } from '@/components/notifications';
import { MentalButton } from '@/components/mental';
import { ChecklistFab } from '@/components/checklist';
import { TradeForm } from '@/components/trades/TradeForm';
import { TradeCalendar } from '@/components/trades/TradeCalendar';

// New Components
import { DashboardOverview } from '@/components/dashboard/tabs/DashboardOverview';
import { DashboardJournal } from '@/components/dashboard/tabs/DashboardJournal';
import { DashboardPlaybooks } from '@/components/dashboard/tabs/DashboardPlaybooks';
import { DashboardModals } from '@/components/dashboard/DashboardModals';

// Types and Utilities
import type { Trade, Playbook } from '@/types';
import { 
    formatCurrency, 
    calculateTradeMetrics,
    calculateSharpeRatio,
    calculateCalmarRatio,
    calculateAverageHoldTime,
    calculateConsecutiveStreaks,
} from '@/lib/calculations';

// Validate if accountId is a valid UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function DashboardPage({ params, searchParams }: { params: Promise<{ accountId: string }>, searchParams: Promise<{ date?: string }> }) {
    const router = useRouter();
    // Unwrap params Promise using React.use()
    const { accountId } = use(params);
    const { date: queryDate } = use(searchParams);

    // State Management
    const { accounts, currentAccount, setCurrentAccount, updateAccountBalance, updateAccount } = useAccountStore();
    const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage, addTrade, updateTrade, removeTrade } = useTradeStore();
    const { entries, loadEntries } = useJournalStore();
    const { playbooks, loadPlaybooks, removePlaybook } = usePlaybookStore();
    const { loadSettings } = useSettingsStore();
    const { showToast } = useToast();

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCreatePlaybookModalOpen, setIsCreatePlaybookModalOpen] = useState(false);

    // Selection States
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | null>(null);
    const [sharingPlaybook, setSharingPlaybook] = useState<Playbook | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // UI States
    const [activeTab, setActiveTab] = useState('novo');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isMentorUser, setIsMentorUser] = useState(false);

    // Prefetch hooks for hover optimization
    const prefetchCommunity = usePrefetchCommunityData();
    const prefetchAdmin = usePrefetchAdminData();
    const prefetchMentor = usePrefetchMentorData();

    // Initial checks and Deep Linking
    useEffect(() => {
        if (!uuidRegex.test(accountId)) {
            router.push('/');
        }
    }, [accountId, router]);

    useEffect(() => {
        if (queryDate) {
            setSelectedDate(queryDate);
            setIsDayDetailModalOpen(true);
        }
    }, [queryDate]);

    // Initialization Effect
    const isInitRef = useRef<string | null>(null);

    useEffect(() => {
        const init = async () => {
            if (isInitRef.current === accountId) {
                setIsLoading(false);
                return;
            }

            try {
                let currentAccounts = useAccountStore.getState().accounts;
                if (currentAccounts.length === 0) {
                    await useAccountStore.getState().loadAccounts();
                    currentAccounts = useAccountStore.getState().accounts;
                }

                const account = currentAccounts.find(acc => acc.id === accountId);
                
                if (!account) {
                    console.error('Account not found after loading:', accountId);
                    router.push('/');
                    return;
                }

                setCurrentAccount(accountId);
                
                await Promise.all([
                    loadTrades(accountId),
                    loadEntries(accountId),
                    loadPlaybooks(),
                    loadSettings()
                ]);

                const [adminStatus, mentorStatus] = await Promise.all([
                    isAdmin(),
                    isMentor()
                ]);
                setIsAdminUser(adminStatus);
                setIsMentorUser(mentorStatus);
                
                isInitRef.current = accountId;

            } catch (error) {
                console.error('Error initializing dashboard:', error);
                showToast('Erro ao carregar dados do dashboard', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [accountId, accounts.length, setCurrentAccount, loadTrades, loadEntries, loadPlaybooks, loadSettings, router, showToast]);

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

    // Metrics Calculations
    const streakMetrics = useMemo(() => {
        const tradeDates = allHistory.map(t => t.entryDate.split('T')[0]);
        const journalDates = entries.map(e => e.date);

        const dates = Array.from(new Set([...tradeDates, ...journalDates])).sort();
        const daysAccessed = dates.length;

        if (dates.length === 0) return { daysAccessed: 0, streak: 0 };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDate = dates[dates.length - 1];

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

    const metrics = useMemo(() => calculateTradeMetrics(allHistory as unknown as Trade[]), [allHistory]);

    const advancedMetrics = useMemo(() => {
        return {
            sharpe: calculateSharpeRatio(allHistory as unknown as Trade[]),
            calmar: calculateCalmarRatio(allHistory as unknown as Trade[], currentAccount?.initialBalance || 0),
            holdTime: calculateAverageHoldTime(allHistory as unknown as Trade[]),
            streaks: calculateConsecutiveStreaks(allHistory as unknown as Trade[])
        };
    }, [allHistory, currentAccount?.initialBalance]);

    // Handlers
    const handleCreateTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTrade: Trade = {
            ...tradeData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as Trade;

        await addTrade(newTrade);
        setActiveTab('lista');
    };

    const handleEditTrade = (trade: Trade) => {
        setSelectedTrade(trade);
        setIsEditModalOpen(true);
    };

    const handleUpdateTrade = async (trade: Trade) => {
        await updateTrade(trade);
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

    const handlePlaybookCreated = async () => {
        await loadPlaybooks();
        // showToast('Playbook criado com sucesso!', 'success');
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

    const handleShareSuccess = () => {
        showToast('Playbook compartilhado com sucesso!', 'success');
    };

    if (!uuidRegex.test(accountId)) return null;

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

                            <div className="flex items-center gap-2">
                                {isAdminUser && (
                                    <Link href="/admin" prefetch>
                                        <div onMouseEnter={prefetchAdmin}>
                                            <Button variant="primary" size="icon" title="Painel Admin" className="w-12 h-12 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                            </Button>
                                        </div>
                                    </Link>
                                )}

                                {(isMentorUser || isAdminUser) && (
                                    <Link href="/mentor" prefetch>
                                        <div onMouseEnter={prefetchMentor}>
                                            <Button variant="primary" size="icon" title="Mentoria" className="w-12 h-12 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                                    <circle cx="9" cy="7" r="4"/>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                                </svg>
                                            </Button>
                                        </div>
                                    </Link>
                                )}

                                <Link href="/comunidade" prefetch>
                                    <div onMouseEnter={prefetchCommunity}>
                                        <Button variant="primary" size="icon" title="Comunidade" className="w-12 h-12 rounded-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="M2 12h20"/>
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                            </svg>
                                        </Button>
                                    </div>
                                </Link>

                                <NotificationBell />
                                <MentalButton />

                                <Button variant="primary" size="icon" onClick={() => setIsSettingsModalOpen(true)} title="Configurações" className="w-12 h-12 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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
                        <DashboardJournal
                            trades={trades}
                            currency={currentAccount.currency}
                            totalCount={totalCount}
                            currentPage={currentPage}
                            accountId={accountId}
                            onLoadPage={loadPage}
                            onImportClick={() => setIsImportModalOpen(true)}
                            onDeleteAllTrades={async () => {
                                try {
                                    for (const trade of allHistory) {
                                        await removeTrade(trade.id, accountId);
                                    }
                                    showToast('Todos os trades foram deletados!', 'success');
                                    loadTrades(accountId);
                                } catch (error) {
                                    console.error('Error deleting all trades:', error);
                                    showToast('Erro ao deletar trades', 'error');
                                }
                            }}
                            onEditTrade={handleEditTrade}
                            onDeleteTrade={handleDeleteTrade}
                            onViewDay={(date) => {
                                setSelectedDate(date);
                                setIsDayDetailModalOpen(true);
                            }}
                        />
                    </TabPanel>

                    <TabPanel value="calendario" activeTab={activeTab}>
                        <Card>
                            <CardHeader>
                                <CardTitle>📅 Calendário de Trades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TradeCalendar
                                    trades={allHistory as unknown as Trade[]}
                                    onDayClick={(date) => {
                                        setSelectedDate(date);
                                        setIsDayDetailModalOpen(true);
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabPanel>

                    <TabPanel value="playbook" activeTab={activeTab}>
                        <DashboardPlaybooks
                            trades={allHistory as unknown as Trade[]}
                            playbooks={playbooks}
                            currency={currentAccount?.currency || 'USD'}
                            onCreatePlaybook={() => setIsCreatePlaybookModalOpen(true)}
                            onEditPlaybook={setEditingPlaybook}
                            onDeletePlaybook={handleDeletePlaybook}
                            onViewPlaybook={setViewingPlaybook}
                            onSharePlaybook={setSharingPlaybook}
                        />
                    </TabPanel>

                    <TabPanel value="relatorios" activeTab={activeTab}>
                        <DashboardOverview
                            metrics={metrics}
                            advancedMetrics={advancedMetrics}
                            allHistory={allHistory as unknown as Trade[]}
                            currency={currentAccount.currency}
                            initialBalance={currentAccount.initialBalance}
                            accountCreatedAt={currentAccount.createdAt}
                        />
                    </TabPanel>
                </div>

                <DashboardModals
                    accountId={accountId}
                    currentBalance={currentAccount.currentBalance}
                    currency={currentAccount.currency}
                    allHistory={allHistory as unknown as Trade[]}

                    isCreateModalOpen={isCreateModalOpen}
                    isImportModalOpen={isImportModalOpen}
                    isEditModalOpen={isEditModalOpen}
                    isDayDetailModalOpen={isDayDetailModalOpen}
                    isSettingsModalOpen={isSettingsModalOpen}
                    isCreatePlaybookModalOpen={isCreatePlaybookModalOpen}

                    selectedTrade={selectedTrade}
                    selectedDate={selectedDate}
                    editingPlaybook={editingPlaybook}
                    viewingPlaybook={viewingPlaybook}
                    sharingPlaybook={sharingPlaybook}

                    onCloseCreateModal={() => setIsCreateModalOpen(false)}
                    onCloseImportModal={() => setIsImportModalOpen(false)}
                    onCloseEditModal={() => {
                        setIsEditModalOpen(false);
                        setSelectedTrade(null);
                    }}
                    onCloseDayDetailModal={() => setIsDayDetailModalOpen(false)}
                    onCloseSettingsModal={() => setIsSettingsModalOpen(false)}
                    onCloseCreatePlaybookModal={() => setIsCreatePlaybookModalOpen(false)}

                    setEditingPlaybook={setEditingPlaybook}
                    setViewingPlaybook={setViewingPlaybook}
                    setSharingPlaybook={setSharingPlaybook}

                    handleCreateTrade={handleCreateTrade}
                    handleUpdateTrade={handleUpdateTrade}
                    handleDeleteTrade={handleDeleteTrade}
                    handleEditTrade={handleEditTrade}
                    handleImportComplete={() => {
                        loadTrades(accountId);
                        showToast('Importação concluída!', 'success');
                    }}
                    handleUpdateBalance={handleUpdateBalance}
                    handlePlaybookCreated={handlePlaybookCreated}
                    handleUpdatePlaybook={handleUpdatePlaybook}
                    handleShareSuccess={handleShareSuccess}
                />

                <ChecklistFab />
            </div>
        </div>
    );
}
