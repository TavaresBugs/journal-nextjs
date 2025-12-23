/**
 * Prisma + Supabase Auth Integration
 *
 * Helpers to integrate Prisma security with Supabase authentication.
 * Use these in Client Components and Server Actions.
 *
 * @example
 * // In a component or action
 * import { getSecurePrismaClient } from '@/lib/database/auth';
 *
 * const client = await getSecurePrismaClient();
 * const trades = await client.query(userId =>
 *   prismaTradeRepo.getByAccountId(accountId, userId)
 * );
 */

import { supabase } from "@/lib/supabase";
import { setUserContext, getUserContext, createSecureClient } from "./security";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

const logger = new Logger("PrismaAuth");

/**
 * Gets the current authenticated user from Supabase.
 * Throws if not authenticated.
 */
export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    logger.warn("Authentication required but user not found");
    throw new AppError("Authentication required", ErrorCode.AUTH_UNAUTHORIZED, 401);
  }

  return user;
}

/**
 * Gets the current user ID or null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Gets a secure Prisma client configured with the current user's context.
 * Use this in components and actions.
 *
 * @example
 * const client = await getSecurePrismaClient();
 * await client.query(async (userId) => {
 *   return prismaTradeRepo.getByAccountId(accountId, userId);
 * });
 */
export async function getSecurePrismaClient() {
  const user = await getAuthenticatedUser();
  return createSecureClient(user.id);
}

/**
 * Initializes user context from Supabase auth.
 * Call this at the start of an action.
 *
 * @example
 * export async function myAction() {
 *   const userId = await initUserContext();
 *   // Now getUserContext() returns the user
 * }
 */
export async function initUserContext(): Promise<string> {
  const user = await getAuthenticatedUser();
  setUserContext({ userId: user.id, role: "user" });
  return user.id;
}

/**
 * Gets user ID from context or throws.
 * Use after initUserContext() has been called.
 */
export function requireUserId(): string {
  const context = getUserContext();

  if (!context) {
    throw new AppError(
      "User context not initialized. Call initUserContext() first.",
      ErrorCode.AUTH_UNAUTHORIZED,
      401
    );
  }

  return context.userId;
}

/**
 * Optional: Get user ID if authenticated, null otherwise.
 */
export async function getOptionalUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
