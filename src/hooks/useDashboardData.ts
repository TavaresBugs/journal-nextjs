import { useEffect } from "react";
import { useAccountValidation } from "./useAccountValidation";
import { useDashboardInit } from "./useDashboardInit";
import { useTradeMetrics } from "./useTradeMetrics";
import { useUserPermissions } from "./useUserPermissions";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { PlaybookStats, Trade } from "@/types";

// Re-export types for backwards compatibility
export type { AccountValidation } from "./useAccountValidation";
export type { DashboardInitData, DashboardInitActions } from "./useDashboardInit";
export type {
  TradeMetricsData,
  StreakMetrics,
  AdvancedMetrics,
  PnLMetrics,
} from "./useTradeMetrics";
export type { UserPermissions } from "./useUserPermissions";

// Re-export individual hooks for granular usage
export { useAccountValidation } from "./useAccountValidation";
export { useDashboardInit } from "./useDashboardInit";
export { useTradeMetrics } from "./useTradeMetrics";
export { useUserPermissions } from "./useUserPermissions";

export interface DashboardData {
  // Account
  currentAccount: ReturnType<typeof useDashboardInit>["currentAccount"];

  // Data
  trades: ReturnType<typeof useDashboardInit>["trades"];
  allHistory: ReturnType<typeof useDashboardInit>["allHistory"];
  totalCount: number;
  currentPage: number;
  entries: ReturnType<typeof useDashboardInit>["entries"];
  playbooks: ReturnType<typeof useDashboardInit>["playbooks"];
  playbookStats: PlaybookStats[];

  // Metrics
  metrics: ReturnType<typeof useTradeMetrics>["metrics"];
  advancedMetrics: ReturnType<typeof useTradeMetrics>["advancedMetrics"];
  streakMetrics: ReturnType<typeof useTradeMetrics>["streakMetrics"];
  pnl: number;
  pnlPercent: number;
  isProfit: boolean;

  // Permissions
  isAdminUser: boolean;
  isMentorUser: boolean;

  // State
  isLoading: boolean;
  isTradesLoading: boolean;
  isStoreLoading: boolean;
  isAccountReady: boolean;
  isValidAccount: boolean;
  sortDirection: "asc" | "desc";
  filterAsset: string;
  loadingPhases: ReturnType<typeof useDashboardInit>["loadingPhases"]; // New
}

export interface DashboardDataActions {
  loadPage: (accountId: string, page: number) => Promise<void>;
  loadTrades: (accountId: string) => Promise<void>;
  loadEntries: (accountId: string) => Promise<void>;
  loadPlaybooks: () => Promise<void>;
  setSortDirection: (accountId: string, direction: "asc" | "desc") => Promise<void>;
  setFilterAsset: (accountId: string, asset: string) => Promise<void>;
  loadCalendarData: () => Promise<void>; // New
  loadReportsData: () => Promise<void>; // New
  loadPlaybookStats: () => Promise<void>; // New
}

/**
 * Composite hook for dashboard data fetching and metrics calculation.
 * Orchestrates multiple smaller hooks for better separation of concerns.
 *
 * Individual hooks can also be used directly for more granular control:
 * - useAccountValidation: Account ID validation and redirects
 * - useDashboardInit: Data loading and initialization
 * - useTradeMetrics: Trade metrics calculations
 * - useUserPermissions: Admin/mentor permission checks
 *
 * @param accountId - The account ID from URL params
 * @returns Data, metrics, permissions, and loading states
 */
