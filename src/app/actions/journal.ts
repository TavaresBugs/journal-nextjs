"use server";

/**
 * Journal Server Actions
 *
 * Server-side actions for journal entry operations using Prisma ORM.
 * These actions run exclusively on the server and can be called from client components.
 *
 * NOTE: Image upload must be done client-side via `imageUpload.ts` (uses Supabase Storage)
 * before calling these actions to save the journal entry with image metadata.
 *
 * @example
 * import { getJournalEntriesAction, saveJournalEntryAction } from "@/app/actions/journal";
 *
 * const entries = await getJournalEntriesAction(accountId);
 * const success = await saveJournalEntryAction(entryData);
 */

import { prismaJournalRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { createClient } from "@/lib/supabase/server";
import { JournalEntry, JournalImage } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get all journal entries for an account.
 */
export async function getJournalEntriesAction(accountId: string): Promise<JournalEntry[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaJournalRepo.getByAccountId(accountId);

    if (result.error) {
      console.error("[getJournalEntriesAction] Error:", result.error);
      return [];
    }

    // Filter for user ownership as extra security
    return (result.data || []).filter((e) => e.userId === userId);
  } catch (error) {
    console.error("[getJournalEntriesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a single journal entry by ID.
 */
export async function getJournalEntryAction(entryId: string): Promise<JournalEntry | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaJournalRepo.getById(entryId);

    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getJournalEntryAction] Error:", result.error);
      }
      return null;
    }

    // Verify ownership
    if (result.data && result.data.userId !== userId) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getJournalEntryAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Get journal entries within a date range.
 */
export async function getJournalEntriesByDateRangeAction(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<JournalEntry[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaJournalRepo.getByDateRange(accountId, startDate, endDate);

    if (result.error) {
      console.error("[getJournalEntriesByDateRangeAction] Error:", result.error);
      return [];
    }

    // Filter for user ownership
    return (result.data || []).filter((e) => e.userId === userId);
  } catch (error) {
    console.error("[getJournalEntriesByDateRangeAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Search journal entries by text.
 */
export async function searchJournalEntriesAction(
  accountId: string,
  query: string
): Promise<JournalEntry[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaJournalRepo.search(accountId, query);

    if (result.error) {
      console.error("[searchJournalEntriesAction] Error:", result.error);
      return [];
    }

    // Filter for user ownership
    return (result.data || []).filter((e) => e.userId === userId);
  } catch (error) {
    console.error("[searchJournalEntriesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Save (create or update) a journal entry.
 *
 * NOTE: Images should be uploaded via client-side `imageUpload.ts` first,
 * then included in the entry.images array as JournalImage objects.
 */
export async function saveJournalEntryAction(
  entry: Partial<JournalEntry>
): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const entryWithUser = { ...entry, userId };

    const result = await prismaJournalRepo.save(entryWithUser);

    if (result.error) {
      console.error("[saveJournalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard
    if (entry.accountId) {
      revalidatePath(`/dashboard/${entry.accountId}`, "page");
    }

    return { success: true, entry: result.data || undefined };
  } catch (error) {
    console.error("[saveJournalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a journal entry.
 *
 * NOTE: Images in Supabase Storage should be deleted separately via client-side.
 */
export async function deleteJournalEntryAction(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // 1. Fetch entry to get image paths for cleanup
    const entryResult = await prismaJournalRepo.getById(entryId);
    if (entryResult.data) {
      // Always verify ownership if we had to refetch
      if (entryResult.data.userId !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      // 2. Identify images to delete from Storage
      const paths = entryResult.data.images
        .map((img) => img.path)
        .filter((path): path is string => !!path);

      if (paths.length > 0) {
        console.log(`[deleteJournalEntryAction] Deleting ${paths.length} images from storage`);
        const supabase = await createClient();
        const { error: storageError } = await supabase.storage.from("journal-images").remove(paths);

        if (storageError) {
          console.error("[deleteJournalEntryAction] Storage cleanup failed:", storageError);
          // We continue to delete the DB entry anyway
        }
      }
    }

    // 3. Delete from DB
    const result = await prismaJournalRepo.delete(entryId, userId);

    if (result.error) {
      console.error("[deleteJournalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteJournalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Link a trade to a journal entry.
 */
export async function linkTradeToJournalAction(
  journalId: string,
  tradeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify journal ownership first
    const journalResult = await prismaJournalRepo.getById(journalId);
    if (journalResult.error || !journalResult.data || journalResult.data.userId !== userId) {
      return { success: false, error: "Journal not found or unauthorized" };
    }

    const result = await prismaJournalRepo.linkTrade(journalId, tradeId);

    if (result.error) {
      console.error("[linkTradeToJournalAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[linkTradeToJournalAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Unlink a trade from a journal entry.
 */
export async function unlinkTradeFromJournalAction(
  journalId: string,
  tradeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify journal ownership first
    const journalResult = await prismaJournalRepo.getById(journalId);
    if (journalResult.error || !journalResult.data || journalResult.data.userId !== userId) {
      return { success: false, error: "Journal not found or unauthorized" };
    }

    const result = await prismaJournalRepo.unlinkTrade(journalId, tradeId);

    if (result.error) {
      console.error("[unlinkTradeFromJournalAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[unlinkTradeFromJournalAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Add an image to a journal entry (metadata only - image already uploaded to Storage).
 */
export async function addJournalImageAction(
  journalId: string,
  image: { url: string; path: string; timeframe: string; displayOrder?: number }
): Promise<{ success: boolean; image?: JournalImage; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify journal ownership first
    const journalResult = await prismaJournalRepo.getById(journalId);
    if (journalResult.error || !journalResult.data || journalResult.data.userId !== userId) {
      return { success: false, error: "Journal not found or unauthorized" };
    }

    const result = await prismaJournalRepo.addImage(journalId, { ...image, userId });

    if (result.error) {
      console.error("[addJournalImageAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, image: result.data || undefined };
  } catch (error) {
    console.error("[addJournalImageAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Remove an image from a journal entry (metadata only - file deletion should be done separately).
 */
export async function removeJournalImageAction(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaJournalRepo.removeImage(imageId);

    if (result.error) {
      console.error("[removeJournalImageAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[removeJournalImageAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get journal count for an account.
 */
export async function getJournalCountAction(accountId: string): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const result = await prismaJournalRepo.getCount(accountId);

    if (result.error) {
      console.error("[getJournalCountAction] Error:", result.error);
      return 0;
    }

    return result.data || 0;
  } catch (error) {
    console.error("[getJournalCountAction] Unexpected error:", error);
    return 0;
  }
}
