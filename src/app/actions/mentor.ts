"use server";

/**
 * Mentor Server Actions
 *
 * Server-side actions for mentor operations using Prisma ORM.
 * Covers invites, account permissions, and trade comments.
 */

import { prismaMentorRepo, prismaAdminRepo, prismaTradeRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { createClient } from "@/lib/supabase/server";
import {
  MentorInvite,
  MentorAccountPermission,
  TradeComment,
  MenteeOverview,
  Trade,
  JournalEntry,
  DailyRoutine,
} from "@/types";

// ========================================
// INVITES
// ========================================

/**
 * Check if current user is a mentor.
 */
export async function isMentorAction(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Check if user has mentor role
    const roleResult = await prismaAdminRepo.getUserExtended(userId);
    if (roleResult.data?.role === "mentor") {
      return true;
    }

    // Check if user has accepted mentees
    const menteesResult = await prismaMentorRepo.getMentees(userId);
    return (menteesResult.data?.length || 0) > 0;
  } catch (error) {
    console.error("[isMentorAction] Unexpected error:", error);
    return false;
  }
}

/**
 * Get invites sent by the current user (as mentor).
 */
export async function getSentInvitesAction(): Promise<MentorInvite[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentorRepo.getSentInvites(userId);

    if (result.error) {
      console.error("[getSentInvitesAction] Error:", result.error);
      return [];
    }

    // Map to domain type if needed, but repository already returns compatible type
    return (result.data || []) as unknown as MentorInvite[];
  } catch (error) {
    console.error("[getSentInvitesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get invites received by the current user (as mentee).
 */
export async function getReceivedInvitesAction(): Promise<MentorInvite[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return [];

    const result = await prismaMentorRepo.getReceivedInvites(user.email);

    if (result.error) {
      console.error("[getReceivedInvitesAction] Error:", result.error);
      return [];
    }

    return (result.data || []) as unknown as MentorInvite[];
  } catch (error) {
    console.error("[getReceivedInvitesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get all mentors for the current user.
 */
export async function getMyMentorsAction(): Promise<MentorInvite[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentorRepo.getMyMentors(userId);

    if (result.error) {
      console.error("[getMyMentorsAction] Error:", result.error);
      return [];
    }

    return (result.data || []) as unknown as MentorInvite[];
  } catch (error) {
    console.error("[getMyMentorsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get all mentees overview for the current user.
 */
export async function getMenteesOverviewAction(): Promise<MenteeOverview[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentorRepo.getMenteesOverview(userId);

    if (result.error) {
      console.error("[getMenteesOverviewAction] Error:", result.error);
      return [];
    }

    return (result.data || []) as unknown as MenteeOverview[];
  } catch (error) {
    console.error("[getMenteesOverviewAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Invite a mentee.
 */
export async function inviteMenteeAction(
  menteeEmail: string,
  permission: MentorInvite["permission"] = "view"
): Promise<{ success: boolean; invite?: MentorInvite; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentorRepo.createInvite(
      user.id,
      user.email,
      menteeEmail,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permission as any
    );

    if (result.error) {
      console.error("[inviteMenteeAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, invite: result.data as unknown as MentorInvite };
  } catch (error) {
    console.error("[inviteMenteeAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Accept an invite.
 */
export async function acceptInviteAction(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentorRepo.acceptInvite(token, userId);

    if (result.error) {
      console.error("[acceptInviteAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[acceptInviteAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Reject an invite.
 */
export async function rejectInviteAction(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaMentorRepo.rejectInvite(inviteId);

    if (result.error) {
      console.error("[rejectInviteAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[rejectInviteAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Revoke an invite.
 */
export async function revokeInviteAction(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaMentorRepo.revokeInvite(inviteId);

    if (result.error) {
      console.error("[revokeInviteAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[revokeInviteAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// ========================================
// ACCOUNT PERMISSIONS
// ========================================

/**
 * Get account permissions for an invite.
 */
export async function getAccountPermissionsAction(
  inviteId: string
): Promise<MentorAccountPermission[]> {
  try {
    const result = await prismaMentorRepo.getAccountPermissions(inviteId);

    if (result.error) {
      console.error("[getAccountPermissionsAction] Error:", result.error);
      return [];
    }

    return (result.data || []) as unknown as MentorAccountPermission[];
  } catch (error) {
    console.error("[getAccountPermissionsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Set account permission.
 */
export async function setAccountPermissionAction(
  inviteId: string,
  accountId: string,
  permissions: {
    canViewTrades?: boolean;
    canViewJournal?: boolean;
    canViewRoutines?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaMentorRepo.setAccountPermission(inviteId, accountId, permissions);

    if (result.error) {
      console.error("[setAccountPermissionAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[setAccountPermissionAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Remove account permission.
 */
export async function removeAccountPermissionAction(
  inviteId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaMentorRepo.removeAccountPermission(inviteId, accountId);

    if (result.error) {
      console.error("[removeAccountPermissionAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[removeAccountPermissionAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get permitted accounts for a mentee.
 */
export async function getMenteePermittedAccountsAction(
  menteeId: string
): Promise<Array<{ id: string; name: string; currency: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const invitesResult = await prismaMentorRepo.getMentees(userId);
    const invite = invitesResult.data?.find((i) => i.menteeId === menteeId);

    if (!invite) return [];

    const permsResult = await prismaMentorRepo.getAccountPermissions(invite.id);

    if (permsResult.error) return [];

    return (permsResult.data || [])
      .filter((p) => p.canViewTrades)
      .map((p) => ({
        id: p.accountId,
        name: p.accountName || "Account",
        currency: "USD", // We might need to fetch account details if currency is needed
      }));
  } catch (error) {
    console.error("[getMenteePermittedAccountsAction] Unexpected error:", error);
    return [];
  }
}

// ========================================
// MENTEE DATA
// ========================================

/**
 * Fetch trades for a mentee.
 */
export async function getMenteeTradesAction(
  menteeId: string,
  accountId?: string
): Promise<Trade[]> {
  try {
    const result = await prismaTradeRepo.getByUserId(menteeId, { accountId });
    return (result.data || []) as unknown as Trade[];
  } catch (error) {
    console.error("[getMenteeTradesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Fetch journal entries for a mentee.
 */
export async function getMenteeJournalEntriesAction(
  menteeId: string,
  date: string,
  accountId?: string
): Promise<JournalEntry[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", menteeId)
      .eq("date", date)
      .order("created_at", { ascending: false });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getMenteeJournalEntriesAction] Error:", error);
      return [];
    }

    return (data || []).map((db) => ({
      id: db.id,
      userId: db.user_id,
      accountId: db.account_id,
      date: db.date,
      title: db.title,
      asset: db.asset,
      tradeIds: db.trade_id ? [db.trade_id] : [],
      images: db.images || [],
      emotion: db.emotion,
      analysis: db.analysis,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    })) as unknown as JournalEntry[];
  } catch (error) {
    console.error("[getMenteeJournalEntriesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Fetch daily routine for a mentee.
 */
export async function getMenteeRoutineAction(
  menteeId: string,
  date: string,
  accountId?: string
): Promise<DailyRoutine | null> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("daily_routines")
      .select("*")
      .eq("user_id", menteeId)
      .eq("date", date);

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[getMenteeRoutineAction] Error:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      accountId: data.account_id,
      date: data.date,
      aerobic: data.aerobic,
      diet: data.diet,
      reading: data.reading,
      meditation: data.meditation,
      preMarket: data.pre_market,
      prayer: data.prayer,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as unknown as DailyRoutine;
  } catch (error) {
    console.error("[getMenteeRoutineAction] Unexpected error:", error);
    return null;
  }
}

// ========================================
// TRADE COMMENTS
// ========================================

/**
 * Get comments for a trade.
 */
export async function getTradeCommentsAction(tradeId: string): Promise<TradeComment[]> {
  try {
    const result = await prismaMentorRepo.getTradeComments(tradeId);

    if (result.error) {
      console.error("[getTradeCommentsAction] Error:", result.error);
      return [];
    }

    return (result.data || []) as unknown as TradeComment[];
  } catch (error) {
    console.error("[getTradeCommentsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Add a comment to a trade.
 */
export async function addTradeCommentAction(
  tradeId: string,
  content: string
): Promise<{ success: boolean; comment?: TradeComment; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentorRepo.addTradeComment(tradeId, userId, content);

    if (result.error) {
      console.error("[addTradeCommentAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, comment: result.data as unknown as TradeComment };
  } catch (error) {
    console.error("[addTradeCommentAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a trade comment.
 */
export async function deleteTradeCommentAction(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentorRepo.deleteTradeComment(commentId, userId);

    if (result.error) {
      console.error("[deleteTradeCommentAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteTradeCommentAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Check if the user can comment on a trade.
 */
export async function canCommentOnTradeAction(tradeId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const tradeResult = await prismaTradeRepo.getById(tradeId);
    const trade = tradeResult.data;

    if (!trade) return false;
    if (trade.userId === userId) return true;

    const invitesResult = await prismaMentorRepo.getMentees(userId);
    const invite = invitesResult.data?.find(
      (i) => i.menteeId === trade.userId && i.permission === "comment"
    );

    return !!invite;
  } catch (error) {
    console.error("[canCommentOnTradeAction] Unexpected error:", error);
    return false;
  }
}
