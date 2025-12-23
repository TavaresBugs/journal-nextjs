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
function mapInviteFromPrisma(inv: PrismaMentorInvite): MentorInvite {
  return {
    id: inv.id,
    mentorId: inv.mentor_id,
    menteeId: inv.mentee_id,
    mentorEmail: inv.mentor_email,
    menteeEmail: inv.mentee_email,
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
