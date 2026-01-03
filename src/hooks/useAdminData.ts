"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

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
    queryFn: async () => {
      const { getAdminStatsAction } = await import("@/app/actions/admin");
      return getAdminStatsAction();
    },
    staleTime: 1 * 60 * 1000, // 1 minute for admin data (needs fresher)
  });
}

/**
 * Hook to fetch all users with caching
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      const { getAllUsersAction } = await import("@/app/actions/admin");
      return getAllUsersAction();
    },
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to fetch audit logs with caching
 */
export function useAuditLogs(options?: { limit?: number }) {
  return useQuery({
    queryKey: adminKeys.logs(options),
    queryFn: async () => {
      const { getAuditLogsAction } = await import("@/app/actions/admin");
      return getAuditLogsAction(options);
    },
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
    const { updateUserStatusAction } = await import("@/app/actions/admin");
    await updateUserStatusAction(id, "approved");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const handleSuspend = async (id: string) => {
    const { updateUserStatusAction } = await import("@/app/actions/admin");
    await updateUserStatusAction(id, "suspended");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const handleToggleMentor = async (id: string, makeMentor: boolean) => {
    const { updateUserRoleAction } = await import("@/app/actions/admin");
    await updateUserRoleAction(id, makeMentor ? "mentor" : "user");
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;
    const { deleteUserAction } = await import("@/app/actions/admin");
    const result = await deleteUserAction(id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      alert(result.error || "Erro ao deletar usuário");
    }
  };

  return {
    handleApprove,
    handleSuspend,
    handleToggleMentor,
    handleDelete,
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
      queryFn: async () => {
        const { getAdminStatsAction } = await import("@/app/actions/admin");
        return getAdminStatsAction();
      },
      staleTime: 1 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: adminKeys.users(),
      queryFn: async () => {
        const { getAllUsersAction } = await import("@/app/actions/admin");
        return getAllUsersAction();
      },
      staleTime: 1 * 60 * 1000,
    });
  };
}
