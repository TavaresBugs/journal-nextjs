/**
 * Supabase Auth Integration
 *
 * Helpers to integrate Supabase authentication.
 * Safe to use in both Client Components and Server Actions.
 *
 * PERFORMANCE: All auth functions are wrapped with React cache() to deduplicate
 * calls within the same request. This saves ~30-50ms per action that would
 * otherwise call Supabase auth redundantly.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

const logger = new Logger("Auth");

/**
 * Gets the current authenticated user from Supabase.
 * Throws if not authenticated.
 *
 * CACHED: Deduplicates calls within the same request.
 */
export const getAuthenticatedUser = cache(async () => {
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
});

/**
 * Gets the current user ID or null if not authenticated.
 *
 * CACHED: Deduplicates calls within the same request.
 * Previously each Server Action called this separately, causing
 * ~30-50ms overhead per action. Now they share the result.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
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
});

/**
 * Optional: Get user ID if authenticated, null otherwise.
 *
 * CACHED: Deduplicates calls within the same request.
 */
export const getOptionalUserId = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
});
