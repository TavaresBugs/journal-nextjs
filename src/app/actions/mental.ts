"use server";

/**
 * Mental Hub Server Actions
 *
 * Server-side actions for Mental Hub operations using Prisma ORM.
 * Covers mental profiles, entries, logs, and analytics.
 *
 * @example
 * import { getMentalProfilesAction, saveMentalEntryAction } from "@/app/actions/mental";
 *
 * const profiles = await getMentalProfilesAction();
 * const success = await saveMentalEntryAction(entryData);
 */

import {
  prismaMentalRepo,
  MentalProfile,
  MentalEntry,
  MentalLog,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { getSeedsByCategory, type MentalSeedProfile } from "@/constants/mental";

// ========================================
// PROFILES
// ========================================

/**
 * Get all mental profiles for the current user.
 */
export async function getMentalProfilesAction(): Promise<MentalProfile[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentalRepo.getProfiles(userId);

    if (result.error) {
      console.error("[getMentalProfilesAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMentalProfilesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Search mental profiles by text.
 */
export async function searchMentalProfilesAction(
  query: string,
  category?: string
): Promise<MentalProfile[]> {
  try {
    const result = await prismaMentalRepo.searchProfiles(query, category);

    if (result.error) {
      console.error("[searchMentalProfilesAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[searchMentalProfilesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Seed mental profiles for onboarding.
 */
export async function seedMentalProfilesAction(
  category: "fear" | "greed" | "tilt" | "all"
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, count: 0, error: "Not authenticated" };
    }

    const seeds = getSeedsByCategory(category);

    if (seeds.length === 0) {
      return { success: false, count: 0, error: "No seeds found for category" };
    }

    const profileData = seeds.map((seed: MentalSeedProfile) => ({
      category: seed.category,
      description: seed.description,
      zone: seed.zone,
      severity: seed.severity,
    }));

    const result = await prismaMentalRepo.createProfiles(userId, profileData);

    if (result.error) {
      console.error("[seedMentalProfilesAction] Error:", result.error);
      return { success: false, count: 0, error: result.error.message };
    }

    return { success: true, count: result.data?.length || 0 };
  } catch (error) {
    console.error("[seedMentalProfilesAction] Unexpected error:", error);
    return { success: false, count: 0, error: "Unexpected error occurred" };
  }
}

/**
 * Check if user has any seeded profiles.
 */
export async function hasMentalProfilesAction(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const result = await prismaMentalRepo.hasUserProfiles(userId);

    if (result.error) {
      console.error("[hasMentalProfilesAction] Error:", result.error);
      return false;
    }

    return result.data || false;
  } catch (error) {
    console.error("[hasMentalProfilesAction] Unexpected error:", error);
    return false;
  }
}

// ========================================
// ENTRIES
// ========================================

/**
 * Get mental entries for the current user.
 */
export async function getMentalEntriesAction(limit = 50): Promise<MentalEntry[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentalRepo.getEntries(userId, limit);

    if (result.error) {
      console.error("[getMentalEntriesAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMentalEntriesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Save a mental entry.
 */
export async function saveMentalEntryAction(data: {
  triggerEvent?: string;
  emotion?: string;
  behavior?: string;
  mistake?: string;
  correction?: string;
  zoneDetected?: string;
  source?: "grid" | "wizard";
}): Promise<{ success: boolean; entry?: MentalEntry; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.createEntry(userId, data);

    if (result.error) {
      console.error("[saveMentalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, entry: result.data || undefined };
  } catch (error) {
    console.error("[saveMentalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update a mental entry.
 */
export async function updateMentalEntryAction(
  entryId: string,
  data: Partial<{
    triggerEvent: string;
    emotion: string;
    behavior: string;
    mistake: string;
    correction: string;
    zoneDetected: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.updateEntry(entryId, userId, data);

    if (result.error) {
      console.error("[updateMentalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateMentalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a mental entry.
 */
export async function deleteMentalEntryAction(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.deleteEntry(entryId, userId);

    if (result.error) {
      console.error("[deleteMentalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteMentalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// ========================================
// LOGS (Wizard)
// ========================================

/**
 * Get mental logs for the current user.
 */
export async function getMentalLogsAction(limit = 20): Promise<MentalLog[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaMentalRepo.getLogs(userId, limit);

    if (result.error) {
      console.error("[getMentalLogsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMentalLogsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Save a mental log (from Wizard).
 * Also creates a synced entry in mental_entries.
 */
export async function saveMentalLogAction(data: {
  moodTag: string;
  step1Problem: string;
  step2Validation?: string;
  step3Flaw?: string;
  step4Correction?: string;
  step5Logic?: string;
}): Promise<{ success: boolean; log?: MentalLog; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.createLog(userId, data);

    if (result.error) {
      console.error("[saveMentalLogAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, log: result.data || undefined };
  } catch (error) {
    console.error("[saveMentalLogAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a mental log.
 */
export async function deleteMentalLogAction(
  logId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.deleteLog(logId, userId);

    if (result.error) {
      console.error("[deleteMentalLogAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteMentalLogAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// ========================================
// ANALYTICS
// ========================================

/**
 * Get zone average for the performance gauge.
 */
export async function getZoneAverageAction(limit = 5): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const result = await prismaMentalRepo.getZoneAverage(userId, limit);

    if (result.error) {
      console.error("[getZoneAverageAction] Error:", result.error);
      return 0;
    }

    return result.data ?? 0;
  } catch (error) {
    console.error("[getZoneAverageAction] Unexpected error:", error);
    return 0;
  }
}

/**
 * Get zone distribution stats.
 */
export async function getZoneStatsAction(
  limit = 30
): Promise<{ aGame: number; bGame: number; cGame: number }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { aGame: 0, bGame: 0, cGame: 0 };

    const result = await prismaMentalRepo.getZoneStats(userId, limit);

    if (result.error) {
      console.error("[getZoneStatsAction] Error:", result.error);
      return { aGame: 0, bGame: 0, cGame: 0 };
    }

    return result.data || { aGame: 0, bGame: 0, cGame: 0 };
  } catch (error) {
    console.error("[getZoneStatsAction] Unexpected error:", error);
    return { aGame: 0, bGame: 0, cGame: 0 };
  }
}
