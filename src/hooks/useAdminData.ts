"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsersAction,
  getAdminStatsAction,
  updateUserStatusAction,
  updateUserRoleAction,
  getAuditLogsAction,
} from "@/app/actions/admin";

// Query Keys for cache management
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  logs: (options?: unknown) => [...adminKeys.all, "logs", options] as const,
};

/**
 * Hook to fetch admin stats with caching
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStatsAction,
    staleTime: 1 * 60 * 1000, // 1 minute for admin data (needs fresher)
  });
}

/**
 * Hook to fetch all users with caching
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: getAllUsersAction,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to fetch audit logs with caching
 */
export function useAuditLogs(options?: { limit?: number }) {
  return useQuery({
    queryKey: adminKeys.logs(options),
    queryFn: () => getAuditLogsAction(options),
    staleTime: 30 * 1000, // 30 seconds for logs
    enabled: true,
  });
}

/**
 * Hook for admin actions with cache invalidation
 */
export function useAdminActions() {
  const queryClient = useQueryClient();

  const handleApprove = async (id: string) => {
    await updateUserStatusAction(id, "approved");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const handleSuspend = async (id: string) => {
    await updateUserStatusAction(id, "suspended");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const handleToggleMentor = async (id: string, makeMentor: boolean) => {
    await updateUserRoleAction(id, makeMentor ? "mentor" : "user");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  return {
    handleApprove,
    handleSuspend,
    handleToggleMentor,
  };
}

/**
 * Prefetch admin data (for hover prefetching)
 */
export function usePrefetchAdminData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.stats(),
      queryFn: getAdminStatsAction,
      staleTime: 1 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: adminKeys.users(),
      queryFn: getAllUsersAction,
      staleTime: 1 * 60 * 1000,
    });
  };
}
