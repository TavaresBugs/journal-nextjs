"use server";

import { prismaJournalRepo, prismaRoutineRepo } from "@/lib/database/repositories";
import { createClient } from "@/lib/supabase/server";
import { JournalEntry, DailyRoutine } from "@/types";

/**
 * Get current user ID from Supabase auth.
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================
// JOURNAL ENTRIES
// ============================================

export async function fetchJournalEntries(accountId: string) {
  const userId = await getCurrentUserId();
  console.log(`[fetchJournalEntries] fetching for account ${accountId}, user ${userId}`);

  if (!userId) {
    console.warn("[fetchJournalEntries] No user ID, returning empty");
    return [];
  }

  const result = await prismaJournalRepo.getByAccountId(accountId);
  console.log(`[fetchJournalEntries] Found ${result.data?.length} entries`);
  return result.data || [];
}

export async function createJournalEntry(
  entry: Partial<JournalEntry>
): Promise<string | undefined> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaJournalRepo.save({ ...entry, userId });
  if (result.error) throw new Error(result.error.message);

  return result.data?.id;
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaJournalRepo.save({ ...entry, userId });
  if (result.error) throw new Error(result.error.message);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  // 1. Fetch entry to get image paths
  const entryResult = await prismaJournalRepo.getById(id);
  if (entryResult.data) {
    // 2. Verify ownership
    if (entryResult.data.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // 3. Delete images from Storage
    const paths = entryResult.data.images
      .map((img) => img.path)
      .filter((path): path is string => !!path);

    if (paths.length > 0) {
      console.log(`[deleteJournalEntry] Deleting ${paths.length} images from storage`);
      const supabase = await createClient();
      const { error } = await supabase.storage.from("journal-images").remove(paths);

      if (error) {
        console.error("[deleteJournalEntry] Failed to delete images from storage:", error);
        // We continue to delete the DB entry even if storage fails,
        // to avoid "zombie" entries that can't be deleted.
        // Or should we throw? Usually better to clean up DB.
      }
    }
  }

  const result = await prismaJournalRepo.delete(id, userId);
  if (result.error) throw new Error(result.error.message);
}

export async function linkTradeToJournal(journalId: string, tradeId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaJournalRepo.linkTrade(journalId, tradeId);
  if (result.error) throw new Error(result.error.message);
}

export async function unlinkTradeFromJournal(journalId: string, tradeId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaJournalRepo.unlinkTrade(journalId, tradeId);
  if (result.error) throw new Error(result.error.message);
}

// ============================================
// DAILY ROUTINES
// ============================================

export async function fetchDailyRoutines(accountId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const result = await prismaRoutineRepo.getByAccountId(accountId);
  return result.data || [];
}

export async function saveDailyRoutine(routine: Partial<DailyRoutine>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaRoutineRepo.save({ ...routine, userId });
  if (result.error) throw new Error(result.error.message);
}

export async function deleteDailyRoutine(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaRoutineRepo.delete(id, userId);
  if (result.error) throw new Error(result.error.message);
}
