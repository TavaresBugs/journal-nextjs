"use server";

/**
 * Mentor Server Actions
 *
 * Server-side actions for mentor operations using Prisma ORM.
 * Covers invites, account permissions, and trade comments.
 */

import {
  prismaMentorRepo,
  prismaAdminRepo,
  prismaTradeRepo,
  prismaJournalRepo,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { prisma } from "@/lib/database";
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
import {
  getCachedPermissions,
  setCachedPermissions,
  // invalidatePermissionCache - will be used when permission changes are implemented
} from "@/lib/cache/mentorPermissionCache";

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

/**
 * Update invite permissions.
 */
export async function updateInvitePermissionsAction(
  inviteId: string,
  permission: "view" | "comment"
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaMentorRepo.updateInvite(inviteId, { permission });

    if (result.error) {
      console.error("[updateInvitePermissionsAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateInvitePermissionsAction] Unexpected error:", error);
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
 * OPTIMIZED: Uses server-side cache to avoid redundant queries.
 */
export async function getMenteePermittedAccountsAction(
  menteeId: string
): Promise<Array<{ id: string; name: string; currency: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Check cache first
    const cachedAccounts = getCachedPermissions(userId, menteeId);
    if (cachedAccounts) {
      return cachedAccounts; // 0ms - from cache!
    }

    // Cache miss - fetch from database
    const invitesResult = await prismaMentorRepo.getMentees(userId);
    const invite = invitesResult.data?.find((i) => i.menteeId === menteeId);

    if (!invite) return [];

    const permsResult = await prismaMentorRepo.getAccountPermissions(invite.id);

    if (permsResult.error) return [];

    const accounts = (permsResult.data || [])
      .filter((p) => p.canViewTrades)
      .map((p) => ({
        id: p.accountId,
        name: p.accountName || "Account",
        currency: "USD",
      }));

    // Store in cache for next calls
    setCachedPermissions(userId, menteeId, accounts);

    return accounts;
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
/**
 * Fetch trades for a mentee.
 */
export async function getMenteeTradesAction(
  menteeId: string,
  accountId?: string
): Promise<Trade[]> {
  try {
    const permittedAccounts = await getMenteePermittedAccountsAction(menteeId);
    const permittedIds = permittedAccounts.map((a) => a.id);

    // If no accounts are permitted, return empty
    if (permittedIds.length === 0) return [];

    // If accountId is provided, verify it is permitted
    if (accountId && !permittedIds.includes(accountId)) {
      console.warn("[getMenteeTradesAction] Unauthorized account access attempt");
      return [];
    }

    // If accountId is NOT provided, filter by all permitted accounts
    const accountIdsToFetch = accountId ? undefined : permittedIds; // API structure: if accountId provided, repo uses it. If not, we need pass list.

    const result = await prismaTradeRepo.getByUserId(menteeId, {
      accountId,
      accountIds: accountIdsToFetch,
    });
    return (result.data || []) as unknown as Trade[];
  } catch (error) {
    console.error("[getMenteeTradesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * OPTIMIZED: Get journal availability for a month (lightweight query).
 * Returns a map of dates with journal entry counts: { "2025-12-19": 3, "2025-12-21": 1 }
 */
export async function getMenteeJournalAvailabilityAction(
  menteeId: string,
  month: number, // 0-indexed (0 = January)
  year: number,
  accountId?: string
): Promise<Record<string, number>> {
  try {
    const permittedAccounts = await getMenteePermittedAccountsAction(menteeId);
    const permittedIds = permittedAccounts
      .filter((a) => !accountId || a.id === accountId)
      .map((a) => a.id);

    if (permittedIds.length === 0) return {};

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    const result = await prismaJournalRepo.getAvailabilityMap(
      menteeId,
      permittedIds,
      startDate,
      endDate
    );

    return result.data || {};
  } catch (error) {
    console.error("[getMenteeJournalAvailabilityAction] Error:", error);
    return {};
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
    const permittedAccounts = await getMenteePermittedAccountsAction(menteeId);
    const permittedIds = permittedAccounts.map((a) => a.id);

    if (permittedIds.length === 0) return [];

    if (accountId && !permittedIds.includes(accountId)) {
      return [];
    }

    // Use Prisma to include relations
    const entries = await prisma.journal_entries.findMany({
      where: {
        user_id: menteeId,
        date: new Date(date),
        account_id: accountId ? accountId : { in: permittedIds },
      },
      include: {
        journal_images: true,
        mentor_reviews: true,
      },
      orderBy: { created_at: "desc" },
    });

    return entries.map((db) => ({
      id: db.id,
      userId: db.user_id || "",
      accountId: db.account_id,
      date: db.date.toISOString().split("T")[0],
      title: db.title,
      asset: db.asset || undefined,
      tradeIds: db.trade_id ? [db.trade_id] : [],
      images: db.journal_images.map((img) => ({
        id: img.id,
        userId: img.user_id || "",
        journalEntryId: img.journal_entry_id,
        url: img.url,
        path: img.path || "",
        timeframe: img.timeframe,
        displayOrder: img.display_order ?? 0,
        createdAt: img.created_at?.toISOString() || new Date().toISOString(),
      })),
      emotion: db.emotion || undefined,
      analysis: db.analysis || undefined,
      notes: db.notes || undefined,
      createdAt: db.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: db.updated_at?.toISOString() || new Date().toISOString(),
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
    const permittedAccounts = await getMenteePermittedAccountsAction(menteeId);
    const permittedIds = permittedAccounts.map((a) => a.id);

    if (permittedIds.length === 0) return null;

    if (accountId && !permittedIds.includes(accountId)) {
      return null;
    }

    const routine = await prisma.daily_routines.findFirst({
      where: {
        user_id: menteeId,
        date: new Date(date),
        account_id: accountId ? accountId : { in: permittedIds },
      },
    });

    if (!routine) return null;

    return {
      id: routine.id,
      userId: routine.user_id || "",
      accountId: routine.account_id,
      date: routine.date.toISOString().split("T")[0],
      aerobic: routine.aerobic || false,
      diet: routine.diet || false,
      reading: routine.reading || false,
      meditation: routine.meditation || false,
      preMarket: routine.pre_market || false,
      prayer: routine.prayer || false,
      createdAt: routine.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: routine.updated_at?.toISOString() || new Date().toISOString(),
    } as unknown as DailyRoutine;
  } catch (error) {
    console.error("[getMenteeRoutineAction] Unexpected error:", error);
    return null;
  }
}

/**
 * OPTIMIZED: Batch fetch journal entries and routine for a mentee's day.
 * Reduces API calls from 2 to 1 by sharing the permission check.
 */
export async function getMenteeDayDataBatchAction(
  menteeId: string,
  date: string,
  accountId?: string
): Promise<{ journalEntries: JournalEntry[]; routine: DailyRoutine | null }> {
  try {
    // Single permission check for both queries
    const permittedAccounts = await getMenteePermittedAccountsAction(menteeId);
    const permittedIds = permittedAccounts.map((a) => a.id);

    if (permittedIds.length === 0) {
      return { journalEntries: [], routine: null };
    }

    if (accountId && !permittedIds.includes(accountId)) {
      return { journalEntries: [], routine: null };
    }

    const accountFilter = accountId ? accountId : { in: permittedIds };
    const dateObj = new Date(date);

    // Run both queries in parallel
    const [entries, routineData] = await Promise.all([
      prisma.journal_entries.findMany({
        where: {
          user_id: menteeId,
          date: dateObj,
          account_id: accountFilter,
        },
        include: {
          journal_images: true,
          mentor_reviews: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.daily_routines.findFirst({
        where: {
          user_id: menteeId,
          date: dateObj,
          account_id: accountFilter,
        },
      }),
    ]);

    const journalEntries = entries.map((db) => ({
      id: db.id,
      userId: db.user_id || "",
      accountId: db.account_id,
      date: db.date.toISOString().split("T")[0],
      title: db.title,
      asset: db.asset || undefined,
      tradeIds: db.trade_id ? [db.trade_id] : [],
      images: db.journal_images.map((img) => ({
        id: img.id,
        userId: img.user_id || "",
        journalEntryId: img.journal_entry_id,
        url: img.url,
        path: img.path || "",
        timeframe: img.timeframe,
        displayOrder: img.display_order ?? 0,
        createdAt: img.created_at?.toISOString() || new Date().toISOString(),
      })),
      emotion: db.emotion || undefined,
      analysis: db.analysis || undefined,
      notes: db.notes || undefined,
      createdAt: db.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: db.updated_at?.toISOString() || new Date().toISOString(),
    })) as unknown as JournalEntry[];

    const routine = routineData
      ? ({
          id: routineData.id,
          userId: routineData.user_id || "",
          accountId: routineData.account_id,
          date: routineData.date.toISOString().split("T")[0],
          aerobic: routineData.aerobic || false,
          diet: routineData.diet || false,
          reading: routineData.reading || false,
          meditation: routineData.meditation || false,
          preMarket: routineData.pre_market || false,
          prayer: routineData.prayer || false,
          createdAt: routineData.created_at?.toISOString() || new Date().toISOString(),
          updatedAt: routineData.updated_at?.toISOString() || new Date().toISOString(),
        } as unknown as DailyRoutine)
      : null;

    return { journalEntries, routine };
  } catch (error) {
    console.error("[getMenteeDayDataBatchAction] Unexpected error:", error);
    return { journalEntries: [], routine: null };
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

    // Get only the trade owner ID for permission check
    const ownerResult = await prismaTradeRepo.getTradeOwnerId(tradeId);
    const tradeOwnerId = ownerResult.data;

    if (!tradeOwnerId) return false;

    // If user owns the trade, they can comment
    if (tradeOwnerId === userId) return true;

    // Check if user is a mentor with "comment" permission for this mentee
    const invitesResult = await prismaMentorRepo.getMentees(userId);
    const invite = invitesResult.data?.find(
      (i) => i.menteeId === tradeOwnerId && i.permission === "comment"
    );

    return !!invite;
  } catch (error) {
    console.error("[canCommentOnTradeAction] Unexpected error:", error);
    return false;
  }
}
