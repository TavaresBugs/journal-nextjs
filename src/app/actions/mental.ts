"use server";

import {
  prismaMentalRepo,
  prismaEmotionalProfileRepo,
  EMOTION_TYPES,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import {
  MentalProfile,
  MentalEntry,
  MentalLog,
} from "@/lib/database/repositories/MentalRepository";
import { revalidatePath } from "next/cache";

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
 * Search mental profiles by query and optional category.
 */
export async function searchMentalProfilesAction(
  query: string,
  category?: string
): Promise<MentalProfile[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

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
 * Save a new mental entry.
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

    revalidatePath("/mentor", "page"); // Adjust if needed
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
  id: string,
  data: Partial<MentalEntry>
): Promise<{ success: boolean; entry?: MentalEntry; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Mapping Partial<MentalEntry> to the expected format for updateEntry
    // Note: MentalRepository expects specific keys for entries
    const updateData = {
      triggerEvent: data.triggerEvent || undefined,
      emotion: data.emotion || undefined,
      behavior: data.behavior || undefined,
      mistake: data.mistake || undefined,
      correction: data.correction || undefined,
      zoneDetected: data.zoneDetected || undefined,
    };

    const result = await prismaMentalRepo.updateEntry(id, userId, updateData);
    if (result.error) {
      console.error("[updateMentalEntryAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, entry: result.data || undefined };
  } catch (error) {
    console.error("[updateMentalEntryAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a mental entry.
 */
export async function deleteMentalEntryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.deleteEntry(id, userId);
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

/**
 * Seed mental profiles for the current user.
 */
export async function seedMentalProfilesAction(
  category: "fear" | "greed" | "tilt" | "all"
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Default profiles to seed
    const defaultProfiles = [
      // Fear
      {
        category: "fear",
        description: "Hesitação em entrar no trade",
        zone: "B-Game",
        severity: 3,
      },
      { category: "fear", description: "Sair cedo demais por medo", zone: "B-Game", severity: 4 },
      { category: "fear", description: "Medo de perder o lucro", zone: "C-Game", severity: 5 },

      // Greed
      { category: "greed", description: "Aumentar a mão sem plano", zone: "C-Game", severity: 5 },
      {
        category: "greed",
        description: "Ignorar o alvo por ganância",
        zone: "C-Game",
        severity: 4,
      },

      // Tilt
      { category: "tilt", description: "Revenge trading após loss", zone: "C-Game", severity: 5 },
      { category: "tilt", description: "Raiva do mercado", zone: "C-Game", severity: 4 },
    ];

    const profilesToSeed =
      category === "all" ? defaultProfiles : defaultProfiles.filter((p) => p.category === category);

    const result = await prismaMentalRepo.createProfiles(userId, profilesToSeed);
    if (result.error) {
      console.error("[seedMentalProfilesAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/mentor", "page");
    return { success: true };
  } catch (error) {
    console.error("[seedMentalProfilesAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

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
 * Get mental logs filtered by mood/emotion type.
 */
export async function getMentalLogsByMoodAction(moodTag: string, limit = 10): Promise<MentalLog[]> {
  try {
    const userId = await getCurrentUserId();
    console.log(`[getMentalLogsByMoodAction] userId: ${userId}, moodTag: ${moodTag}`);
    if (!userId) return [];

    const result = await prismaMentalRepo.getLogsByMood(userId, moodTag, limit);
    console.log(`[getMentalLogsByMoodAction] Found logs: ${result.data?.length}`);
    if (result.error) {
      console.error("[getMentalLogsByMoodAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMentalLogsByMoodAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Save a new mental log (wizard).
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

    // Increment occurrence count in emotional profile
    const emotionType = data.moodTag.toLowerCase();
    if (EMOTION_TYPES.includes(emotionType as (typeof EMOTION_TYPES)[number])) {
      await prismaEmotionalProfileRepo.incrementOccurrence(
        userId,
        emotionType as (typeof EMOTION_TYPES)[number]
      );
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
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaMentalRepo.deleteLog(id, userId);
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

/**
 * Get zone average for the current user.
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

    return result.data || 0;
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
