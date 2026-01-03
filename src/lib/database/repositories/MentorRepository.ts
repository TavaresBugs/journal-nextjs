/**
 * Prisma Mentor Repository
 *
 * Type-safe implementation of MentorRepository using Prisma ORM.
 * Handles mentor invites, account permissions, and trade comments.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  mentor_invites as PrismaMentorInvite,
  mentor_account_permissions as PrismaAccountPermission,
  trade_comments as PrismaTradeComment,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
import { MenteeOverview } from "@/types";

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
export function mapInviteFromPrisma(
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

export function mapPermissionFromPrisma(
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

export function mapCommentFromPrisma(
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

class PrismaMentorRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaMentorRepository";

  // INVITES
  async getSentInvites(mentorId: string): Promise<Result<MentorInvite[], AppError>> {
    return this.withQuery(
      "getSentInvites",
      async () => {
        const invites = await prisma.mentor_invites.findMany({
          where: { mentor_id: mentorId },
          include: {
            users_mentor_invites_mentee_idTousers: {
              include: { profiles: true, users_extended_users_extended_idTousers: true },
            },
          },
          orderBy: { created_at: "desc" },
        });
        return invites.map(mapInviteFromPrisma);
      },
      { mentorId }
    );
  }

  async getReceivedInvites(menteeEmail: string): Promise<Result<MentorInvite[], AppError>> {
    return this.withQuery(
      "getReceivedInvites",
      async () => {
        const invites = await prisma.mentor_invites.findMany({
          where: { mentee_email: menteeEmail.toLowerCase(), status: "pending" },
          orderBy: { created_at: "desc" },
        });
        return invites.map(mapInviteFromPrisma);
      },
      { menteeEmail }
    );
  }

  async getMyMentors(menteeId: string): Promise<Result<MentorInvite[], AppError>> {
    return this.withQuery(
      "getMyMentors",
      async () => {
        const invites = await prisma.mentor_invites.findMany({
          where: { mentee_id: menteeId, status: "accepted" },
          orderBy: { accepted_at: "desc" },
        });
        return invites.map(mapInviteFromPrisma);
      },
      { menteeId }
    );
  }

  async getMentees(mentorId: string): Promise<Result<MentorInvite[], AppError>> {
    return this.withQuery(
      "getMentees",
      async () => {
        const invites = await prisma.mentor_invites.findMany({
          where: { mentor_id: mentorId, status: "accepted" },
          orderBy: { accepted_at: "desc" },
        });
        return invites.map(mapInviteFromPrisma);
      },
      { mentorId }
    );
  }

  async getMenteesOverview(mentorId: string): Promise<Result<MenteeOverview[], AppError>> {
    return this.withQuery(
      "getMenteesOverview",
      async () => {
        const invites = await prisma.mentor_invites.findMany({
          where: { mentor_id: mentorId, status: "accepted" },
          include: {
            mentor_account_permissions: { select: { account_id: true, can_view_trades: true } },
            users_mentor_invites_mentee_idTousers: {
              include: { profiles: true, users_extended_users_extended_idTousers: true },
            },
          },
          orderBy: { accepted_at: "desc" },
        });

        const menteePermittedAccounts = new Map<string, string[]>();
        for (const invite of invites) {
          if (!invite.mentee_id) continue;
          const permittedIds = invite.mentor_account_permissions
            .filter((p) => p.can_view_trades)
            .map((p) => p.account_id);
          menteePermittedAccounts.set(invite.mentee_id, permittedIds);
        }

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

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return invites
          .filter((i) => i.mentee_id)
          .map((invite) => {
            const permittedIds = menteePermittedAccounts.get(invite.mentee_id!) || [];
            const menteeTrades = trades.filter((t) => {
              if (t.user_id !== invite.mentee_id) return false;
              if (permittedIds.length === 0) return true;
              return permittedIds.includes(t.account_id);
            });

            const totalTrades = menteeTrades.length;
            const wins = menteeTrades.filter((t) => t.outcome === "win").length;
            const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
            const recentTradesCount = menteeTrades.filter(
              (t) => t.entry_date && new Date(t.entry_date) >= sevenDaysAgo
            ).length;

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

            const user = invite.users_mentor_invites_mentee_idTousers;
            const profile = user?.profiles;
            const extended = user?.users_extended_users_extended_idTousers;
            const displayName =
              profile?.display_name ||
              extended?.name ||
              invite.mentee_email?.split("@")[0] ||
              "Mentorado";
            const avatarUrl = profile?.avatar_url || extended?.avatar_url || undefined;

            return {
              menteeId: invite.mentee_id!,
              menteeName: displayName,
              menteeEmail: invite.mentee_email || "",
              menteeAvatar: avatarUrl,
              permission: (invite.permission as MenteeOverview["permission"]) || "view",
              totalTrades,
              winRate,
              recentTradesCount,
              lastTradeDate,
              status: "accepted" as const,
              inviteId: invite.id,
              createdAt: invite.created_at?.toISOString(),
              acceptedAt: invite.accepted_at?.toISOString(),
            };
          });
      },
      { mentorId }
    );
  }

  async createInvite(
    mentorId: string,
    mentorEmail: string,
    menteeEmail: string,
    permission: MentorInvite["permission"] = "view"
  ): Promise<Result<MentorInvite, AppError>> {
    return this.withQuery(
      "createInvite",
      async () => {
        const existing = await prisma.mentor_invites.findFirst({
          where: {
            mentor_id: mentorId,
            mentee_email: menteeEmail.toLowerCase(),
            status: "pending",
          },
        });
        if (existing) return mapInviteFromPrisma(existing);

        const created = await prisma.mentor_invites.create({
          data: {
            mentor_id: mentorId,
            mentor_email: mentorEmail.toLowerCase(),
            mentee_email: menteeEmail.toLowerCase(),
            permission,
          },
        });
        return mapInviteFromPrisma(created);
      },
      { mentorId, menteeEmail }
    );
  }

  async acceptInvite(token: string, menteeId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "acceptInvite",
      async () => {
        await prisma.mentor_invites.update({
          where: { invite_token: token, status: "pending" },
          data: { mentee_id: menteeId, status: "accepted", accepted_at: new Date() },
        });
        return true;
      },
      { token }
    );
  }

  async rejectInvite(inviteId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "rejectInvite",
      async () => {
        await prisma.mentor_invites.update({
          where: { id: inviteId, status: "pending" },
          data: { status: "rejected" },
        });
        return true;
      },
      { inviteId }
    );
  }

  async revokeInvite(inviteId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "revokeInvite",
      async () => {
        await prisma.mentor_invites.update({
          where: { id: inviteId },
          data: { status: "revoked" },
        });
        return true;
      },
      { inviteId }
    );
  }

  async updateInvite(
    inviteId: string,
    data: Partial<Pick<MentorInvite, "permission">>
  ): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "updateInvite",
      async () => {
        await prisma.mentor_invites.update({
          where: { id: inviteId },
          data: { permission: data.permission },
        });
        return true;
      },
      { inviteId }
    );
  }

  // ACCOUNT PERMISSIONS
  async getAccountPermissions(
    inviteId: string
  ): Promise<Result<MentorAccountPermission[], AppError>> {
    return this.withQuery(
      "getAccountPermissions",
      async () => {
        const permissions = await prisma.mentor_account_permissions.findMany({
          where: { invite_id: inviteId },
          include: { accounts: { select: { name: true } } },
        });
        return permissions.map(mapPermissionFromPrisma);
      },
      { inviteId }
    );
  }

  async setAccountPermission(
    inviteId: string,
    accountId: string,
    permissions: { canViewTrades?: boolean; canViewJournal?: boolean; canViewRoutines?: boolean }
  ): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "setAccountPermission",
      async () => {
        await prisma.mentor_account_permissions.upsert({
          where: { invite_id_account_id: { invite_id: inviteId, account_id: accountId } },
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
        return true;
      },
      { inviteId, accountId }
    );
  }

  async removeAccountPermission(
    inviteId: string,
    accountId: string
  ): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "removeAccountPermission",
      async () => {
        await prisma.mentor_account_permissions.delete({
          where: { invite_id_account_id: { invite_id: inviteId, account_id: accountId } },
        });
        return true;
      },
      { inviteId, accountId }
    );
  }

  // TRADE COMMENTS
  async getTradeComments(tradeId: string): Promise<Result<TradeComment[], AppError>> {
    return this.withQuery(
      "getTradeComments",
      async () => {
        const comments = await prisma.trade_comments.findMany({
          where: { trade_id: tradeId },
          include: { users: { select: { email: true } } },
          orderBy: { created_at: "asc" },
        });
        return comments.map(mapCommentFromPrisma);
      },
      { tradeId }
    );
  }

  async addTradeComment(
    tradeId: string,
    userId: string,
    content: string
  ): Promise<Result<TradeComment, AppError>> {
    return this.withQuery(
      "addTradeComment",
      async () => {
        const created = await prisma.trade_comments.create({
          data: { trade_id: tradeId, user_id: userId, content },
          include: { users: { select: { email: true } } },
        });
        return mapCommentFromPrisma(created);
      },
      { tradeId, userId }
    );
  }

  async deleteTradeComment(commentId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteTradeComment",
      async () => {
        await prisma.trade_comments.delete({ where: { id: commentId, user_id: userId } });
        return true;
      },
      { commentId }
    );
  }
}

export const prismaMentorRepo = new PrismaMentorRepository();
export { PrismaMentorRepository };
