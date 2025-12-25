"use client";

import { useState, use, useCallback } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { isValidUUID } from "@/lib/validation/uuid";
import { usePrefetchCommunityData } from "@/hooks/useCommunityData";
import { usePrefetchAdminData } from "@/hooks/useAdminData";
import { usePrefetchMentorData } from "@/hooks/useMentorData";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useJournalStore } from "@/store/useJournalStore";

// Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SegmentedToggle,
  TabPanel,
} from "@/components/ui";
import { ChecklistFab } from "@/components/checklist";
import { TradeForm } from "@/components/trades/TradeForm";
import { TradeCalendar } from "@/components/trades/TradeCalendar";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";

// Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardOverview } from "@/components/dashboard/tabs/DashboardOverview";
import { DashboardJournal } from "@/components/dashboard/tabs/DashboardJournal";
import { DashboardPlaybooks } from "@/components/dashboard/tabs/DashboardPlaybooks";
import { DashboardModals } from "@/components/dashboard/DashboardModals";

// Skeletons (imported before dynamic components that use them)
import {
  DashboardSkeleton,
  DashboardMetricsSkeleton,
  DashboardTabsSkeleton,
  DashboardContentSkeleton,
  CalendarSkeleton,
  ReportsSkeleton,
} from "@/components/dashboard/DashboardSkeleton";

// Types
import type { Trade, Playbook } from "@/types";

// Heavy components loaded dynamically to reduce initial bundle size
const DashboardLaboratory = dynamic(
  () =>
    import("@/components/dashboard/tabs/DashboardLaboratory").then(
      (mod) => mod.DashboardLaboratory
    ),
  {
    loading: () => <DashboardContentSkeleton />,
    ssr: false,
  }
);

const DashboardNews = dynamic(() => import("@/components/news").then((mod) => mod.DashboardNews), {
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  ),
  ssr: false,
});

// Tab definitions
const tabsOptions = [
  { value: "novo", label: <>➕ Novo Trade</> },
  { value: "lista", label: <>📋 Histórico</> },
  { value: "calendario", label: <>📅 Calendário</> },
  { value: "playbook", label: <>📖 Playbook</> },
  { value: "laboratorio", label: <>🧪 Laboratório</> },
  { value: "news", label: <>📰 News</> },
  { value: "relatorios", label: <>📊 Relatórios</> },
];

