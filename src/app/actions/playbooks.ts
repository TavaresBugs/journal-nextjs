"use server";

/**
 * Playbook Server Actions
 *
 * Server-side actions for playbook CRUD operations using Prisma ORM.
 */

import { prismaPlaybookRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { Playbook, SharedPlaybook, PlaybookStats } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get all playbooks for the current user or a specific account.
 */
export async function getPlaybooksAction(accountId?: string): Promise<Playbook[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = accountId
      ? await prismaPlaybookRepo.getByAccountId(accountId)
      : await prismaPlaybookRepo.getByUserId(userId);

    if (result.error) {
      console.error("[getPlaybooksAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getPlaybooksAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get playbook statistics (aggregated server-side).
 */
export async function getPlaybookStatsAction(accountId?: string): Promise<PlaybookStats[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaPlaybookRepo.getPlaybookStats(userId, accountId);

    if (result.error) {
      console.error("[getPlaybookStatsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getPlaybookStatsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Create a new playbook.
 */
export async function createPlaybookAction(
  playbook: Partial<Playbook>
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaPlaybookRepo.create({ ...playbook, userId });

    if (result.error) {
      console.error("[createPlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/laboratory");
    return { success: true, playbook: result.data || undefined };
  } catch (error) {
    console.error("[createPlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update an existing playbook.
 */
export async function updatePlaybookAction(
  playbook: Playbook
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaPlaybookRepo.update(playbook.id, userId, playbook);

    if (result.error) {
      console.error("[updatePlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/laboratory");
    return { success: true };
  } catch (error) {
    console.error("[updatePlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a playbook.
 */
export async function deletePlaybookAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaPlaybookRepo.delete(id, userId);

    if (result.error) {
      console.error("[deletePlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/laboratory");
    return { success: true };
  } catch (error) {
    console.error("[deletePlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Clone a shared playbook into the current user's library.
 */
export async function clonePlaybookAction(
  sharedPlaybook: SharedPlaybook
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const sourcePlaybook = sharedPlaybook.playbook;
    if (!sourcePlaybook) {
      return { success: false, error: "Invalid source playbook data" };
    }

    const newPlaybookData: Partial<Playbook> = {
      name: sourcePlaybook.name,
      description: sourcePlaybook.description || sharedPlaybook.description,
      icon: sourcePlaybook.icon,
      color: sourcePlaybook.color,
      ruleGroups: sourcePlaybook.ruleGroups,
      userId: userId,
    };

    const result = await prismaPlaybookRepo.create(newPlaybookData);

    if (result.error) {
      console.error("[clonePlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/laboratory");
    return { success: true, playbook: result.data || undefined };
  } catch (error) {
    console.error("[clonePlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
