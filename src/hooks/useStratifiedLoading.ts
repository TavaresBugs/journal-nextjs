"use client";

import { useState, useEffect, useRef } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getTradeHistoryLiteAction as fetchTradeHistory } from "@/app/actions/trades";
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

  // Store actions
  const { setAllHistory, allHistory } = useTradeStore();
  const { loadPlaybooks } = usePlaybookStore();
  const { loadSettings } = useSettingsStore();
  const { loadEntries, loadRoutines } = useJournalStore();

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
        if (useJournalStore.getState().routines.length === 0) {
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
    if (allHistory.length === 0) {
      // Lazy load full history
      const history = await fetchTradeHistory(accountId);
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

    // Load history (if needed) AND Playbook Stats in parallel
    // We reuse loadPlaybookStats logic but we need to run it in parallel with history
    const historyPromise =
      allHistory.length === 0 ? fetchTradeHistory(accountId) : Promise.resolve(null);
    const statsPromise =
      playbookStats.length === 0 ? getPlaybookStatsAction(accountId) : Promise.resolve(null);

    const [history, stats] = await Promise.all([historyPromise, statsPromise]);

    if (history) setAllHistory(history);
    if (stats) setPlaybookStats(stats);

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
