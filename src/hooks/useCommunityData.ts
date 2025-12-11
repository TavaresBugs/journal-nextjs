'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    getPublicPlaybooks,
    togglePlaybookStar
} from '@/services/community/playbook';
import {
    getLeaderboard,
    getMyLeaderboardStatus,
    joinLeaderboard,
    leaveLeaderboard,
    getCurrentUserDisplayName
} from '@/services/community/leaderboard';
// Types are inferred from service return types

// Query Keys for cache management
export const communityKeys = {
    all: ['community'] as const,
    playbooks: () => [...communityKeys.all, 'playbooks'] as const,
    leaderboard: () => [...communityKeys.all, 'leaderboard'] as const,
    optInStatus: () => [...communityKeys.all, 'optInStatus'] as const,
};

/**
 * Hook to fetch public playbooks with caching
 */
export function useCommunityPlaybooks() {
    return useQuery({
        queryKey: communityKeys.playbooks(),
        queryFn: () => getPublicPlaybooks(),
        staleTime: 2 * 60 * 1000, // 2 minutes for community data
    });
}

/**
 * Hook to fetch leaderboard with caching
 */
export function useCommunityLeaderboard() {
    return useQuery({
        queryKey: communityKeys.leaderboard(),
        queryFn: getLeaderboard,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to fetch user's leaderboard opt-in status
 */
export function useLeaderboardOptIn() {
    return useQuery({
        queryKey: communityKeys.optInStatus(),
        queryFn: getMyLeaderboardStatus,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook for community data actions (star, join/leave leaderboard)
 */
export function useCommunityActions() {
    const queryClient = useQueryClient();

    const handleStar = async (playbookId: string) => {
        const success = await togglePlaybookStar(playbookId);
        if (success) {
            queryClient.invalidateQueries({ queryKey: communityKeys.playbooks() });
        }
        return success;
    };

    const handleJoinLeaderboard = async () => {
        let displayName = await getCurrentUserDisplayName();
        
        if (!displayName) {
            displayName = prompt('Escolha um nome de exibição:');
        }
        
        if (!displayName) return false;
        
        const result = await joinLeaderboard(displayName, {
            showWinRate: true,
            showProfitFactor: true,
            showTotalTrades: true,
            showPnl: true
        });
        
        if (result) {
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        }
        return !!result;
    };

    const handleLeaveLeaderboard = async () => {
        if (!confirm('Tem certeza que deseja sair do leaderboard?')) return false;
        const success = await leaveLeaderboard();
        if (success) {
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        }
        return success;
    };

    return {
        handleStar,
        handleJoinLeaderboard,
        handleLeaveLeaderboard,
    };
}

/**
 * Prefetch community data (for hover prefetching)
 */
export function usePrefetchCommunityData() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: communityKeys.playbooks(),
            queryFn: () => getPublicPlaybooks(),
            staleTime: 2 * 60 * 1000,
        });
        queryClient.prefetchQuery({
            queryKey: communityKeys.leaderboard(),
            queryFn: getLeaderboard,
            staleTime: 2 * 60 * 1000,
        });
    };
}
