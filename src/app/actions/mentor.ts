"use server";

/**
 * Mentor Server Actions
 *
 * Server-side actions for mentor operations using Prisma ORM.
 * Covers invites, account permissions, and trade comments.
 *
 * @example
 * import { getSentInvitesAction, inviteMenteeAction } from "@/app/actions/mentor";
 *
 * const invites = await getSentInvitesAction();
 * const invite = await inviteMenteeAction("mentee@email.com");
 */

import {
  prismaMentorRepo,
  MentorInvite,
  MentorAccountPermission,
  TradeComment,
  prismaAdminRepo,
} from "@/lib/repositories/prisma";
import { getCurrentUserId } from "@/lib/prisma/auth";
import { createClient } from "@/lib/supabase/server";

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

    return result.data || [];
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

    return result.data || [];
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

    return result.data || [];
  } catch (error) {
    console.error("[getMyMentorsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get all mentees for the current user.
 */
export async function getMenteesAction(): Promise<MentorInvite[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentorRepo.getMentees(userId);

    if (result.error) {
      console.error("[getMenteesAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMenteesAction] Unexpected error:", error);
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
    if (!user?.id || !user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentorRepo.createInvite(
      user.id,
      user.email,
      menteeEmail,
      permission
    );

    if (result.error) {
      console.error("[inviteMenteeAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, invite: result.data || undefined };
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

    return result.data || [];
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

    return result.data || [];
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

    return { success: true, comment: result.data || undefined };
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
