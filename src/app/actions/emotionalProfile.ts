"use server";

import {
  prismaEmotionalProfileRepo,
  EmotionType,
  EMOTION_TYPES,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import type { EmotionalProfile } from "@/lib/database/repositories/EmotionalProfileRepository";

/**
 * Get all emotional profiles for the current user.
 * Initializes missing profiles if needed.
 */
export async function getEmotionalProfilesAction(): Promise<EmotionalProfile[]> {
  try {
    const userId = await getCurrentUserId();
    console.log("[getEmotionalProfilesAction] userId:", userId);
    if (!userId) return [];

    // Initialize any missing profiles first
    const result = await prismaEmotionalProfileRepo.initializeProfiles(userId);
    console.log("[getEmotionalProfilesAction] result:", result);
    if (result.error) {
      console.error("[getEmotionalProfilesAction] Error:", result.error);
      return [];
    }

    console.log("[getEmotionalProfilesAction] profiles count:", result.data?.length);
    return result.data || [];
  } catch (error) {
    console.error("[getEmotionalProfilesAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a specific emotional profile by type.
 */
export async function getEmotionalProfileAction(
  emotionType: EmotionType
): Promise<EmotionalProfile | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaEmotionalProfileRepo.getProfile(userId, emotionType);
    if (result.error) {
      console.error("[getEmotionalProfileAction] Error:", result.error);
      return null;
    }

    return result.data || null;
  } catch (error) {
    console.error("[getEmotionalProfileAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Save/update an emotional profile.
 */
export async function saveEmotionalProfileAction(
  emotionType: EmotionType,
  data: {
    firstSign?: string;
    correctiveActions?: string;
    injectingLogic?: string;
    angerLevels?: Record<string, string>;
    technicalChanges?: Record<string, string>;
    triggers?: string[];
    history?: string;
  }
): Promise<{ success: boolean; profile?: EmotionalProfile; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (!EMOTION_TYPES.includes(emotionType)) {
      return { success: false, error: "Invalid emotion type" };
    }

    const result = await prismaEmotionalProfileRepo.upsertProfile(userId, emotionType, data);
    if (result.error) {
      console.error("[saveEmotionalProfileAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, profile: result.data || undefined };
  } catch (error) {
    console.error("[saveEmotionalProfileAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Increment occurrence count for an emotion type.
 * Called when a mental log is saved with that emotion.
 */
export async function incrementEmotionOccurrenceAction(
  emotionType: EmotionType
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (!EMOTION_TYPES.includes(emotionType)) {
      return { success: false, error: "Invalid emotion type" };
    }

    const result = await prismaEmotionalProfileRepo.incrementOccurrence(userId, emotionType);
    if (result.error) {
      console.error("[incrementEmotionOccurrenceAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[incrementEmotionOccurrenceAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
