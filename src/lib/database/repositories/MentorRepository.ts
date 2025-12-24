/**
 * Prisma Mentor Repository
 *
 * Type-safe implementation of MentorRepository using Prisma ORM.
 * Handles mentor invites, account permissions, and trade comments.
 *
 * @example
 * import { prismaMentorRepo } from '@/lib/database/repositories';
 * const invites = await prismaMentorRepo.getSentInvites(userId);
 */

import { prisma } from "@/lib/database";
import {
  mentor_invites as PrismaMentorInvite,
  mentor_account_permissions as PrismaAccountPermission,
  trade_comments as PrismaTradeComment,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

// Domain types
export interface MentorInvite {
  id: string;
  mentorId: string | null;
  menteeId: string | null;
  mentorEmail: string;
  menteeEmail: string | null;
  menteeName?: string;
  menteeAvatar?: string;
  permission: "view" | "comment" | "full";
  status: "pending" | "accepted" | "rejected" | "revoked" | "expired";
  inviteToken: string;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
}

export interface MentorAccountPermission {
  id: string;
  inviteId: string;
  accountId: string;
  accountName?: string;
  canViewTrades: boolean;
  canViewJournal: boolean;
  canViewRoutines: boolean;
  createdAt: string;
  updatedAt: string;
}

import { MenteeOverview } from "@/types";

export interface TradeComment {
  id: string;
  tradeId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userAvatarUrl?: string;
}

// Mappers
function mapInviteFromPrisma(
  inv: PrismaMentorInvite & {
    users_mentor_invites_mentee_idTousers?: {
      profiles?: { display_name: string | null; avatar_url: string | null } | null;
      users_extended_users_extended_idTousers?: {
        name: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
  }
): MentorInvite {
  const user = inv.users_mentor_invites_mentee_idTousers;
  const profile = user?.profiles;
  const extended = user?.users_extended_users_extended_idTousers;

  const displayName =
    profile?.display_name || extended?.name || inv.mentee_email?.split("@")[0] || null;
  const avatarUrl = profile?.avatar_url || extended?.avatar_url || null;

  return {
    id: inv.id,
    mentorId: inv.mentor_id,
    menteeId: inv.mentee_id,
    mentorEmail: inv.mentor_email,
    menteeEmail: inv.mentee_email,
    menteeName: displayName || undefined,
    menteeAvatar: avatarUrl || undefined,
    permission: (inv.permission as MentorInvite["permission"]) || "view",
    status: (inv.status as MentorInvite["status"]) || "pending",
    inviteToken: inv.invite_token,
    createdAt: inv.created_at?.toISOString() || new Date().toISOString(),
    acceptedAt: inv.accepted_at?.toISOString() || null,
    expiresAt: inv.expires_at?.toISOString() || null,
  };
}

function mapPermissionFromPrisma(
  perm: PrismaAccountPermission & { accounts?: { name: string } | null }
): MentorAccountPermission {
  return {
    id: perm.id,
    inviteId: perm.invite_id,
    accountId: perm.account_id,
    accountName: perm.accounts?.name,
    canViewTrades: perm.can_view_trades ?? true,
    canViewJournal: perm.can_view_journal ?? true,
    canViewRoutines: perm.can_view_routines ?? true,
    createdAt: perm.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: perm.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function mapCommentFromPrisma(
  com: PrismaTradeComment & { users?: { email: string | null } | null }
): TradeComment {
  return {
    id: com.id,
    tradeId: com.trade_id,
    userId: com.user_id,
    content: com.content,
    createdAt: com.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: com.updated_at?.toISOString() || new Date().toISOString(),
    userName: com.users?.email?.split("@")[0] || "User",
  };
}

class PrismaMentorRepository {
  private logger = new Logger("PrismaMentorRepository");

  // ========================================
  // INVITES
  // ========================================

  /**
   * Get invites sent by a mentor.
   */
  async getSentInvites(mentorId: string): Promise<Result<MentorInvite[], AppError>> {
    this.logger.info("Fetching sent invites", { mentorId });

    try {
      const invites = await prisma.mentor_invites.findMany({
        where: { mentor_id: mentorId },
        include: {
          users_mentor_invites_mentee_idTousers: {
            include: {
              profiles: true,
              users_extended_users_extended_idTousers: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      return { data: invites.map(mapInviteFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch sent invites", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch sent invites", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get invites received by a mentee.
   */
  async getReceivedInvites(menteeEmail: string): Promise<Result<MentorInvite[], AppError>> {
    this.logger.info("Fetching received invites", { menteeEmail });

    try {
      const invites = await prisma.mentor_invites.findMany({
        where: {
          mentee_email: menteeEmail.toLowerCase(),
          status: "pending",
        },
        orderBy: { created_at: "desc" },
      });

      return { data: invites.map(mapInviteFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch received invites", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch received invites", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get accepted invites where user is the mentee.
   */
  async getMyMentors(menteeId: string): Promise<Result<MentorInvite[], AppError>> {
    this.logger.info("Fetching my mentors", { menteeId });

    try {
      const invites = await prisma.mentor_invites.findMany({
        where: {
          mentee_id: menteeId,
          status: "accepted",
        },
        orderBy: { accepted_at: "desc" },
      });

      return { data: invites.map(mapInviteFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch my mentors", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch my mentors", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get accepted invites where user is the mentor.
   */
  async getMentees(mentorId: string): Promise<Result<MentorInvite[], AppError>> {
    this.logger.info("Fetching mentees", { mentorId });

    try {
      const invites = await prisma.mentor_invites.findMany({
        where: {
          mentor_id: mentorId,
          status: "accepted",
        },
        orderBy: { accepted_at: "desc" },
      });

      return { data: invites.map(mapInviteFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch mentees", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch mentees", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get mentees overview with performance stats.
   */
  async getMenteesOverview(mentorId: string): Promise<Result<MenteeOverview[], AppError>> {
    this.logger.info("Fetching mentees overview", { mentorId });

    try {
      // OPTIMIZED: Single query with includes instead of N+1
      const invites = await prisma.mentor_invites.findMany({
        where: {
          mentor_id: mentorId,
          status: "accepted",
        },
        include: {
          mentor_account_permissions: {
            select: {
              account_id: true,
              can_view_trades: true,
            },
          },
          // Include mentee user data to get profile info
          users_mentor_invites_mentee_idTousers: {
            include: {
              profiles: true,
              users_extended_users_extended_idTousers: true,
            },
          },
        },
        orderBy: { accepted_at: "desc" },
      });

      // Collect all mentee IDs and their permitted account IDs for batch query
      const menteePermittedAccounts = new Map<string, string[]>();
      for (const invite of invites) {
        if (!invite.mentee_id) continue;
        const permittedIds = invite.mentor_account_permissions
          .filter((p) => p.can_view_trades)
          .map((p) => p.account_id);
        menteePermittedAccounts.set(invite.mentee_id, permittedIds);
      }

      // OPTIMIZED: Batch fetch all trades for all mentees in a single query
      const menteeIds = Array.from(menteePermittedAccounts.keys());
      const allAccountIds = Array.from(menteePermittedAccounts.values()).flat();

      const trades =
        menteeIds.length > 0
          ? await prisma.trades.findMany({
              where: {
                user_id: { in: menteeIds },
                ...(allAccountIds.length > 0 ? { account_id: { in: allAccountIds } } : {}),
              },
              select: {
                id: true,
                user_id: true,
                account_id: true,
                outcome: true,
                entry_date: true,
              },
            })
          : [];

      // Calculate stats per mentee from batch results
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const overviews: MenteeOverview[] = [];

      for (const invite of invites) {
        if (!invite.mentee_id) continue;

        const permittedIds = menteePermittedAccounts.get(invite.mentee_id) || [];

        // Filter trades for this mentee and their permitted accounts
        const menteeTrades = trades.filter((t) => {
          if (t.user_id !== invite.mentee_id) return false;
          if (permittedIds.length === 0) return true; // No filter if no specific permissions
          return permittedIds.includes(t.account_id);
        });

        const totalTrades = menteeTrades.length;
        const wins = menteeTrades.filter((t) => t.outcome === "win").length;
        const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
        const recentTradesCount = menteeTrades.filter(
          (t) => t.entry_date && new Date(t.entry_date) >= sevenDaysAgo
        ).length;

        // Sort by date desc to get last trade
        const sortedTrades = [...menteeTrades].sort((a, b) => {
          const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
          const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
          return dateB - dateA;
        });
        const lastTradeDate = sortedTrades[0]?.entry_date
          ? sortedTrades[0].entry_date instanceof Date
            ? sortedTrades[0].entry_date.toISOString().split("T")[0]
            : String(sortedTrades[0].entry_date)
          : undefined;

        // Determine name and avatar
        // Priority: Profile -> UserExtended -> Email
        const user = invite.users_mentor_invites_mentee_idTousers;
        const profile = user?.profiles;
        const extended = user?.users_extended_users_extended_idTousers;

        const displayName =
          profile?.display_name ||
          extended?.name ||
          invite.mentee_email?.split("@")[0] ||
          "Mentorado";
        const avatarUrl = profile?.avatar_url || extended?.avatar_url || undefined;

        overviews.push({
          menteeId: invite.mentee_id,
          menteeName: displayName,
          menteeEmail: invite.mentee_email || "",
          menteeAvatar: avatarUrl,
          permission: (invite.permission as MenteeOverview["permission"]) || "view",
          totalTrades,
          winRate,
          recentTradesCount,
          lastTradeDate,
          status: "accepted",
          inviteId: invite.id,
          createdAt: invite.created_at?.toISOString(),
          acceptedAt: invite.accepted_at?.toISOString(),
        });
      }

      return { data: overviews, error: null };
    } catch (error) {
      this.logger.error("Failed to fetch mentees overview", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch mentees overview", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create a mentor invite.
   */
  async createInvite(
    mentorId: string,
    mentorEmail: string,
    menteeEmail: string,
    permission: MentorInvite["permission"] = "view"
  ): Promise<Result<MentorInvite, AppError>> {
    this.logger.info("Creating invite", { mentorId, menteeEmail });

    try {
      // Check for existing pending invite
      const existing = await prisma.mentor_invites.findFirst({
        where: {
          mentor_id: mentorId,
          mentee_email: menteeEmail.toLowerCase(),
          status: "pending",
        },
      });

      if (existing) {
        return { data: mapInviteFromPrisma(existing), error: null };
      }

      const created = await prisma.mentor_invites.create({
        data: {
          mentor_id: mentorId,
          mentor_email: mentorEmail.toLowerCase(),
          mentee_email: menteeEmail.toLowerCase(),
          permission,
        },
      });

      return { data: mapInviteFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create invite", { error });
      return {
        data: null,
        error: new AppError("Failed to create invite", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Accept an invite by token.
   */
  async acceptInvite(token: string, menteeId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Accepting invite", { token });

    try {
      await prisma.mentor_invites.update({
        where: {
          invite_token: token,
          status: "pending",
        },
        data: {
          mentee_id: menteeId,
          status: "accepted",
          accepted_at: new Date(),
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to accept invite", { error });
      return {
        data: null,
        error: new AppError("Failed to accept invite", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Reject an invite.
   */
  async rejectInvite(inviteId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Rejecting invite", { inviteId });

    try {
      await prisma.mentor_invites.update({
        where: { id: inviteId, status: "pending" },
        data: { status: "rejected" },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to reject invite", { error });
      return {
        data: null,
        error: new AppError("Failed to reject invite", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Revoke an invite.
   */
  async revokeInvite(inviteId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Revoking invite", { inviteId });

    try {
      await prisma.mentor_invites.update({
        where: { id: inviteId },
        data: { status: "revoked" },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to revoke invite", { error });
      return {
        data: null,
        error: new AppError("Failed to revoke invite", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update an invite (e.g. permission).
   */
  async updateInvite(
    inviteId: string,
    data: Partial<Pick<MentorInvite, "permission">>
  ): Promise<Result<boolean, AppError>> {
    this.logger.info("Updating invite", { inviteId, data });

    try {
      await prisma.mentor_invites.update({
        where: { id: inviteId },
        data: {
          permission: data.permission,
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to update invite", { error });
      return {
        data: null,
        error: new AppError("Failed to update invite", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // ACCOUNT PERMISSIONS
  // ========================================

  /**
   * Get account permissions for an invite.
   */
  async getAccountPermissions(
    inviteId: string
  ): Promise<Result<MentorAccountPermission[], AppError>> {
    this.logger.info("Fetching account permissions", { inviteId });

    try {
      const permissions = await prisma.mentor_account_permissions.findMany({
        where: { invite_id: inviteId },
        include: { accounts: { select: { name: true } } },
      });

      return { data: permissions.map(mapPermissionFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch account permissions", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch permissions", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Set account permission.
   */
  async setAccountPermission(
    inviteId: string,
    accountId: string,
    permissions: {
      canViewTrades?: boolean;
      canViewJournal?: boolean;
      canViewRoutines?: boolean;
    }
  ): Promise<Result<boolean, AppError>> {
    this.logger.info("Setting account permission", { inviteId, accountId });

    try {
      await prisma.mentor_account_permissions.upsert({
        where: {
          invite_id_account_id: {
            invite_id: inviteId,
            account_id: accountId,
          },
        },
        create: {
          invite_id: inviteId,
          account_id: accountId,
          can_view_trades: permissions.canViewTrades ?? true,
          can_view_journal: permissions.canViewJournal ?? true,
          can_view_routines: permissions.canViewRoutines ?? true,
        },
        update: {
          can_view_trades: permissions.canViewTrades,
          can_view_journal: permissions.canViewJournal,
          can_view_routines: permissions.canViewRoutines,
          updated_at: new Date(),
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to set account permission", { error });
      return {
        data: null,
        error: new AppError("Failed to set permission", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Remove account permission.
   */
  async removeAccountPermission(
    inviteId: string,
    accountId: string
  ): Promise<Result<boolean, AppError>> {
    this.logger.info("Removing account permission", { inviteId, accountId });

    try {
      await prisma.mentor_account_permissions.delete({
        where: {
          invite_id_account_id: {
            invite_id: inviteId,
            account_id: accountId,
          },
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to remove account permission", { error });
      return {
        data: null,
        error: new AppError("Failed to remove permission", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // TRADE COMMENTS
  // ========================================

  /**
   * Get comments for a trade.
   */
  async getTradeComments(tradeId: string): Promise<Result<TradeComment[], AppError>> {
    this.logger.info("Fetching trade comments", { tradeId });

    try {
      const comments = await prisma.trade_comments.findMany({
        where: { trade_id: tradeId },
        include: { users: { select: { email: true } } },
        orderBy: { created_at: "asc" },
      });

      return { data: comments.map(mapCommentFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trade comments", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch comments", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Add a comment to a trade.
   */
  async addTradeComment(
    tradeId: string,
    userId: string,
    content: string
  ): Promise<Result<TradeComment, AppError>> {
    this.logger.info("Adding trade comment", { tradeId, userId });

    try {
      const created = await prisma.trade_comments.create({
        data: {
          trade_id: tradeId,
          user_id: userId,
          content,
        },
        include: { users: { select: { email: true } } },
      });

      return { data: mapCommentFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to add trade comment", { error });
      return {
        data: null,
        error: new AppError("Failed to add comment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete a trade comment.
   */
  async deleteTradeComment(commentId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting trade comment", { commentId });

    try {
      await prisma.trade_comments.delete({
        where: { id: commentId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete trade comment", { error });
      return {
        data: null,
        error: new AppError("Failed to delete comment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaMentorRepo = new PrismaMentorRepository();
export { PrismaMentorRepository };
