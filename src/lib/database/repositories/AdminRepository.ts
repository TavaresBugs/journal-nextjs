/**
 * Prisma Admin Repository
 *
 * Type-safe implementation of AdminRepository using Prisma ORM.
 * Handles user management, audit logs, and admin stats.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  users_extended as PrismaUsersExtended,
  audit_logs as PrismaAuditLog,
  Prisma,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";

// Domain types
export interface UserExtended {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  role: "user" | "admin" | "mentor";
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  reason: string | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  suspendedUsers: number;
  rejectedUsers: number;
  bannedUsers: number;
  adminUsers: number;
  mentorUsers: number;
  todayLogins: number;
  todaySignups: number;
}

function mapUserFromPrisma(u: PrismaUsersExtended): UserExtended {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar_url,
    status: (u.status as UserExtended["status"]) || "pending",
    role: (u.role as UserExtended["role"]) || "user",
    approvedAt: u.approved_at?.toISOString() || null,
    approvedBy: u.approved_by,
    notes: u.notes,
    lastLoginAt: u.last_login_at?.toISOString() || null,
    createdAt: u.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: u.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function mapAuditLogFromPrisma(log: PrismaAuditLog): AuditLog {
  return {
    id: log.id,
    userId: log.user_id,
    actorEmail: log.actor_email || null,
    action: log.action,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    targetUserId: log.target_user_id || null,
    targetUserEmail: log.target_user_email || null,
    targetUserName: log.target_user_name || null,
    oldValues: log.old_values as Record<string, unknown> | null,
    newValues: log.new_values as Record<string, unknown> | null,
    reason: log.reason || null,
    sessionId: log.session_id || null,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.created_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaAdminRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaAdminRepository";

  async getUserExtended(userId: string): Promise<Result<UserExtended, AppError>> {
    return this.withQuery(
      "getUserExtended",
      async () => {
        const user = await prisma.users_extended.findUnique({ where: { id: userId } });
        if (!user) throw this.notFoundError("User");
        return mapUserFromPrisma(user);
      },
      { userId }
    );
  }

  async getAllUsers(): Promise<Result<UserExtended[], AppError>> {
    return this.withQuery("getAllUsers", async () => {
      const users = await prisma.users_extended.findMany({ orderBy: { created_at: "desc" } });
      return users.map(mapUserFromPrisma);
    });
  }

  async updateUserStatus(
    userId: string,
    status: UserExtended["status"],
    approvedBy: string,
    notes?: string
  ): Promise<Result<UserExtended, AppError>> {
    return this.withQuery(
      "updateUserStatus",
      async () => {
        const updated = await prisma.users_extended.update({
          where: { id: userId },
          data: {
            status,
            approved_at: status === "approved" ? new Date() : null,
            approved_by: status === "approved" ? approvedBy : null,
            notes: notes || null,
            updated_at: new Date(),
          },
        });
        return mapUserFromPrisma(updated);
      },
      { userId, status }
    );
  }

  async updateUserRole(
    userId: string,
    role: UserExtended["role"]
  ): Promise<Result<UserExtended, AppError>> {
    return this.withQuery(
      "updateUserRole",
      async () => {
        const updated = await prisma.users_extended.update({
          where: { id: userId },
          data: { role, updated_at: new Date() },
        });
        return mapUserFromPrisma(updated);
      },
      { userId, role }
    );
  }

  async updateUserName(userId: string, name: string): Promise<Result<UserExtended, AppError>> {
    return this.withQuery(
      "updateUserName",
      async () => {
        const updated = await prisma.users_extended.upsert({
          where: { id: userId },
          update: { name, updated_at: new Date() },
          create: { id: userId, name, status: "pending", role: "user" },
        });
        return mapUserFromPrisma(updated);
      },
      { userId, name }
    );
  }

  async updateLastLogin(userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "updateLastLogin",
      async () => {
        await prisma.users_extended.update({
          where: { id: userId },
          data: { last_login_at: new Date() },
        });
        return true;
      },
      { userId }
    );
  }

  async isAdmin(userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("isAdmin", async () => {
      const user = await prisma.users_extended.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role === "admin";
    });
  }

  async isApproved(userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("isApproved", async () => {
      const user = await prisma.users_extended.findUnique({
        where: { id: userId },
        select: { status: true },
      });
      return user?.status === "approved";
    });
  }

  async getAdminStats(): Promise<Result<AdminStats, AppError>> {
    return this.withQuery("getAdminStats", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [userStats, roleStats, todayLogins, todaySignups] = await Promise.all([
        prisma.users_extended.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.users_extended.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.users_extended.count({ where: { last_login_at: { gte: today } } }),
        prisma.users_extended.count({ where: { created_at: { gte: today } } }),
      ]);

      const totalUsers = userStats.reduce((acc, curr) => acc + curr._count._all, 0);
      return {
        totalUsers,
        pendingUsers: userStats.find((s) => s.status === "pending")?._count._all || 0,
        approvedUsers: userStats.find((s) => s.status === "approved")?._count._all || 0,
        suspendedUsers: userStats.find((s) => s.status === "suspended")?._count._all || 0,
        rejectedUsers: userStats.find((s) => s.status === "rejected")?._count._all || 0,
        bannedUsers: userStats.find((s) => s.status === "banned")?._count._all || 0,
        adminUsers: roleStats.find((r) => r.role === "admin")?._count._all || 0,
        mentorUsers: roleStats.find((r) => r.role === "mentor")?._count._all || 0,
        todayLogins,
        todaySignups,
      };
    });
  }

  async logAction(
    userId: string | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<AuditLog, AppError>> {
    return this.withQuery(
      "logAction",
      async () => {
        const created = await prisma.audit_logs.create({
          data: {
            user_id: userId,
            action,
            resource_type: resourceType || null,
            resource_id: resourceId || null,
            metadata: (metadata ?? {}) as Prisma.InputJsonValue,
          },
        });
        return mapAuditLogFromPrisma(created);
      },
      { userId, action }
    );
  }

  async getAuditLogs(options?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<AuditLog[], AppError>> {
    return this.withQuery("getAuditLogs", async () => {
      const logs = await prisma.audit_logs.findMany({
        where: {
          user_id: options?.userId,
          action: options?.action,
          resource_type: options?.resourceType,
        },
        include: { users: { select: { email: true } } },
        orderBy: { created_at: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      return Promise.all(
        logs.map(async (log) => {
          const baseLog = mapAuditLogFromPrisma(log);
          const adminEmail = log.actor_email || log.users?.email || null;

          let targetEmail = log.target_user_email;
          let targetName = log.target_user_name;

          if (!targetEmail && log.resource_type === "user" && log.resource_id) {
            try {
              const targetUser = await prisma.users_extended.findUnique({
                where: { id: log.resource_id },
                select: { email: true, name: true },
              });
              if (targetUser) {
                targetEmail = targetUser.email;
                targetName = targetUser.name;
              }
            } catch {
              // User may have been deleted
            }
          }

          return {
            ...baseLog,
            actorEmail: adminEmail,
            targetUserEmail: targetEmail,
            targetUserName: targetName,
          };
        })
      );
    });
  }

  async getUniqueActions(): Promise<Result<string[], AppError>> {
    return this.withQuery("getUniqueActions", async () => {
      const logs = await prisma.audit_logs.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      });
      return logs.map((l) => l.action);
    });
  }
}

export const prismaAdminRepo = new PrismaAdminRepository();
export { PrismaAdminRepository };
