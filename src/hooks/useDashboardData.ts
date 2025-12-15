'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isAdmin } from '@/services/admin/admin';
import { isMentor } from '@/services/mentor/invites';
import { useToast } from '@/providers/ToastProvider';
import type { Trade } from '@/types';
import {
    calculateTradeMetrics,
    calculateSharpeRatio,
    calculateCalmarRatio,
    calculateAverageHoldTime,
    calculateConsecutiveStreaks,
} from '@/lib/calculations';

// Validate if accountId is a valid UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DashboardData {
    // Account
    currentAccount: ReturnType<typeof useAccountStore.getState>['currentAccount'];
    
    // Data
    trades: ReturnType<typeof useTradeStore.getState>['trades'];
    allHistory: ReturnType<typeof useTradeStore.getState>['allHistory'];
    totalCount: number;
    currentPage: number;
    entries: ReturnType<typeof useJournalStore.getState>['entries'];
    playbooks: ReturnType<typeof usePlaybookStore.getState>['playbooks'];
    
    // Metrics
    metrics: ReturnType<typeof calculateTradeMetrics>;
    advancedMetrics: {
        sharpe: ReturnType<typeof calculateSharpeRatio>;
        calmar: ReturnType<typeof calculateCalmarRatio>;
        holdTime: ReturnType<typeof calculateAverageHoldTime>;
        streaks: ReturnType<typeof calculateConsecutiveStreaks>;
    };
    streakMetrics: {
        daysAccessed: number;
        streak: number;
    };
    pnl: number;
    pnlPercent: number;
    isProfit: boolean;
    
    // Permissions
    isAdminUser: boolean;
    isMentorUser: boolean;
    
    // State
    isLoading: boolean;
    isValidAccount: boolean;
}

export interface DashboardDataActions {
    loadPage: (accountId: string, page: number) => Promise<void>;
    loadTrades: (accountId: string) => Promise<void>;
    loadEntries: (accountId: string) => Promise<void>;
    loadPlaybooks: () => Promise<void>;
}


/**
 * Custom hook for dashboard data fetching and metrics calculation.
 * Encapsulates all data loading, caching, and derived metrics.
 * 
 * @param accountId - The account ID from URL params
 * @returns Data, metrics, and loading states
 */
export function useDashboardData(accountId: string): DashboardData & DashboardDataActions {
    const router = useRouter();
    const { showToast } = useToast();
    
    // Store State
    const { accounts, currentAccount, setCurrentAccount, updateAccountBalance } = useAccountStore();
    const { trades, allHistory, totalCount, currentPage, loadTrades, loadPage } = useTradeStore();
    const { entries, loadEntries } = useJournalStore();
    const { playbooks, loadPlaybooks } = usePlaybookStore();
    const { loadSettings } = useSettingsStore();
    
    // Local State
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isMentorUser, setIsMentorUser] = useState(false);
    
    // Refs
    const isInitRef = useRef<string | null>(null);
    
    // Validation
    const isValidAccount = uuidRegex.test(accountId);
    
    // Redirect if invalid account
    useEffect(() => {
        if (!isValidAccount) {
            router.push('/');
        }
    }, [isValidAccount, router]);
    
    // Initialization Effect
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

    const metrics = useMemo(() => 
        calculateTradeMetrics(allHistory as unknown as Trade[]), 
        [allHistory]
    );

    const advancedMetrics = useMemo(() => ({
        sharpe: calculateSharpeRatio(allHistory as unknown as Trade[]),
        calmar: calculateCalmarRatio(allHistory as unknown as Trade[], currentAccount?.initialBalance || 0),
        holdTime: calculateAverageHoldTime(allHistory as unknown as Trade[]),
        streaks: calculateConsecutiveStreaks(allHistory as unknown as Trade[])
    }), [allHistory, currentAccount?.initialBalance]);
    
    // Derived values
    const pnl = currentAccount ? currentAccount.currentBalance - currentAccount.initialBalance : 0;
    const pnlPercent = currentAccount ? (pnl / currentAccount.initialBalance) * 100 : 0;
    const isProfit = pnl >= 0;
    
    return {
        // Account
        currentAccount,
        
        // Data
        trades,
        allHistory,
        totalCount,
        currentPage,
        entries,
        playbooks,
        
        // Metrics
        metrics,
        advancedMetrics,
        streakMetrics,
        pnl,
        pnlPercent,
        isProfit,
        
        // Permissions
        isAdminUser,
        isMentorUser,
        
        // State
        isLoading,
        isValidAccount,
        
        // Actions
        loadPage,
        loadTrades,
        loadEntries,
        loadPlaybooks,
    };
}
