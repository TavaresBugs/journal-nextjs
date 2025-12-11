'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    getMentees, 
    getSentInvites, 
    inviteMentee,
    revokeInvite 
} from '@/services/mentor/invites';
import type { MentorPermission } from '@/types';

// Query Keys for cache management
export const mentorKeys = {
    all: ['mentor'] as const,
    mentees: () => [...mentorKeys.all, 'mentees'] as const,
    invites: () => [...mentorKeys.all, 'invites'] as const,
};

/**
 * Hook to fetch mentees with caching
 */
export function useMentorMentees() {
    return useQuery({
        queryKey: mentorKeys.mentees(),
        queryFn: getMentees,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch sent invites with caching
 */
export function useMentorInvites() {
    return useQuery({
        queryKey: mentorKeys.invites(),
        queryFn: getSentInvites,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook for mentor actions with cache invalidation
 */
export function useMentorActions() {
    const queryClient = useQueryClient();

    const handleSendInvite = async (menteeEmail: string, permission: MentorPermission = 'comment') => {
        console.log('[handleSendInvite] Starting invite for:', menteeEmail);
        const result = await inviteMentee(menteeEmail, permission);
        
        if (result) {
            console.log('[handleSendInvite] SUCCESS:', result);
            queryClient.invalidateQueries({ queryKey: mentorKeys.all });
            return true;
        }
        console.error('[handleSendInvite] FAILED: returned null');
        return false;
    };

    const handleRevokeAccess = async (inviteId: string) => {
        if (!confirm('Tem certeza que deseja revogar o acesso?')) return false;
        const success = await revokeInvite(inviteId);
        if (success) {
            queryClient.invalidateQueries({ queryKey: mentorKeys.all });
        }
        return success;
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
            queryFn: getMentees,
            staleTime: 2 * 60 * 1000,
        });
        queryClient.prefetchQuery({
            queryKey: mentorKeys.invites(),
            queryFn: getSentInvites,
            staleTime: 2 * 60 * 1000,
        });
    };
}
