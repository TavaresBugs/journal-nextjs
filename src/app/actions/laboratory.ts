"use server";

/**
 * Laboratory Server Actions
 *
 * Server-side actions for Laboratory operations using Prisma ORM.
 * Covers experiments and recaps CRUD operations.
 *
 * NOTE: Image upload to Supabase Storage is handled client-side.
 * These actions only manage CRUD operations and image metadata.
 *
 * @example
 * import { getExperimentsAction, createRecapAction } from "@/app/actions/laboratory";
 *
 * const experiments = await getExperimentsAction();
 * const recap = await createRecapAction(recapData);
 */

import {
  prismaLaboratoryRepo,
  LaboratoryExperiment,
  LaboratoryRecap,
  LaboratoryImage,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";

// ========================================
// EXPERIMENTS
// ========================================

/**
 * Get all experiments for the current user.
 */
export async function getExperimentsAction(): Promise<LaboratoryExperiment[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaLaboratoryRepo.getExperiments(userId);

    if (result.error) {
      console.error("[getExperimentsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getExperimentsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a single experiment by ID.
 */
export async function getExperimentAction(
  experimentId: string
): Promise<LaboratoryExperiment | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaLaboratoryRepo.getExperimentById(experimentId, userId);

    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getExperimentAction] Error:", result.error);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getExperimentAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Create an experiment.
 */
export async function createExperimentAction(data: {
  title: string;
  description?: string;
  status?: string;
  category?: string;
  expectedWinRate?: number;
  expectedRiskReward?: number;
}): Promise<{ success: boolean; experiment?: LaboratoryExperiment; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.createExperiment(userId, data);

    if (result.error) {
      console.error("[createExperimentAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, experiment: result.data || undefined };
  } catch (error) {
    console.error("[createExperimentAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update an experiment.
 */
export async function updateExperimentAction(
  experimentId: string,
  data: Partial<{
    title: string;
    description: string;
    status: string;
    category: string;
    expectedWinRate: number;
    expectedRiskReward: number;
    promotedToPlaybook: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.updateExperiment(experimentId, userId, data);

    if (result.error) {
      console.error("[updateExperimentAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateExperimentAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete an experiment.
 */
export async function deleteExperimentAction(
  experimentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.deleteExperiment(experimentId, userId);

    if (result.error) {
      console.error("[deleteExperimentAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteExperimentAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Add images to an experiment (metadata only - images already uploaded to Storage).
 */
export async function addExperimentImagesAction(
  experimentId: string,
  images: Array<{ imageUrl: string; description?: string }>
): Promise<{ success: boolean; images?: LaboratoryImage[]; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership first
    const experimentResult = await prismaLaboratoryRepo.getExperimentById(experimentId, userId);
    if (experimentResult.error || !experimentResult.data) {
      return { success: false, error: "Experiment not found or unauthorized" };
    }

    const result = await prismaLaboratoryRepo.addExperimentImages(experimentId, images);

    if (result.error) {
      console.error("[addExperimentImagesAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, images: result.data || undefined };
  } catch (error) {
    console.error("[addExperimentImagesAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete images from an experiment (metadata only - files should be deleted separately).
 */
export async function deleteExperimentImagesAction(
  imageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.deleteExperimentImages(imageIds);

    if (result.error) {
      console.error("[deleteExperimentImagesAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteExperimentImagesAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// ========================================
// RECAPS
// ========================================

/**
 * Get all recaps for the current user.
 */
export async function getRecapsAction(): Promise<LaboratoryRecap[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaLaboratoryRepo.getRecaps(userId);

    if (result.error) {
      console.error("[getRecapsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getRecapsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Create a recap.
 */
export async function createRecapAction(data: {
  title: string;
  tradeId?: string;
  tradeIds?: string[];
  whatWorked?: string;
  whatFailed?: string;
  emotionalState?: string;
  lessonsLearned?: string;
  images?: string[];
  reviewType?: "daily" | "weekly";
  weekStartDate?: string;
  weekEndDate?: string;
  linkedType?: string;
  linkedId?: string;
}): Promise<{ success: boolean; recap?: LaboratoryRecap; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.createRecap(userId, data);

    if (result.error) {
      console.error("[createRecapAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, recap: result.data || undefined };
  } catch (error) {
    console.error("[createRecapAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update a recap.
 */
export async function updateRecapAction(
  recapId: string,
  data: Partial<{
    title: string;
    whatWorked: string;
    whatFailed: string;
    emotionalState: string;
    lessonsLearned: string;
    images: string[];
    tradeIds: string[];
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.updateRecap(recapId, userId, data);

    if (result.error) {
      console.error("[updateRecapAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateRecapAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a recap.
 */
export async function deleteRecapAction(
  recapId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaLaboratoryRepo.deleteRecap(recapId, userId);

    if (result.error) {
      console.error("[deleteRecapAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteRecapAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
