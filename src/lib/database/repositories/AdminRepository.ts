/**
 * Prisma Admin Repository
 *
 * Type-safe implementation of AdminRepository using Prisma ORM.
 * Handles user management, audit logs, and admin stats.
 *
 * @example
 * import { prismaAdminRepo } from '@/lib/database/repositories';
 * const users = await prismaAdminRepo.getAllUsers();
 */

import { prisma } from "@/lib/database";
import {
  users_extended as PrismaUsersExtended,
  audit_logs as PrismaAuditLog,
  Prisma,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

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
  // Target user context (preserved even after deletion)
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  // Before/After values
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  // Context
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

// Mappers
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
    // Target user context
    targetUserId: log.target_user_id || null,
    targetUserEmail: log.target_user_email || null,
    targetUserName: log.target_user_name || null,
    // Before/After values
    oldValues: log.old_values as Record<string, unknown> | null,
    newValues: log.new_values as Record<string, unknown> | null,
    // Context
    reason: log.reason || null,
    sessionId: log.session_id || null,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.created_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaAdminRepository {
  private logger = new Logger("PrismaAdminRepository");

  // ========================================
  // USER MANAGEMENT
  // ========================================

  /**
   * Get current user's extended profile.
   */
  async getUserExtended(userId: string): Promise<Result<UserExtended, AppError>> {
    this.logger.info("Fetching user extended", { userId });

    try {
      const user = await prisma.users_extended.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          data: null,
          error: new AppError("User not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: mapUserFromPrisma(user), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch user extended", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch user", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get all users (admin only).
   */
  async getAllUsers(): Promise<Result<UserExtended[], AppError>> {
    this.logger.info("Fetching all users");

    try {
      const users = await prisma.users_extended.findMany({
        orderBy: { created_at: "desc" },
      });

      return { data: users.map(mapUserFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch all users", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch users", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update user status.
   */
  async updateUserStatus(
    userId: string,
    status: UserExtended["status"],
    approvedBy: string,
    notes?: string
  ): Promise<Result<UserExtended, AppError>> {
    this.logger.info("Updating user status", { userId, status });

    try {
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

      return { data: mapUserFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update user status", { error });
      return {
        data: null,
        error: new AppError("Failed to update user status", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update user role.
   */
  async updateUserRole(
    userId: string,
    role: UserExtended["role"]
  ): Promise<Result<UserExtended, AppError>> {
    this.logger.info("Updating user role", { userId, role });

    try {
      const updated = await prisma.users_extended.update({
        where: { id: userId },
        data: {
          role,
          updated_at: new Date(),
        },
      });

      return { data: mapUserFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update user role", { error });
      return {
        data: null,
        error: new AppError("Failed to update user role", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update user name/nickname.
   */
  async updateUserName(userId: string, name: string): Promise<Result<UserExtended, AppError>> {
    this.logger.info("Updating user name", { userId, name });

    try {
      const updated = await prisma.users_extended.upsert({
        where: { id: userId },
        update: {
          name,
          updated_at: new Date(),
        },
        create: {
          id: userId,
          name,
          status: "pending",
          role: "user",
        },
      });

      return { data: mapUserFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update user name", { error });
      return {
        data: null,
        error: new AppError("Failed to update user name", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update last login timestamp.
   */
  async updateLastLogin(userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Updating last login", { userId });

    try {
      await prisma.users_extended.update({
        where: { id: userId },
        data: { last_login_at: new Date() },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to update last login", { error });
      return {
        data: null,
        error: new AppError("Failed to update last login", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Check if user is admin.
   */
  async isAdmin(userId: string): Promise<Result<boolean, AppError>> {
    try {
      const user = await prisma.users_extended.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return { data: user?.role === "admin", error: null };
    } catch (error) {
      this.logger.error("Failed to check admin status", { error });
      return {
        data: null,
        error: new AppError("Failed to check admin status", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Check if user is approved.
   */
  async isApproved(userId: string): Promise<Result<boolean, AppError>> {
    try {
      const user = await prisma.users_extended.findUnique({
        where: { id: userId },
        select: { status: true },
      });

      return { data: user?.status === "approved", error: null };
    } catch (error) {
      this.logger.error("Failed to check approval status", { error });
      return {
        data: null,
        error: new AppError("Failed to check approval status", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // ADMIN STATS
  // ========================================

  /**
   * Get admin dashboard stats.
   */
  async getAdminStats(): Promise<Result<AdminStats, AppError>> {
    this.logger.info("Fetching admin stats");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [userStats, roleStats] = await Promise.all([
        // Group by status
        prisma.users_extended.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        // Group by role
        prisma.users_extended.groupBy({
          by: ["role"],
          _count: { _all: true },
        }),
      ]);

      // Process Status Counts
      const totalUsers = userStats.reduce((acc, curr) => acc + curr._count._all, 0); // Total from buckets
      const pendingUsers = userStats.find((s) => s.status === "pending")?._count._all || 0;
      const approvedUsers = userStats.find((s) => s.status === "approved")?._count._all || 0;
      const suspendedUsers = userStats.find((s) => s.status === "suspended")?._count._all || 0;
      const rejectedUsers = userStats.find((s) => s.status === "rejected")?._count._all || 0;
      const bannedUsers = userStats.find((s) => s.status === "banned")?._count._all || 0;

      // Process Role Counts
      const adminUsers = roleStats.find((r) => r.role === "admin")?._count._all || 0;
      const mentorUsers = roleStats.find((r) => r.role === "mentor")?._count._all || 0;

      // Re-fetch time-based individually if aggregate is tricky or just use separate counts for clean logic
      // Actually, for "Today's logins" and "Today's signups", strict separation is better for accuracy without complex case logic in prisma
      const [todayLogins, todaySignups] = await Promise.all([
        prisma.users_extended.count({ where: { last_login_at: { gte: today } } }),
        prisma.users_extended.count({ where: { created_at: { gte: today } } }),
      ]);

      return {
        data: {
          totalUsers, // Or use total from aggregation if preferred, but adding buckets is safe
          pendingUsers,
          approvedUsers,
          suspendedUsers,
          rejectedUsers,
          bannedUsers,
          adminUsers,
          mentorUsers,
          todayLogins,
          todaySignups,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to fetch admin stats", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch admin stats", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // AUDIT LOGS
  // ========================================

  /**
   * Create an audit log entry.
   */
  async logAction(
    userId: string | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<AuditLog, AppError>> {
    this.logger.info("Creating audit log", { userId, action });

    try {
      const created = await prisma.audit_logs.create({
        data: {
          user_id: userId,
          action,
          resource_type: resourceType || null,
          resource_id: resourceId || null,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return { data: mapAuditLogFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create audit log", { error });
      return {
        data: null,
        error: new AppError("Failed to create audit log", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get audit logs with filtering.
   * Includes JOIN to get admin email and target user email for readability.
   */
  async getAuditLogs(options?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<AuditLog[], AppError>> {
    this.logger.info("Fetching audit logs", options);

    try {
      const logs = await prisma.audit_logs.findMany({
        where: {
          user_id: options?.userId,
          action: options?.action,
          resource_type: options?.resourceType,
        },
        include: {
          // JOIN to get admin (actor) email
          users: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      // Map logs and enrich with emails
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const baseLog = mapAuditLogFromPrisma(log);

          // Get admin email from joined users table
          const adminEmail = log.actor_email || log.users?.email || null;

          // For target user, try to get email from the new column first,
          // otherwise look up from users_extended if we have resource_id
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
              // User may have been deleted, that's ok
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

      return { data: enrichedLogs, error: null };
    } catch (error) {
      this.logger.error("Failed to fetch audit logs", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch audit logs", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get unique action types for filtering.
   */
  async getUniqueActions(): Promise<Result<string[], AppError>> {
    this.logger.info("Fetching unique actions");

    try {
      const logs = await prisma.audit_logs.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      });

      return { data: logs.map((l) => l.action), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch unique actions", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch unique actions", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaAdminRepo = new PrismaAdminRepository();
export { PrismaAdminRepository };
