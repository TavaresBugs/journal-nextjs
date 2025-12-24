"use client";

import { useQuery } from "@tanstack/react-query";
import { isAdminAction } from "@/app/actions/admin";
import { isMentorAction } from "@/app/actions/mentor";

export interface UserPermissions {
  isAdminUser: boolean;
  isMentorUser: boolean;
  isLoading: boolean;
}

/**
 * Hook for checking user permissions (admin and mentor status).
 * Caches the result to avoid redundant API calls.
 *
 * @returns User permission states
 */
export function useUserPermissions(): UserPermissions {
  const { data, isLoading } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const [adminStatus, mentorStatus] = await Promise.all([isAdminAction(), isMentorAction()]);
      return { isAdminUser: adminStatus, isMentorUser: mentorStatus };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  return {
    isAdminUser: data?.isAdminUser ?? false,
    isMentorUser: data?.isMentorUser ?? false,
    isLoading: isLoading,
  };
}
