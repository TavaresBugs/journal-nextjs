/**
 * Mentor Service - Types and Mappers
 */

import { MentorInvite, MentorPermission, TradeComment } from '@/types';

// ============================================
// DB TYPES (snake_case)
// ============================================

export interface DBMentorInvite {
    id: string;
    mentor_id: string;
    mentor_email: string;
    mentee_id: string | null;
    mentee_email: string;
    permission: string;
    status: string;
    invite_token: string;
    created_at: string;
    accepted_at: string | null;
    expires_at: string;
}

export interface DBTradeComment {
    id: string;
    trade_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

export function mapInviteFromDB(db: DBMentorInvite): MentorInvite {
    return {
        id: db.id,
        mentorId: db.mentor_id,
        mentorEmail: db.mentor_email,
        menteeId: db.mentee_id || '',
        menteeEmail: db.mentee_email,
        permission: db.permission as MentorPermission,
        status: db.status as MentorInvite['status'],
        inviteToken: db.invite_token,
        createdAt: db.created_at,
        acceptedAt: db.accepted_at || undefined,
        expiresAt: db.expires_at,
    };
}

export function mapCommentFromDB(db: DBTradeComment): TradeComment {
    return {
        id: db.id,
        tradeId: db.trade_id,
        userId: db.user_id,
        content: db.content,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    };
}
