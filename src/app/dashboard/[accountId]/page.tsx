'use client';

import { useState, use } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { usePrefetchCommunityData } from '@/hooks/useCommunityData';
import { usePrefetchAdminData } from '@/hooks/useAdminData';
import { usePrefetchMentorData } from '@/hooks/useMentorData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';

// Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { ChecklistFab } from '@/components/checklist';
import { TradeForm } from '@/components/trades/TradeForm';
import { TradeCalendar } from '@/components/trades/TradeCalendar';

// Dashboard Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardOverview } from '@/components/dashboard/tabs/DashboardOverview';
import { DashboardJournal } from '@/components/dashboard/tabs/DashboardJournal';
import { DashboardPlaybooks } from '@/components/dashboard/tabs/DashboardPlaybooks';
import { DashboardLaboratory } from '@/components/dashboard/tabs/DashboardLaboratory';
import { DashboardModals } from '@/components/dashboard/DashboardModals';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// Types
import type { Trade, Playbook } from '@/types';

// Tab definitions
const tabs = [
    { id: 'novo', label: 'Novo Trade', icon: '➕' },
    { id: 'lista', label: 'Histórico', icon: '📋' },
    { id: 'calendario', label: 'Calendário', icon: '📅' },
    { id: 'playbook', label: 'Playbook', icon: '📖' },
    { id: 'laboratorio', label: 'Laboratório', icon: '🧪' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊' },
];

export default function DashboardPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ accountId: string }>; 
    searchParams: Promise<{ date?: string }>;
}) {
    const { showToast } = useToast();
    
    // Next.js 15+: params and searchParams are Promises
    const { accountId } = use(params);
    const { date: queryDate } = use(searchParams);

    // Custom hooks for data and actions
    const data = useDashboardData(accountId);
    const actions = useDashboardActions(accountId, {
        onTradeCreated: () => setActiveTab('lista'),
        onBalanceUpdated: () => setIsSettingsModalOpen(false),
        onPlaybookUpdated: () => setEditingPlaybook(null),
    });

    // Prefetch hooks for hover optimization
    const prefetchCommunity = usePrefetchCommunityData();
    const prefetchAdmin = usePrefetchAdminData();
    const prefetchMentor = usePrefetchMentorData();

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(() => !!queryDate);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCreatePlaybookModalOpen, setIsCreatePlaybookModalOpen] = useState(false);

    // Selection States
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
    const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | null>(null);
    const [sharingPlaybook, setSharingPlaybook] = useState<Playbook | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(queryDate || '');

    // UI State
    const [activeTab, setActiveTab] = useState('novo');

    // Early returns
    if (!data.isValidAccount) return null;
    if (data.isLoading || !data.currentAccount) return <DashboardSkeleton />;

    // Handlers
    const handleEditTrade = (trade: Trade) => {
        setSelectedTrade(trade);
        setIsEditModalOpen(true);
    };

    const handleViewDay = (date: string) => {
        setSelectedDate(date);
        setIsDayDetailModalOpen(true);
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="container mx-auto px-6 py-6" style={{ maxWidth: '1200px' }}>
                        <DashboardHeader
                            account={data.currentAccount}
                            isAdminUser={data.isAdminUser}
                            isMentorUser={data.isMentorUser}
                            prefetchAdmin={prefetchAdmin}
                            prefetchMentor={prefetchMentor}
                            prefetchCommunity={prefetchCommunity}
                            onSettingsClick={() => setIsSettingsModalOpen(true)}
                        />
                        <DashboardMetrics
                            currentBalance={data.currentAccount.currentBalance}
                            currency={data.currentAccount.currency}
                            pnl={data.pnl}
                            pnlPercent={data.pnlPercent}
                            isProfit={data.isProfit}
                            winRate={data.metrics.winRate}
                            totalTrades={data.metrics.totalTrades}
                            streak={data.streakMetrics.streak}
                        />
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
                            <CardHeader><CardTitle>➕ Novo Trade</CardTitle></CardHeader>
                            <CardContent>
                                <TradeForm accountId={accountId} onSubmit={actions.handleCreateTrade} />
                            </CardContent>
                        </Card>
                    </TabPanel>

                    <TabPanel value="lista" activeTab={activeTab}>
                        <DashboardJournal
                            trades={data.trades}
                            currency={data.currentAccount.currency}
                            totalCount={data.totalCount}
                            currentPage={data.currentPage}
                            accountId={accountId}
                            onLoadPage={data.loadPage}
                            onImportClick={() => setIsImportModalOpen(true)}
                            onDeleteAllTrades={actions.handleDeleteAllTrades}
                            onEditTrade={handleEditTrade}
                            onDeleteTrade={actions.handleDeleteTrade}
                            onViewDay={handleViewDay}
                        />
                    </TabPanel>

                    <TabPanel value="calendario" activeTab={activeTab}>
                        <Card>
                            <CardHeader><CardTitle>📅 Calendário de Trades</CardTitle></CardHeader>
                            <CardContent>
                                <TradeCalendar trades={data.allHistory as unknown as Trade[]} onDayClick={handleViewDay} />
                            </CardContent>
                        </Card>
                    </TabPanel>

                    <TabPanel value="playbook" activeTab={activeTab}>
                        <DashboardPlaybooks
                            trades={data.allHistory as unknown as Trade[]}
                            playbooks={data.playbooks}
                            currency={data.currentAccount?.currency || 'USD'}
                            onCreatePlaybook={() => setIsCreatePlaybookModalOpen(true)}
                            onEditPlaybook={setEditingPlaybook}
                            onDeletePlaybook={actions.handleDeletePlaybook}
                            onViewPlaybook={setViewingPlaybook}
                            onSharePlaybook={setSharingPlaybook}
                        />
                    </TabPanel>

                    <TabPanel value="laboratorio" activeTab={activeTab}>
                        <DashboardLaboratory
                            trades={data.allHistory.map(t => ({
                                id: t.id, symbol: t.symbol, type: t.type,
                                entryDate: t.entryDate, entryTime: t.entryTime,
                                exitDate: t.exitDate, exitTime: t.exitTime,
                                pnl: t.pnl, outcome: t.outcome,
                                entryPrice: t.entryPrice, exitPrice: t.exitPrice,
                                stopLoss: t.stopLoss, takeProfit: t.takeProfit,
                                lot: t.lot, accountId: t.accountId,
                            }))}
                        />
                    </TabPanel>

                    <TabPanel value="relatorios" activeTab={activeTab}>
                        <DashboardOverview
                            metrics={data.metrics}
                            advancedMetrics={data.advancedMetrics}
                            allHistory={data.allHistory as unknown as Trade[]}
                            currency={data.currentAccount.currency}
                            initialBalance={data.currentAccount.initialBalance}
                            accountCreatedAt={data.currentAccount.createdAt}
                        />
                    </TabPanel>
                </div>

                <DashboardModals
                    accountId={accountId}
                    currentBalance={data.currentAccount.currentBalance}
                    currency={data.currentAccount.currency}
                    allHistory={data.allHistory as unknown as Trade[]}
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
                    onCloseEditModal={() => { setIsEditModalOpen(false); setSelectedTrade(null); }}
                    onCloseDayDetailModal={() => setIsDayDetailModalOpen(false)}
                    onCloseSettingsModal={() => setIsSettingsModalOpen(false)}
                    onCloseCreatePlaybookModal={() => setIsCreatePlaybookModalOpen(false)}
                    setEditingPlaybook={setEditingPlaybook}
                    setViewingPlaybook={setViewingPlaybook}
                    setSharingPlaybook={setSharingPlaybook}
                    handleCreateTrade={actions.handleCreateTrade}
                    handleUpdateTrade={actions.handleUpdateTrade}
                    handleDeleteTrade={actions.handleDeleteTrade}
                    handleEditTrade={handleEditTrade}
                    handleImportComplete={() => { data.loadTrades(accountId); showToast('Importação concluída!', 'success'); }}
                    handleUpdateBalance={actions.handleUpdateBalance}
                    handlePlaybookCreated={actions.handlePlaybookCreated}
                    handleUpdatePlaybook={actions.handleUpdatePlaybook}
                    handleShareSuccess={actions.handleShareSuccess}
                />

                <ChecklistFab />
            </div>
        </div>
    );
}
