"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPublicPlaybooksAction,
  togglePlaybookStarAction,
  getLeaderboardAction,
  getMyLeaderboardStatusAction,
  joinLeaderboardAction,
  leaveLeaderboardAction,
  getCurrentUserDisplayNameAction,
} from "@/app/actions/community";

// Query Keys for cache management
export const communityKeys = {
  all: ["community"] as const,
  playbooks: () => [...communityKeys.all, "playbooks"] as const,
  leaderboard: () => [...communityKeys.all, "leaderboard"] as const,
  optInStatus: () => [...communityKeys.all, "optInStatus"] as const,
};

/**
 * Hook to fetch public playbooks with caching
 */
export function useCommunityPlaybooks() {
  return useQuery({
    queryKey: communityKeys.playbooks(),
    queryFn: () => getPublicPlaybooksAction(),
    staleTime: 2 * 60 * 1000, // 2 minutes for community data
  });
}

/**
 * Hook to fetch leaderboard with caching
 */
export function useCommunityLeaderboard() {
  return useQuery({
    queryKey: communityKeys.leaderboard(),
    queryFn: getLeaderboardAction,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch user's leaderboard opt-in status
 */
export function useLeaderboardOptIn() {
  return useQuery({
    queryKey: communityKeys.optInStatus(),
    queryFn: getMyLeaderboardStatusAction,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for community data actions (star, join/leave leaderboard)
 */
export function useCommunityActions() {
  const queryClient = useQueryClient();

  const handleStar = async (playbookId: string) => {
    const result = await togglePlaybookStarAction(playbookId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: communityKeys.playbooks() });
    }
    return result.success;
  };

  const handleJoinLeaderboard = async () => {
    let displayName = await getCurrentUserDisplayNameAction();

    if (!displayName) {
      displayName = prompt("Escolha um nome de exibição:");
    }

    if (!displayName) return false;

    const result = await joinLeaderboardAction(displayName, {
      showWinRate: true,
      showProfitFactor: true,
      showTotalTrades: true,
      showPnl: true,
    });

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    }
    return result.success;
  };

  const handleLeaveLeaderboard = async () => {
    if (!confirm("Tem certeza que deseja sair do leaderboard?")) return false;
    const result = await leaveLeaderboardAction();
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    }
    return result.success;
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
      queryFn: () => getPublicPlaybooksAction(),
      staleTime: 2 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: communityKeys.leaderboard(),
      queryFn: getLeaderboardAction,
      staleTime: 2 * 60 * 1000,
    });
  };
}
