'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { CreateTradeModal } from '@/components/trades/CreateTradeModal';
import { EditTradeModal } from '@/components/trades/EditTradeModal';
import { TradeList } from '@/components/trades/TradeList';
import { TradeCalendar } from '@/components/trades/TradeCalendar';
import { TradeForm } from '@/components/trades/TradeForm';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { PlaybookGrid } from '@/components/playbook/PlaybookGrid';
import { CreatePlaybookModal } from '@/components/playbook/CreatePlaybookModal';
import { DayDetailModal } from '@/components/journal/DayDetailModal';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import type { Trade } from '@/types';
import { formatCurrency, calculateTradeMetrics } from '@/lib/calculations';
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('@/components/reports/Charts').then(mod => mod.Charts), { 
    ssr: false,
    loading: () => <div className="text-center py-10 text-gray-500">Carregando gráficos...</div>
});

export default function DashboardPage({ params }: { params: Promise<{ accountId: string }> }) {
    const router = useRouter();
    // Unwrap params Promise using React.use()
    const { accountId } = use(params);
    
    const { accounts, currentAccount, setCurrentAccount, updateAccountBalance } = useAccountStore();
    const { trades, loadTrades, addTrade, updateTrade, removeTrade } = useTradeStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isPlaybookModalOpen, setIsPlaybookModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [activeTab, setActiveTab] = useState('novo');
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Calculate pagination
    const totalPages = Math.ceil(trades.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTrades = trades.slice(startIndex, endIndex);

    const streakMetrics = useMemo(() => {
        const dates = Array.from(new Set(trades.map(t => t.entryDate.split('T')[0]))).sort();
        const daysAccessed = dates.length;
        
        if (dates.length === 0) return { daysAccessed: 0, streak: 0 };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDate = dates[dates.length - 1];

        // Se o último trade não foi hoje nem ontem, a sequência quebrou
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
    }, [trades]);

    useEffect(() => {
        const init = async () => {
            // Find account by ID from URL
            const account = accounts.find(acc => acc.id === accountId);
            
            if (!account) {
                router.push('/');
                return;
            }

            setCurrentAccount(accountId);
            await loadTrades(accountId);
            setIsLoading(false);
        };

        init();
    }, [accountId, accounts, setCurrentAccount, loadTrades, router]);

    // Update account balance when trades change - with debounce to prevent loops
    useEffect(() => {
        if (!currentAccount || isLoading) return;

        const totalPnL = trades.reduce((sum, trade) => {
            return sum + (trade.pnl || 0);
        }, 0);

        // Only update if balance actually changed
        const expectedBalance = currentAccount.initialBalance + totalPnL;
        if (Math.abs(currentAccount.currentBalance - expectedBalance) > 0.001) {
            updateAccountBalance(accountId, totalPnL);
        }
    }, [trades.length]); // Only depend on trades.length to prevent infinite loops

    // Reset to page 1 when trades change
    useEffect(() => {
        setCurrentPage(1);
    }, [trades.length]);

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
        setSelectedTrade(trade);
        setIsEditModalOpen(true);
    };

    const handleUpdateTrade = async (trade: Trade) => {
        await updateTrade(trade);
        setIsEditModalOpen(false);
        setSelectedTrade(null);
    };

    const handleDeleteTrade = async (tradeId: string) => {
        await removeTrade(tradeId);
    };

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setIsDayDetailModalOpen(true);
    };

    const handleUpdateBalance = async (newBalance: number) => {
        // TODO: Update account balance in store
        console.log('New balance:', newBalance);
    };

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

    const metrics = calculateTradeMetrics(trades);
    const pnl = currentAccount.currentBalance - currentAccount.initialBalance;
    const pnlPercent = (pnl / currentAccount.initialBalance) * 100;
    const isProfit = pnl >= 0;



    const tabs = [
        { id: 'novo', label: 'Novo Trade', icon: '➕' },
        { id: 'lista', label: 'Lista', icon: '📋' },
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
                        
                        {/* Settings Button - Minimalista */}
                        {/* Settings Button - Minimalista */}
                        <Button
                            variant="primary"
                            size="icon"
                            onClick={() => setIsSettingsModalOpen(true)}
                            title="Configurações"
                            className="w-12 h-12 rounded-xl" // Override size to match original 12x12 and rounded-xl
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </Button>
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
            <div className="container mx-auto px-6 mt-6" style={{ maxWidth: '1200px' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6" style={{ maxWidth: '1200px' }}>
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
                        <CardContent>
                            <TradeList 
                                trades={paginatedTrades}
                                currency={currentAccount.currency}
                                onEditTrade={handleEditTrade}
                                onDeleteTrade={handleDeleteTrade}
                            />
                            
                            {/* Pagination Controls */}
                            {trades.length > 0 && (
                                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-700">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    
                                    <span className="text-sm text-gray-400">
                                        Página {currentPage} de {totalPages} ({trades.length} trades)
                                    </span>
                                    
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
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
                                trades={trades}
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
                                variant="ghost-success"
                                onClick={() => setIsPlaybookModalOpen(true)}
                                leftIcon={<span>+</span>}
                            >
                                Criar Playbook
                            </Button>
                        </CardHeader>
                        <CardContent>
                           <PlaybookGrid trades={trades} currency={currentAccount.currency} />
                        </CardContent>
                    </Card>
                </TabPanel>



                <TabPanel value="relatorios" activeTab={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Relatórios de Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-8">
                                {/* Row 1 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Equity Atual</div>
                                        <div className="text-2xl font-bold text-gray-100">
                                            {formatCurrency(currentAccount.currentBalance, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Win Rate</div>
                                        <div className="text-2xl font-bold text-cyan-400">{metrics.winRate.toFixed(1)}%</div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Profit Factor</div>
                                        <div className="text-2xl font-bold text-gray-100">{metrics.profitFactor.toFixed(2)}</div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Trades</div>
                                        <div className="text-2xl font-bold text-gray-100">{metrics.totalTrades}</div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Lucro</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            {formatCurrency(metrics.avgWin, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Média de Perda</div>
                                        <div className="text-2xl font-bold text-red-400">
                                            {formatCurrency(metrics.avgLoss, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Max Drawdown</div>
                                        <div className="text-2xl font-bold text-yellow-400">
                                            {formatCurrency(metrics.maxDrawdown, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/></svg>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Lucro Líquido</div>
                                        <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(metrics.totalPnL, currentAccount.currency)}
                                        </div>
                                        <div className="absolute top-4 right-4 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <Charts 
                                    trades={trades} 
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
                trades={trades.filter(t => t.entryDate.split('T')[0] === selectedDate)}
                accountId={accountId}
                onEditTrade={handleEditTrade}
                onDeleteTrade={handleDeleteTrade}
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
                isOpen={isPlaybookModalOpen}
                onClose={() => setIsPlaybookModalOpen(false)}
                accountId={accountId}
                onCreatePlaybook={() => {
                    setIsPlaybookModalOpen(false);
                }}
            />
            </div>
        </div>
    );
}
