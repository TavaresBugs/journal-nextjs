"use server";

/**
 * Share Server Actions
 *
 * Server-side actions for journal sharing using Prisma ORM.
 *
 * @example
 * import { createShareLinkAction } from "@/app/actions/share";
 *
 * const result = await createShareLinkAction(journalEntryId);
 * console.log(result.shareUrl);
 */

import { prismaShareRepo, SharedJournal } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";

/**
 * Create a share link for a journal entry.
 * If a valid link exists, it will be reused.
 */
export async function createShareLinkAction(
  journalEntryId: string,
  expirationDays = 3
): Promise<{ success: boolean; shareToken?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaShareRepo.createShareLink(userId, journalEntryId, expirationDays);

    if (result.error) {
      console.error("[createShareLinkAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, shareToken: result.data?.shareToken };
  } catch (error) {
    console.error("[createShareLinkAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get shared journal by token.
 */
export async function getSharedJournalByTokenAction(token: string): Promise<SharedJournal | null> {
  try {
    const result = await prismaShareRepo.getByToken(token);

    if (result.error) {
      // Don't log expired links as errors
      if (result.error.statusCode !== 410) {
        console.error("[getSharedJournalByTokenAction] Error:", result.error);
      }
      return null;
    }

    // Increment view count
    if (result.data) {
      await prismaShareRepo.incrementViewCount(token);
    }

    return result.data;
  } catch (error) {
    console.error("[getSharedJournalByTokenAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Get all shared journals for the current user.
 */
export async function getMySharedJournalsAction(): Promise<SharedJournal[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaShareRepo.getUserSharedJournals(userId);

    if (result.error) {
      console.error("[getMySharedJournalsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMySharedJournalsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Delete a share link.
 */
export async function deleteShareLinkAction(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaShareRepo.deleteShareLink(shareId, userId);

    if (result.error) {
      console.error("[deleteShareLinkAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteShareLinkAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
