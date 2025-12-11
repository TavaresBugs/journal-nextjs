/**
 * Mentor Invites Service - Main Entry Point
 * 
 * This module re-exports all mentor-related functionality.
 * Import from '@/services/mentor/invites' for all mentor operations.
 */

// Types and mappers (internal use mostly)
export { mapInviteFromDB, mapCommentFromDB } from './types';
export type { DBMentorInvite, DBTradeComment } from './types';

// Send invites
export { isMentor, inviteMentee, inviteMentor } from './send';

// Manage invites (accept/reject/revoke + permissions)
export { 
    acceptInvite, 
    rejectInvite, 
    revokeInvite,
    getAccountPermissions,
    setAccountPermission,
    removeAccountPermission
} from './manage';

// Receive/get data
export {
    getSentInvites,
    getReceivedInvites,
    getMentors,
    getMyMentors,
    getMentees,
    getMenteeTrades,
    getMenteeJournalEntries,
    getMenteeRoutine,
    getMenteePermittedAccounts,
    addTradeComment,
    getTradeComments,
    deleteTradeComment,
    canCommentOnTrade
} from './receive';
