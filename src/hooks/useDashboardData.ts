"use client";

import { useAccountValidation } from "./useAccountValidation";
import { useDashboardInit } from "./useDashboardInit";
import { useTradeMetrics } from "./useTradeMetrics";
import { useUserPermissions } from "./useUserPermissions";
import type { Trade } from "@/types";

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
}

export interface DashboardDataActions {
  loadPage: (accountId: string, page: number) => Promise<void>;
  loadTrades: (accountId: string) => Promise<void>;
  loadEntries: (accountId: string) => Promise<void>;
  loadPlaybooks: () => Promise<void>;
  setSortDirection: (accountId: string, direction: "asc" | "desc") => Promise<void>;
  setFilterAsset: (accountId: string, asset: string) => Promise<void>;
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

  // 3. Calculate trade metrics
  const metricsData = useTradeMetrics({
    trades: initData.allHistory as unknown as Trade[],
    entries: initData.entries,
    initialBalance: initData.currentAccount?.initialBalance || 0,
    currentBalance: initData.currentAccount?.currentBalance || 0,
  });

  // 4. Load user permissions
  const { isAdminUser, isMentorUser } = useUserPermissions();

  return {
    // Account
    currentAccount: initData.currentAccount
      ? {
          ...initData.currentAccount,
          currentBalance: metricsData.pnlMetrics.currentBalance,
        }
      : null,

    // Data
    trades: initData.trades,
    allHistory: initData.allHistory,
    totalCount: initData.totalCount,
    currentPage: initData.currentPage,
    entries: initData.entries,
    playbooks: initData.playbooks,

    // Metrics
    metrics: metricsData.metrics,
    advancedMetrics: metricsData.advancedMetrics,
    streakMetrics: metricsData.streakMetrics,
    pnl: metricsData.pnlMetrics.pnl,
    pnlPercent: metricsData.pnlMetrics.pnlPercent,
    isProfit: metricsData.pnlMetrics.isProfit,

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

    // Actions
    loadPage: initData.loadPage,
    loadTrades: initData.loadTrades,
    loadEntries: initData.loadEntries,
    loadPlaybooks: initData.loadPlaybooks,
    setSortDirection: initData.setSortDirection,
    setFilterAsset: initData.setFilterAsset,
  };
}
