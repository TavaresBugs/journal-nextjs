"use client";

import { useState, useEffect, useRef } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getTradeHistoryLiteAction as fetchTradeHistory } from "@/app/actions/trades";
import { getAccountMetricsAction } from "@/app/actions/metrics";
import { getPlaybookStatsAction } from "@/app/actions/playbooks";
import { PlaybookStats } from "@/types";

interface LoadingPhases {
  critical: boolean; // Header + Page 1
  interactive: boolean; // Playbooks + Settings + Journals
  heavy: {
    calendar: boolean;
    reports: boolean;
    laboratory: boolean;
  };
}

export function useStratifiedLoading(accountId: string) {
  const [phases, setPhases] = useState<LoadingPhases>({
    critical: false,
    interactive: false,
    heavy: {
      calendar: false,
      reports: false,
      laboratory: false,
    },
  });

  const [playbookStats, setPlaybookStats] = useState<PlaybookStats[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevAccountIdRef = useRef<string | null>(null);

  // Store actions
  const { setAllHistory, setAdvancedMetrics, allHistory, isLoadingHistory, serverAdvancedMetrics } =
    useTradeStore(); // Modified this line
  const { loadPlaybooks } = usePlaybookStore();
  const { loadSettings } = useSettingsStore();
  const { loadEntries, loadRoutines } = useJournalStore();

  // RESET PHASES: Separate effect to reset when account changes
  useEffect(() => {
    if (!accountId) return;

    // Only reset if we had a previous account and it's different
    if (prevAccountIdRef.current && prevAccountIdRef.current !== accountId) {
      console.log("🔄 Account changed, resetting loading phases");
      // Use functional updates to avoid the lint warning about cascading renders
      // This is intentional: we WANT to reset state when switching accounts
    }

    // Always update the ref to current accountId
    prevAccountIdRef.current = accountId;

    // Return a cleanup that resets phases when effect re-runs or unmounts
    return () => {
      // Reset phases on cleanup (will happen before next effect run)
      setPhases({
        critical: false,
        interactive: false,
        heavy: { calendar: false, reports: false, laboratory: false },
      });
      setPlaybookStats([]);
    };
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;

    abortControllerRef.current = new AbortController();

    async function loadPhases() {
      // FASE 1: Critical - assumed done by useDashboardInit (which calls loadTrades)
      setPhases((prev) => ({ ...prev, critical: true }));

      // FASE 2: Interactive (background non-blocking)
      setTimeout(async () => {
        if (abortControllerRef.current?.signal.aborted) return;

        const promises = [];

        // Check cache before fetching
        if (usePlaybookStore.getState().playbooks.length === 0) {
          promises.push(loadPlaybooks());
        }

        // Only load settings if not already loaded (check currencies as indicator)
        const currentSettings = useSettingsStore.getState();
        if (currentSettings.currencies.length === 0) {
          promises.push(loadSettings());
        }

        // Load journal entries if not cached
        if (useJournalStore.getState().entries.length === 0) {
          promises.push(loadEntries(accountId));
        }

        // OPTIMIZATION: Pre-load routines in background
        // This prevents delay when opening DayDetailModal
        if ((useJournalStore.getState().routines?.length ?? 0) === 0) {
          promises.push(loadRoutines(accountId));
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }

        setPhases((prev) => ({ ...prev, interactive: true }));
      }, 300); // 300ms delay for TTI
    }

    loadPhases();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [accountId, loadPlaybooks, loadSettings, loadEntries, loadRoutines]);

  // Heavy Data Loaders (On Demand)

  const loadCalendarData = async () => {
    if (phases.heavy.calendar) return;

    // Check if we need to load history
    // RACE PROTECTION: Also check isLoadingHistory to avoid duplicate calls
    if (allHistory.length === 0 && !isLoadingHistory) {
      // Lazy load history (last 12 months for performance)
      // We limit client-side history to 1 year for charts/calendar speed
      // Global metrics are handled by serverAdvancedMetrics
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const dateFrom = oneYearAgo.toISOString().split("T")[0];
      const dateTo = now.toISOString().split("T")[0];

      const history = await fetchTradeHistory(accountId, { dateFrom, dateTo });
      setAllHistory(history);
    }

    setPhases((prev) => ({
      ...prev,
      heavy: { ...prev.heavy, calendar: true },
    }));
  };

  const loadPlaybookStats = async () => {
    // Check cache
    if (playbookStats.length > 0) return;

    const stats = await getPlaybookStatsAction(accountId);
    if (stats) setPlaybookStats(stats);
  };

  const loadReportsData = async () => {
    if (phases.heavy.reports) return;

    // Load ALL history for charts (no date filter)
    // This ALWAYS loads full history, even if Calendar loaded partial data
    // Metrics come from pre-calculated account_metrics table (fast)
    // History is needed for charts like Equity Curve, Drawdown, etc.
    const historyPromise = !isLoadingHistory
      ? fetchTradeHistory(accountId, {}) // No date filter - load all
      : Promise.resolve(null);

    const statsPromise =
      playbookStats.length === 0 ? getPlaybookStatsAction(accountId) : Promise.resolve(null);

    // Use pre-calculated metrics from account_metrics table (updated via trigger)
    // This is ~20-50x faster than calculating on demand
    const metricsPromise = !serverAdvancedMetrics
      ? getAccountMetricsAction(accountId)
      : Promise.resolve(null);

    const [history, stats, metrics] = await Promise.all([
      historyPromise,
      statsPromise,
      metricsPromise,
    ]);

    if (history) setAllHistory(history);
    if (stats) setPlaybookStats(stats);
    if (metrics) {
      // Map the pre-calculated metrics to the expected format
      setAdvancedMetrics({
        avgPnl: metrics.avgPnl,
        pnlStdDev: metrics.pnlStdDev,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.largestLoss, // Simplified - using largest loss
        maxDrawdownPercent: 0, // Would need balance to calculate
        calmarRatio: 0, // Would need more data
        currentStreak: metrics.currentStreak,
        maxWinStreak: metrics.maxWinStreak,
        maxLossStreak: metrics.maxLossStreak,
        profitFactor: metrics.profitFactor,
        avgWin: metrics.avgWin,
        avgLoss: metrics.avgLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
      });
    }

    setPhases((prev) => ({
      ...prev,
      heavy: { ...prev.heavy, reports: true },
    }));
  };

  return {
    phases,
    loadCalendarData,
    loadReportsData,
    playbookStats,
    loadPlaybookStats, // Exposed
  };
}
