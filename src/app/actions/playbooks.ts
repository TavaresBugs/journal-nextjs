"use server";

/**
 * Playbook Server Actions
 *
 * Server-side actions for playbook CRUD operations using Prisma ORM.
 */

import { prismaPlaybookRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { Playbook, SharedPlaybook, PlaybookStats } from "@/types";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Get all playbooks for the current user or a specific account.
 * CACHED: 5 minutes TTL, invalidated when playbooks change.
 */
export async function getPlaybooksAction(accountId?: string): Promise<Playbook[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Use unstable_cache for time-based caching
    const getCachedPlaybooks = unstable_cache(
      async (uId: string, accId?: string) => {
        const result = accId
          ? await prismaPlaybookRepo.getByAccountId(accId)
          : await prismaPlaybookRepo.getByUserId(uId);
        if (result.error) {
          console.error("[getPlaybooksAction] Error:", result.error);
          return [];
        }
        return result.data || [];
      },
      [`playbooks-${userId}-${accountId || "all"}`],
      {
        revalidate: 300, // 5 minutes TTL
        tags: [`playbooks:${userId}`],
      }
    );

    return await getCachedPlaybooks(userId, accountId);
  } catch (error) {
    console.error("[getPlaybooksAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get playbook statistics (aggregated server-side).
 * CACHED: 60 seconds TTL, invalidated when trades or playbooks change.
 */
export async function getPlaybookStatsAction(accountId?: string): Promise<PlaybookStats[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Use unstable_cache for time-based caching
    const getCachedStats = unstable_cache(
      async (uId: string, accId?: string) => {
        const result = await prismaPlaybookRepo.getPlaybookStats(uId, accId);
        if (result.error) {
          console.error("[getPlaybookStatsAction] Error:", result.error);
          return [];
        }
        return result.data || [];
      },
      [`playbook-stats-${userId}-${accountId || "all"}`],
      {
        revalidate: 60, // 60 seconds TTL (stats change with trades)
        tags: [`playbooks:${userId}`, `playbook-stats:${userId}`],
      }
    );

    return await getCachedStats(userId, accountId);
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

    revalidateTag(`playbooks:${userId}`, "max");
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

    revalidateTag(`playbooks:${userId}`, "max");
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

    revalidateTag(`playbooks:${userId}`, "max");
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
