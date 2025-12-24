/**
 * Supabase Auth Integration
 *
 * Helpers to integrate Supabase authentication.
 * Safe to use in both Client Components and Server Actions.
 */

import { createClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

const logger = new Logger("Auth");

/**
 * Gets the current authenticated user from Supabase.
 * Throws if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[getCurrentUserId] Supabase auth error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
    }

    if (!user) {
      console.warn("[getCurrentUserId] No user found in session");
    } else {
      console.log("[getCurrentUserId] User authenticated:", user.id);
    }

    return user?.id || null;
  } catch (error) {
    console.error("[getCurrentUserId] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown",
    });
    return null;
  }
}

/**
 * Optional: Get user ID if authenticated, null otherwise.
 */
export async function getOptionalUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
