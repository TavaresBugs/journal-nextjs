"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMenteesOverviewAction,
  getSentInvitesAction,
  getReceivedInvitesAction,
  inviteMenteeAction,
  revokeInviteAction,
} from "@/app/actions/mentor";
import type { MentorPermission } from "@/types";

// Query Keys for cache management
export const mentorKeys = {
  all: ["mentor"] as const,
  mentees: () => [...mentorKeys.all, "mentees"] as const,
  invites: () => [...mentorKeys.all, "invites"] as const,
};

/**
 * Hook to fetch mentees with caching
 */
export function useMentorMentees() {
  return useQuery({
    queryKey: mentorKeys.mentees(),
    queryFn: getMenteesOverviewAction,
    staleTime: 5 * 60 * 1000, // 5 minutes - mentor data rarely changes
  });
}

/**
 * Hook to fetch sent invites with caching
 */
export function useMentorInvites() {
  return useQuery({
    queryKey: mentorKeys.invites(),
    queryFn: getSentInvitesAction,
    staleTime: 5 * 60 * 1000, // 5 minutes - invites rarely change
  });
}

/**
 * Hook to fetch received invites with caching
 */
export function useReceivedInvites() {
  return useQuery({
    queryKey: [...mentorKeys.all, "received-invites"],
    queryFn: getReceivedInvitesAction,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for mentor actions with cache invalidation
 */
export function useMentorActions() {
  const queryClient = useQueryClient();

  const handleSendInvite = async (
    menteeEmail: string,
    permission: MentorPermission = "comment"
  ) => {
    console.log("[handleSendInvite] Starting invite for:", menteeEmail);
    const result = await inviteMenteeAction(
      menteeEmail,
      permission === "comment" ? "comment" : "view"
    );

    if (result.success) {
      console.log("[handleSendInvite] SUCCESS:", result.invite);
      queryClient.invalidateQueries({ queryKey: mentorKeys.all });
      return true;
    }
    console.error("[handleSendInvite] FAILED:", result.error);
    return false;
  };

  const handleRevokeAccess = async (inviteId: string) => {
    if (!confirm("Tem certeza que deseja revogar o acesso?")) return false;
    const result = await revokeInviteAction(inviteId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: mentorKeys.all });
      return true;
    }
    return false;
  };

  return {
    handleSendInvite,
    handleRevokeAccess,
  };
}

/**
 * Prefetch mentor data (for hover prefetching)
 */
export function usePrefetchMentorData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: mentorKeys.mentees(),
      queryFn: getMenteesOverviewAction,
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: mentorKeys.invites(),
      queryFn: getSentInvitesAction,
      staleTime: 5 * 60 * 1000,
    });
  };
}
