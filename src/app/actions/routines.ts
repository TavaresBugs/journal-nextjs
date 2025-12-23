"use server";

/**
 * Routine Server Actions
 *
 * Server-side actions for daily routine operations using Prisma ORM.
 * These actions run exclusively on the server and can be called from client components.
 *
 * @example
 * // In a client component
 * import { getRoutinesAction, saveRoutineAction } from "@/app/actions/routines";
 *
 * const routines = await getRoutinesAction(accountId);
 * const success = await saveRoutineAction(routineData);
 */

import { prismaRoutineRepo } from "@/lib/repositories/prisma";
import { getCurrentUserId } from "@/lib/prisma/auth";
import { DailyRoutine } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get all daily routines for an account.
 * @param accountId - The account ID.
 * @returns List of routines or empty array.
 */
export async function getRoutinesAction(accountId: string): Promise<DailyRoutine[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaRoutineRepo.getByAccountId(accountId);

    if (result.error) {
      console.error("[getRoutinesAction] Error:", result.error);
      return [];
    }

    // Filter by user_id for extra security (RLS backup)
    return (result.data || []).filter((r) => r.userId === userId);
  } catch (error) {
    console.error("[getRoutinesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a single routine by account and date.
 * @param accountId - The account ID.
 * @param date - The date in YYYY-MM-DD format.
 * @returns The routine or null if not found.
 */
export async function getRoutineByDateAction(
  accountId: string,
  date: string
): Promise<DailyRoutine | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaRoutineRepo.getByDate(accountId, date);

    if (result.error) {
      console.error("[getRoutineByDateAction] Error:", result.error);
      return null;
    }

    // Verify ownership
    if (result.data && result.data.userId !== userId) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getRoutineByDateAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Save (create or update) a daily routine.
 * @param routine - The routine data to save.
 * @returns Object with success status and optional error message.
 */
export async function saveRoutineAction(
  routine: Partial<DailyRoutine>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const routineWithUser = { ...routine, userId };

    const result = await prismaRoutineRepo.save(routineWithUser);

    if (result.error) {
      console.error("[saveRoutineAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard to reflect changes
    if (routine.accountId) {
      revalidatePath(`/dashboard/${routine.accountId}`, "page");
    }

    return { success: true };
  } catch (error) {
    console.error("[saveRoutineAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a daily routine.
 * @param routineId - The routine ID to delete.
 * @returns Object with success status and optional error message.
 */
export async function deleteRoutineAction(
  routineId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaRoutineRepo.delete(routineId, userId);

    if (result.error) {
      console.error("[deleteRoutineAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteRoutineAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
