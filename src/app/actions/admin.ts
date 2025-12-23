"use server";

/**
 * Admin Server Actions
 *
 * Server-side actions for admin operations using Prisma ORM.
 * Covers user management, admin stats, and audit logs.
 *
 * @example
 * import { getAllUsersAction, updateUserStatusAction } from "@/app/actions/admin";
 *
 * const users = await getAllUsersAction();
 * const success = await updateUserStatusAction(userId, "approved");
 */

import { prismaAdminRepo, UserExtended, AuditLog, AdminStats } from "@/lib/repositories/prisma";
import { getCurrentUserId } from "@/lib/prisma/auth";

// ========================================
// USER PROFILE
// ========================================

/**
 * Get current user's extended profile.
 */
export async function getCurrentUserExtendedAction(): Promise<UserExtended | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaAdminRepo.getUserExtended(userId);

    if (result.error) {
      console.error("[getCurrentUserExtendedAction] Error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getCurrentUserExtendedAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Check if current user is admin.
 */
export async function isAdminAction(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const result = await prismaAdminRepo.isAdmin(userId);
    return result.data || false;
  } catch (error) {
    console.error("[isAdminAction] Unexpected error:", error);
    return false;
  }
}

/**
 * Check if current user is approved.
 */
export async function isApprovedAction(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const result = await prismaAdminRepo.isApproved(userId);
    return result.data || false;
  } catch (error) {
    console.error("[isApprovedAction] Unexpected error:", error);
    return false;
  }
}

/**
 * Update last login timestamp.
 */
export async function updateLastLoginAction(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const result = await prismaAdminRepo.updateLastLogin(userId);
    return result.data || false;
  } catch (error) {
    console.error("[updateLastLoginAction] Unexpected error:", error);
    return false;
  }
}

// ========================================
// ADMIN: USER MANAGEMENT
// ========================================

/**
 * Get all users (admin only).
 */
export async function getAllUsersAction(): Promise<UserExtended[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) return [];

    const result = await prismaAdminRepo.getAllUsers();

    if (result.error) {
      console.error("[getAllUsersAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getAllUsersAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get user by ID (admin only).
 */
export async function getUserByIdAction(targetUserId: string): Promise<UserExtended | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) return null;

    const result = await prismaAdminRepo.getUserExtended(targetUserId);

    if (result.error) {
      console.error("[getUserByIdAction] Error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getUserByIdAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Update user status (admin only).
 */
export async function updateUserStatusAction(
  targetUserId: string,
  status: UserExtended["status"],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) {
      return { success: false, error: "Not authorized" };
    }

    const result = await prismaAdminRepo.updateUserStatus(targetUserId, status, userId, notes);

    if (result.error) {
      console.error("[updateUserStatusAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Log the action
    await prismaAdminRepo.logAction(userId, "update_user_status", "user", targetUserId, {
      status,
      notes,
    });

    return { success: true };
  } catch (error) {
    console.error("[updateUserStatusAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update user role (admin only).
 */
export async function updateUserRoleAction(
  targetUserId: string,
  role: UserExtended["role"]
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) {
      return { success: false, error: "Not authorized" };
    }

    const result = await prismaAdminRepo.updateUserRole(targetUserId, role);

    if (result.error) {
      console.error("[updateUserRoleAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Log the action
    await prismaAdminRepo.logAction(userId, "update_user_role", "user", targetUserId, { role });

    return { success: true };
  } catch (error) {
    console.error("[updateUserRoleAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// ========================================
// ADMIN STATS
// ========================================

/**
 * Get admin dashboard stats.
 */
export async function getAdminStatsAction(): Promise<AdminStats | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) return null;

    const result = await prismaAdminRepo.getAdminStats();

    if (result.error) {
      console.error("[getAdminStatsAction] Error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getAdminStatsAction] Unexpected error:", error);
    return null;
  }
}

// ========================================
// AUDIT LOGS
// ========================================

/**
 * Log an action.
 */
export async function logActionAction(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();

    const result = await prismaAdminRepo.logAction(
      userId,
      action,
      resourceType,
      resourceId,
      metadata
    );

    if (result.error) {
      console.error("[logActionAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, logId: result.data?.id };
  } catch (error) {
    console.error("[logActionAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get audit logs (admin only).
 */
export async function getAuditLogsAction(options?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) return [];

    const result = await prismaAdminRepo.getAuditLogs(options);

    if (result.error) {
      console.error("[getAuditLogsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getAuditLogsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get unique action types for filtering.
 */
export async function getUniqueActionsAction(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Verify admin status
    const isAdmin = await prismaAdminRepo.isAdmin(userId);
    if (!isAdmin.data) return [];

    const result = await prismaAdminRepo.getUniqueActions();

    if (result.error) {
      console.error("[getUniqueActionsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getUniqueActionsAction] Unexpected error:", error);
    return [];
  }
}
