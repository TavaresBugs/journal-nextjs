// Action Helpers - utility functions for server actions

/**
 * Action Helpers
 *
 * Common patterns extracted from server actions to reduce boilerplate.
 * Provides authentication wrapper and result handling utilities.
 */

import { getCurrentUserId } from "@/lib/database/auth";
import { AppError } from "@/lib/errors";

// Standard action result types
export type ActionSuccess<T> = { success: true; data: T };
export type ActionError = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionError;

// Simpler mutation result (no data returned)
export type MutationResult = { success: boolean; error?: string };

/**
 * Wraps an action with authentication check and error handling.
 * Eliminates repetitive try-catch and auth check boilerplate.
 *
 * @example
 * export async function saveAccountAction(account: Partial<Account>) {
 *   return withAuth("saveAccountAction", async (userId) => {
 *     const result = await repo.create({ ...account, userId });
 *     return handleResult(result);
 *   });
 * }
 */
export async function withAuth<T>(
  actionName: string,
  fn: (userId: string) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }
    return await fn(userId);
  } catch (error) {
    console.error(`[${actionName}] Error:`, error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Wraps an action that doesn't need to return data.
 * For delete, update operations that just need success/failure.
 */
export async function withAuthMutation(
  actionName: string,
  fn: (userId: string) => Promise<MutationResult>
): Promise<MutationResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }
    return await fn(userId);
  } catch (error) {
    console.error(`[${actionName}] Error:`, error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Converts repository Result<T, AppError> to ActionResult<T>.
 * Handles error logging and message extraction.
 */
export function handleResult<T>(
  result: { data: T | null; error: AppError | null },
  actionName?: string
): ActionResult<T> {
  if (result.error) {
    if (actionName) {
      console.error(`[${actionName}] Error:`, result.error);
    }
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data as T };
}

/**
 * Converts repository Result to MutationResult (no data).
 */
export function handleMutationResult(
  result: { error: AppError | null },
  actionName?: string
): MutationResult {
  if (result.error) {
    if (actionName) {
      console.error(`[${actionName}] Error:`, result.error);
    }
    return { success: false, error: result.error.message };
  }
  return { success: true };
}

/**
 * Utility for read-only actions that return data or null.
 * Wraps with auth check only (no Result handling needed).
 */
export async function withAuthRead<T>(
  actionName: string,
  fn: (userId: string) => Promise<T | null>
): Promise<T | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return await fn(userId);
  } catch (error) {
    console.error(`[${actionName}] Error:`, error);
    return null;
  }
}
