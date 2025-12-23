"use server";

import { prismaRoutineRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { DailyRoutine } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get all daily routines for an account.
 */
export async function getDailyRoutinesAction(accountId: string): Promise<DailyRoutine[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaRoutineRepo.getByAccountId(accountId);
    if (result.error) {
      console.error("[getDailyRoutinesAction] Error:", result.error);
      return [];
    }

    // Filter for user ownership as extra security
    return (result.data || []).filter((r) => r.userId === userId);
  } catch (error) {
    console.error("[getDailyRoutinesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Save (create or update) a daily routine.
 */
export async function saveDailyRoutineAction(
  routine: Partial<DailyRoutine>
): Promise<{ success: boolean; routine?: DailyRoutine; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const routineWithUser = { ...routine, userId };
    const result = await prismaRoutineRepo.save(routineWithUser);

    if (result.error) {
      console.error("[saveDailyRoutineAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard
    if (routine.accountId) {
      revalidatePath(`/dashboard/${routine.accountId}`, "page");
    }

    return { success: true, routine: result.data || undefined };
  } catch (error) {
    console.error("[saveDailyRoutineAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a daily routine.
 */
export async function deleteDailyRoutineAction(
  id: string,
  accountId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaRoutineRepo.delete(id, userId);

    if (result.error) {
      console.error("[deleteDailyRoutineAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard
    if (accountId) {
      revalidatePath(`/dashboard/${accountId}`, "page");
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteDailyRoutineAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
