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

import { prismaAdminRepo, UserExtended, AuditLog, AdminStats } from "@/lib/database/repositories";
import { deleteCurrentWeekEvents } from "@/lib/database/repositories/external/economicEvents.repository";
import { getCurrentUserId } from "@/lib/database/auth";
import { prisma } from "@/lib/database";
import {
  logUserStatusChange,
  logUserRoleChange,
  logUserDeletion,
} from "@/lib/services/auditService";

// ========================================
// SIGNUP: USER PROFILE CREATION
// ========================================

/**
 * Create user extended profile after signup.
 * Uses Prisma to bypass Supabase RLS policies.
 * This should be called from the client after successful auth signup.
 */
export async function createUserProfileAction(
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if profile already exists
    const existing = await prisma.users_extended.findUnique({
      where: { id: userId },
    });

    if (existing) {
      console.log("[createUserProfileAction] Profile already exists for:", userId);
      return { success: true };
    }

    // Create the profile with pending status
    await prisma.users_extended.create({
      data: {
        id: userId,
        email: email,
        status: "pending",
        role: "user",
        created_at: new Date(),
      },
    });

    console.log("[createUserProfileAction] Profile created for:", userId);
    return { success: true };
  } catch (error) {
    console.error("[createUserProfileAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create profile",
    };
  }
}

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
  } catch {
    return false;
  }
}

/**
 * Update current user's display name.
 */
export async function updateUserNameAction(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaAdminRepo.updateUserName(userId, name);

    if (result.error) {
      console.error("[updateUserNameAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateUserNameAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
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

    // Get current user for audit context (before update)
    const currentActor = await prismaAdminRepo.getUserExtended(userId);
    const targetUserBefore = await prismaAdminRepo.getUserExtended(targetUserId);
    const oldStatus = targetUserBefore.data?.status || "unknown";

    const result = await prismaAdminRepo.updateUserStatus(targetUserId, status, userId, notes);

    if (result.error) {
      console.error("[updateUserStatusAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Log with full context
    await logUserStatusChange(
      userId,
      currentActor.data?.email || null,
      {
        id: targetUserId,
        email: targetUserBefore.data?.email,
        name: targetUserBefore.data?.email?.split("@")[0] || null,
      },
      oldStatus,
      status,
      notes
    );

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

    // Get current user for audit context (before update)
    const currentActor = await prismaAdminRepo.getUserExtended(userId);
    const targetUserBefore = await prismaAdminRepo.getUserExtended(targetUserId);
    const oldRole = targetUserBefore.data?.role || "user";

    const result = await prismaAdminRepo.updateUserRole(targetUserId, role);

    if (result.error) {
      console.error("[updateUserRoleAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Log with full context
    await logUserRoleChange(
      userId,
      currentActor.data?.email || null,
      {
        id: targetUserId,
        email: targetUserBefore.data?.email,
        name: targetUserBefore.data?.email?.split("@")[0] || null,
      },
      oldRole,
      role
    );

    return { success: true };
  } catch (error) {
    console.error("[updateUserRoleAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete user completely (admin only).
 * WARNING: This will delete the user from users_extended only.
 * The auth user needs to be deleted separately from Supabase Dashboard.
 */
export async function deleteUserAction(
  targetUserId: string
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

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return { success: false, error: "Cannot delete yourself" };
    }

    // Get target user for audit context BEFORE deletion
    const currentActor = await prismaAdminRepo.getUserExtended(userId);
    const targetUser = await prismaAdminRepo.getUserExtended(targetUserId);

    if (targetUser.data?.role === "admin") {
      return { success: false, error: "Cannot delete another admin" };
    }

    // Capture data for audit BEFORE deletion
    const targetUserEmail = targetUser.data?.email || null;
    const targetUserStatus = targetUser.data?.status || "unknown";

    // Delete from users_extended
    await prisma.users_extended.delete({
      where: { id: targetUserId },
    });

    // Log with PRESERVED context (survives deletion)
    await logUserDeletion(
      userId,
      currentActor.data?.email || null,
      {
        id: targetUserId,
        email: targetUserEmail,
        name: targetUserEmail?.split("@")[0] || null,
      },
      targetUserStatus
    );

    return { success: true };
  } catch (error) {
    console.error("[deleteUserAction] Unexpected error:", error);
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

// ========================================
// GITHUB ACTIONS SYNC
// ========================================

const WORKFLOW_MAP = {
  calendar: "sync-calendar.yml",
  monthly: "sync-monthly.yml",
  history: "sync-history.yml",
};

/**
 * Trigger a GitHub Actions workflow dispatch.
 * Used for manual synchronization of calendar/monthly data.
 */
export async function triggerGithubSyncAction(
  workflow: "calendar" | "monthly" | "history"
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

    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER || "JhonTavares"; // Use env vars ideally
    const repoName = process.env.GITHUB_REPO_NAME || "Journal-NextJs"; // Use env vars ideally

    if (!githubToken) {
      console.error("[triggerGithubSyncAction] GITHUB_TOKEN is missing.");
      return { success: false, error: "Configuration Error: GITHUB_TOKEN missing" };
    }

    const workflowFile = WORKFLOW_MAP[workflow];
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

    console.log(`[triggerGithubSyncAction] Triggering ${workflowFile}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[triggerGithubSyncAction] GitHub API Error ${response.status}:`, errorText);
      return {
        success: false,
        error: `GitHub API Error: ${response.status}`,
      };
    }

    await logActionAction("trigger_sync", "system", workflowFile, {
      workflow,
      triggered_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("[triggerGithubSyncAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete all events for the current week.
 * Used for manual cleanup.
 */
export async function deleteWeeklyEventsAction(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
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

    const count = await deleteCurrentWeekEvents();

    await logActionAction("delete_weekly_events", "system", "calendar", {
      deleted_count: count,
      triggered_at: new Date().toISOString(),
    });

    return { success: true, deletedCount: count };
  } catch (error) {
    console.error("[deleteWeeklyEventsAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