export default function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { showToast } = useToast();

  // Next.js 15+: params and searchParams are Promises
  const { accountId } = use(params);

  if (!isValidUUID(accountId)) {
    notFound();
  }

  const { date: queryDate } = use(searchParams);

  // Custom hooks for data and actions
  const data = useDashboardData(accountId);
  const actions = useDashboardActions(accountId, {
    onTradeCreated: () => setActiveTab("lista"),
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
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Journal Store
  const { getEntryByTradeId } = useJournalStore();

  // Selection States
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditFromDayDetail, setIsEditFromDayDetail] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | null>(null);
  const [sharingPlaybook, setSharingPlaybook] = useState<Playbook | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(queryDate || "");
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<Trade | null>(null);
  const [startJournalEditing, setStartJournalEditing] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("novo");

  // Callbacks before early returns (hooks must be called in same order)
  const handleJournalClick = useCallback(
    (trade: Trade, startEditing: boolean = true) => {
      setSelectedTradeForJournal(trade);
      setStartJournalEditing(startEditing);
      setIsJournalModalOpen(true);
    },
    [setSelectedTradeForJournal, setStartJournalEditing, setIsJournalModalOpen]
  );

  // Handlers (moved before return)
  const handleEditTrade = (trade: Trade, fromDayDetail = false) => {
    setSelectedTrade(trade);
    setIsEditFromDayDetail(fromDayDetail);
    setIsEditModalOpen(true);
  };

  const handleViewDay = (date: string) => {
    setSelectedDate(date);
    setIsDayDetailModalOpen(true);
  };

  // Prefetch optimization: Load data on hover
  const handleTabHover = (tabValue: string) => {
    // Prefetch Calendar data when hovering over Calendar tab
    if (tabValue === "calendario" && !data.loadingPhases.heavy.calendar) {
      data.loadCalendarData();
    }
    // Prefetch Reports data when hovering over Reports tab
    if (tabValue === "relatorios" && !data.loadingPhases.heavy.reports) {
      data.loadReportsData();
    }
  };
  if (!data.isValidAccount) return null;
  // Use granular loading: only block full page if account isn't ready
  if (!data.isAccountReady || !data.currentAccount) return <DashboardSkeleton />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6" style={{ maxWidth: "1200px" }}>
            <DashboardHeader
              account={data.currentAccount}
              isAdminUser={data.isAdminUser}
              isMentorUser={data.isMentorUser}
              prefetchAdmin={prefetchAdmin}
              prefetchMentor={prefetchMentor}
              prefetchCommunity={prefetchCommunity}
              onSettingsClick={() => setIsSettingsModalOpen(true)}
            />

            {data.isTradesLoading ? (
              <DashboardMetricsSkeleton />
            ) : (
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
            )}
          </div>
        </div>

        {data.isTradesLoading ? (
          <>
            <DashboardTabsSkeleton />
            <DashboardContentSkeleton />
          </>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div className="container mx-auto mt-6 px-4" style={{ maxWidth: "1200px" }}>
              <SegmentedToggle
                id="dashboard-navigation"
                role="navigation"
                aria-label="Navegação do dashboard"
                options={tabsOptions.map((opt) => ({
                  ...opt,
                  onHover: () => handleTabHover(opt.value),
                }))}
                value={activeTab}
                onChange={setActiveTab}
                variant="responsive"
              />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-4" style={{ maxWidth: "1200px" }}>
              <TabPanel value="novo" activeTab={activeTab}>
                <Card>
                  <CardHeader>
                    <CardTitle>➕ Novo Trade</CardTitle>
                  </CardHeader>
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
                  onJournalClick={handleJournalClick}
                  sortDirection={data.sortDirection}
                  onSortChange={data.setSortDirection}
                  filterAsset={data.filterAsset}
                  onFilterChange={data.setFilterAsset}
                  isLoading={data.isStoreLoading}
                />
              </TabPanel>

              <TabPanel value="calendario" activeTab={activeTab}>
                {!data.loadingPhases.heavy.calendar ? (
                  <CalendarSkeleton onMount={data.loadCalendarData} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>📅 Calendário de Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TradeCalendar
                        trades={data.allHistory as unknown as Trade[]}
                        accountId={accountId}
                        onDayClick={handleViewDay}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabPanel>

              <TabPanel value="playbook" activeTab={activeTab}>
                <DashboardPlaybooks
                  accountId={accountId}
                  trades={data.allHistory as unknown as Trade[]}
                  playbooks={data.playbooks}
                  currency={data.currentAccount?.currency || "USD"}
                  stats={data.playbookStats}
                  onLoadStats={data.loadPlaybookStats}
                  onCreatePlaybook={() => setIsCreatePlaybookModalOpen(true)}
                  onEditPlaybook={setEditingPlaybook}
                  onDeletePlaybook={actions.handleDeletePlaybook}
                  onViewPlaybook={setViewingPlaybook}
                  onSharePlaybook={setSharingPlaybook}
                />
              </TabPanel>

              <TabPanel value="laboratorio" activeTab={activeTab}>
                <DashboardLaboratory
                  trades={data.allHistory.map((t) => ({
                    id: t.id,
                    symbol: t.symbol,
                    type: t.type,
                    entryDate: t.entryDate,
                    entryTime: t.entryTime,
                    exitDate: t.exitDate,
                    exitTime: t.exitTime,
                    pnl: t.pnl,
                    outcome: t.outcome,
                    entryPrice: t.entryPrice,
                    exitPrice: t.exitPrice,
                    stopLoss: t.stopLoss,
                    takeProfit: t.takeProfit,
                    lot: t.lot,
                    accountId: t.accountId,
                  }))}
                />
              </TabPanel>

              <TabPanel value="news" activeTab={activeTab}>
                <DashboardNews />
              </TabPanel>

              <TabPanel value="relatorios" activeTab={activeTab}>
                {!data.loadingPhases.heavy.reports ? (
                  <ReportsSkeleton onMount={data.loadReportsData} />
                ) : (
                  <DashboardOverview
                    metrics={data.metrics}
                    advancedMetrics={data.advancedMetrics}
                    allHistory={data.allHistory as unknown as Trade[]}
                    currency={data.currentAccount.currency || "USD"}
                    initialBalance={Number(data.currentAccount.initialBalance)}
                    accountCreatedAt={String(data.currentAccount.createdAt)}
                    playbookStats={data.playbookStats}
                  />
                )}
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
              onCloseEditModal={() => {
                setIsEditModalOpen(false);
                setSelectedTrade(null);
                setIsEditFromDayDetail(false);
              }}
              isEditFromDayDetail={isEditFromDayDetail}
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
              handleImportComplete={() => {
                data.loadTrades(accountId);
                showToast("Importação concluída!", "success");
              }}
              handleUpdateBalance={actions.handleUpdateBalance}
              handlePlaybookCreated={actions.handlePlaybookCreated}
              handleUpdatePlaybook={actions.handleUpdatePlaybook}
              handleShareSuccess={actions.handleShareSuccess}
            />

            {/* Journal Modal from Trade History */}
            {isJournalModalOpen && selectedTradeForJournal && (
              <JournalEntryModal
                key={selectedTradeForJournal.id}
                isOpen={isJournalModalOpen}
                onClose={() => {
                  setIsJournalModalOpen(false);
                  setSelectedTradeForJournal(null);
                }}
                trade={selectedTradeForJournal}
                existingEntry={getEntryByTradeId(selectedTradeForJournal.id)}
                initialDate={selectedTradeForJournal.entryDate}
                accountId={accountId}
                startEditing={startJournalEditing}
                noBackdrop={false}
              />
            )}
          </>
        )}

        <ChecklistFab />
      </div>
    </div>
  );
}
