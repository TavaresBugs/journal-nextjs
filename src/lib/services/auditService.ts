/**
 * Enhanced Audit Logging Service
 *
 * Centralized audit logging with full context, before/after tracking,
 * and proper data preservation for compliance and traceability.
 */

import { prisma } from "@/lib/database";
import { headers } from "next/headers";

// ========================================
// TYPES
// ========================================

export interface AuditTargetUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogParams {
  // Actor (who performed the action)
  actorId: string;
  actorEmail?: string | null;

  // Action details
  action: string;
  resourceType: string;
  resourceId: string;

  // Target user (who was affected) - preserved even if deleted
  targetUser?: AuditTargetUser | null;

  // Changes (before/after)
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;

  // Optional context
  reason?: string;
  sessionId?: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get client IP from request headers
 */
async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Get user agent from request headers
 */
async function getUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("user-agent") || null;
  } catch {
    return null;
  }
}

// ========================================
// MAIN LOGGING FUNCTION
// ========================================

/**
 * Log an audit event with full context.
 *
 * @example
 * await logAuditEvent({
 *   actorId: adminUserId,
 *   actorEmail: "admin@example.com",
 *   action: "user_deleted",
 *   resourceType: "user",
 *   resourceId: targetUserId,
 *   targetUser: { id: targetUserId, email: "user@example.com", name: "João" },
 *   oldValues: { status: "approved" },
 *   newValues: { deleted: true },
 *   reason: "Account cleanup"
 * });
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const [ipAddress, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);

    // Prepare JSON values - ensure they're serializable
    const oldValuesJson = params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : {};
    const newValuesJson = params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : {};

    await prisma.audit_logs.create({
      data: {
        user_id: params.actorId,
        actor_email: params.actorEmail || null,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,

        // Target user context (preserved even after deletion)
        target_user_id: params.targetUser?.id || null,
        target_user_email: params.targetUser?.email || null,
        target_user_name: params.targetUser?.name || null,

        // Before/after values (as serialized JSON)
        old_values: oldValuesJson,
        new_values: newValuesJson,

        // Context
        reason: params.reason || null,
        session_id: params.sessionId || null,

        // Request metadata
        ip_address: ipAddress,
        user_agent: userAgent,

        // Legacy metadata field (for backward compatibility)
        metadata: JSON.parse(
          JSON.stringify({
            ...(params.oldValues && { old_values: params.oldValues }),
            ...(params.newValues && { new_values: params.newValues }),
          })
        ),
      },
    });

    console.log(`[AuditLog] ${params.action} on ${params.resourceType}/${params.resourceId}`);
  } catch (error) {
    // Never fail the main operation due to audit logging errors
    console.error("[AuditLog] Failed to log audit event:", error);
  }
}

// ========================================
// CONVENIENCE WRAPPERS
// ========================================

/**
 * Log user deletion with context preservation.
 */
export async function logUserDeletion(
  actorId: string,
  actorEmail: string | null,
  targetUser: AuditTargetUser,
  previousStatus?: string
): Promise<void> {
  await logAuditEvent({
    actorId,
    actorEmail,
    action: "delete_user",
    resourceType: "user",
    resourceId: targetUser.id,
    targetUser,
    oldValues: previousStatus ? { status: previousStatus } : undefined,
    newValues: { deleted: true },
  });
}

/**
 * Log user status change with before/after.
 */
export async function logUserStatusChange(
  actorId: string,
  actorEmail: string | null,
  targetUser: AuditTargetUser,
  oldStatus: string,
  newStatus: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    actorId,
    actorEmail,
    action: "user_status_change",
    resourceType: "user",
    resourceId: targetUser.id,
    targetUser,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    reason,
  });
}

/**
 * Log user role change with before/after.
 */
export async function logUserRoleChange(
  actorId: string,
  actorEmail: string | null,
  targetUser: AuditTargetUser,
  oldRole: string,
  newRole: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    actorId,
    actorEmail,
    action: "user_role_change",
    resourceType: "user",
    resourceId: targetUser.id,
    targetUser,
    oldValues: { role: oldRole },
    newValues: { role: newRole },
    reason,
  });
}