export function useDashboardData(accountId: string): DashboardData & DashboardDataActions {
  // 1. Validate account ID format
  const { isValidAccount } = useAccountValidation(accountId);

  // 2. Initialize dashboard data (loads trades, entries, playbooks, etc.)
  const initData = useDashboardInit(accountId, isValidAccount);

  // 3. Calculate trade metrics (Client-Side for Reports/Charts)
  // Only calculate if we have history, otherwise return defaults
  // This prevents heavy calculation on initial load if allHistory is not yet loaded
  const hasHistory = initData.allHistory && initData.allHistory.length > 0;

  const metricsData = useTradeMetrics({
    trades: hasHistory ? (initData.allHistory as unknown as Trade[]) : [],
    entries: initData.entries,
    initialBalance: initData.currentAccount?.initialBalance || 0,
    currentBalance: initData.currentAccount?.currentBalance || 0,
  });

  // 4. Load user permissions
  const { isAdminUser, isMentorUser } = useUserPermissions();

  const { updateAccountBalance } = useAccountStore();

  // 5. Balance Synchronization Check
  // Ensure the account balance matches the sum of trade PnL
  const { pnlMetrics } = metricsData;
  const { serverAdvancedMetrics } = useTradeStore(); // Get server metrics

  useEffect(() => {
    if (!initData.currentAccount || !pnlMetrics) return;

    const initialBalance = initData.currentAccount.initialBalance;
    const currentBalance = initData.currentAccount.currentBalance;

    // Calculate what the balance *should* be based on trades/metrics
    // We prioritize server metrics PnL if available, otherwise client metrics
    const totalPnL = initData.serverMetrics?.totalPnl ?? pnlMetrics.pnl;
    const expectedBalance = initialBalance + totalPnL;

    // Check for discrepancy (allow small tolerance for float errors)
    const discrepancy = Math.abs(expectedBalance - currentBalance);

    if (discrepancy > 0.5) {
      // 50 cents tolerance
      // Only trigger update if we have a meaningful difference
      // This prevents loops on tiny float differences
      // Also verify we actually have data loaded to avoid overwriting with 0
      const hasData =
        initData.serverMetrics || (initData.allHistory && initData.allHistory.length > 0);

      if (hasData) {
        updateAccountBalance(initData.currentAccount.id, totalPnL);
      }
    }
  }, [
    initData.currentAccount,
    initData.serverMetrics,
    pnlMetrics, // Stable dependency (memoized)
    initData.allHistory,
    updateAccountBalance,
  ]);

  // PRIORITIZE SERVER METRICS FOR HEADER (FAST & ACCURATE)
  // fallback to client metrics if server metrics not yet loaded
  const displayPnl = initData.serverMetrics?.totalPnl ?? metricsData.pnlMetrics.pnl;
  const displayWinRate = initData.serverMetrics?.winRate ?? metricsData.metrics.winRate;
  const displayTotalTrades = initData.serverMetrics?.totalTrades ?? metricsData.metrics.totalTrades;

  // Calculate derived values from server metrics
  const displayPnlPercent = initData.currentAccount?.initialBalance
    ? (displayPnl / initData.currentAccount.initialBalance) * 100
    : 0;

  const displayIsProfit = displayPnl >= 0;

  return {
    // Account
    currentAccount: initData.currentAccount
      ? {
          ...initData.currentAccount,
          // Trust the DB balance, but if we have server PnL, we could verify consistency
          // For now, simple is better: use DB balance.
          currentBalance: initData.currentAccount.currentBalance,
        }
      : null,

    // Data
    trades: initData.trades,
    allHistory: initData.allHistory,
    totalCount: initData.totalCount,
    currentPage: initData.currentPage,
    entries: initData.entries,
    playbooks: initData.playbooks,
    playbookStats: initData.playbookStats,

    // Metrics
    metrics: {
      ...metricsData.metrics,
      // Override summary metrics with server data
      winRate: displayWinRate,
      totalTrades: displayTotalTrades,
      totalPnL: displayPnl,
      wins: initData.serverMetrics?.wins ?? metricsData.metrics.wins,
      losses: initData.serverMetrics?.losses ?? metricsData.metrics.losses,
      breakeven: initData.serverMetrics?.breakeven ?? metricsData.metrics.breakeven,
    },
    advancedMetrics: serverAdvancedMetrics
      ? {
          sharpe: serverAdvancedMetrics.sharpeRatio,
          calmar: serverAdvancedMetrics.calmarRatio,
          // Hold time not yet in server metrics, keep client calc
          holdTime: metricsData.advancedMetrics.holdTime,
          streaks: {
            maxWinStreak: serverAdvancedMetrics.maxWinStreak,
            maxLossStreak: serverAdvancedMetrics.maxLossStreak,
            currentStreak: {
              type:
                serverAdvancedMetrics.currentStreak > 0
                  ? "win"
                  : serverAdvancedMetrics.currentStreak < 0
                    ? "loss"
                    : "none",
              count: Math.abs(serverAdvancedMetrics.currentStreak),
            },
          },
        }
      : metricsData.advancedMetrics,
    streakMetrics: metricsData.streakMetrics,
    pnl: displayPnl,
    pnlPercent: displayPnlPercent,
    isProfit: displayIsProfit,

    // Permissions
    isAdminUser,
    isMentorUser,

    // State
    isLoading: initData.isLoading,
    isTradesLoading: initData.isTradesLoading,
    isStoreLoading: initData.isStoreLoading,
    isAccountReady: initData.isAccountReady,
    isValidAccount,
    sortDirection: initData.sortDirection,
    filterAsset: initData.filterAsset,
    loadingPhases: initData.loadingPhases,

    // Actions
    loadPage: initData.loadPage,
    loadTrades: initData.loadTrades,
    loadEntries: initData.loadEntries,
    loadPlaybooks: initData.loadPlaybooks,
    setSortDirection: initData.setSortDirection,
    setFilterAsset: initData.setFilterAsset,
    loadCalendarData: initData.loadCalendarData,
    loadReportsData: initData.loadReportsData,
    loadPlaybookStats: initData.loadPlaybookStats,
  };
}
