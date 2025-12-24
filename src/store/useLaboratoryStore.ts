import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { compressToWebP } from "@/lib/utils/imageCompression";
import {
  getExperimentsAction,
  createExperimentAction,
  updateExperimentAction,
  deleteExperimentAction,
  addExperimentImagesAction,
  getRecapsAction,
  createRecapAction,
  updateRecapAction,
  deleteRecapAction,
} from "@/app/actions";
import type {
  LaboratoryExperiment as RepoExperiment,
  LaboratoryRecap as RepoRecap,
} from "@/lib/database/repositories/LaboratoryRepository";
import type { ExperimentStatus, EmotionalState, RecapLinkedType } from "@/types";

/**
 * useLaboratoryStore - Zustand Store
 *
 * Manages Laboratory experiments and recaps.
 *
 * @migrated Phase 6a - Database operations now use Server Actions.
 *           Image uploads remain in Supabase Storage (client-side).
 */

// Re-export repository types as store types with null -> undefined conversion
export interface LaboratoryImage {
  id: string;
  experimentId: string;
  imageUrl: string;
  description?: string;
  uploadedAt: string;
}

export interface LaboratoryExperiment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ExperimentStatus;
  category?: string;
  expectedWinRate?: number;
  expectedRiskReward?: number;
  promotedToPlaybook: boolean;
  createdAt: string;
  updatedAt: string;
  images: LaboratoryImage[];
}

export interface LaboratoryRecap {
  id: string;
  userId: string;
  tradeId?: string;
  tradeIds: string[];
  title: string;
  whatWorked?: string;
  whatFailed?: string;
  emotionalState?: EmotionalState;
  lessonsLearned?: string;
  images: string[];
  createdAt: string;
  reviewType: "daily" | "weekly";
  weekStartDate?: string;
  weekEndDate?: string;
  linkedType?: RecapLinkedType;
  linkedId?: string;
  linkedTrade?: { asset: string; pnl: number; date: string };
  linkedJournal?: { date: string; accountId: string };
}

// Mapper functions - convert repository types to store types
function mapStatus(status: string): ExperimentStatus {
  // Map repository status to UI status
  const statusMap: Record<string, ExperimentStatus> = {
    em_aberto: "em_aberto",
    em_teste: "testando",
    validado: "validado",
    invalidado: "descartado",
    testando: "testando",
    descartado: "descartado",
  };
  return statusMap[status] || "em_aberto";
}

function mapExperiment(exp: RepoExperiment): LaboratoryExperiment {
  return {
    ...exp,
    status: mapStatus(exp.status),
    description: exp.description ?? undefined,
    category: exp.category ?? undefined,
    expectedWinRate: exp.expectedWinRate ?? undefined,
    expectedRiskReward: exp.expectedRiskReward ?? undefined,
    images: exp.images.map((img) => ({
      ...img,
      description: img.description ?? undefined,
    })),
  };
}

function mapRecap(recap: RepoRecap): LaboratoryRecap {
  return {
    ...recap,
    tradeId: recap.tradeId ?? undefined,
    whatWorked: recap.whatWorked ?? undefined,
    whatFailed: recap.whatFailed ?? undefined,
    emotionalState: (recap.emotionalState as EmotionalState) ?? undefined,
    lessonsLearned: recap.lessonsLearned ?? undefined,
    weekStartDate: recap.weekStartDate ?? undefined,
    weekEndDate: recap.weekEndDate ?? undefined,
    linkedType: (recap.linkedType as RecapLinkedType) ?? undefined,
    linkedId: recap.linkedId ?? undefined,
    linkedTrade: recap.linkedTrade ?? undefined,
    linkedJournal: recap.linkedJournal ?? undefined,
  };
}

// ============================================
// Create/Update DTOs
// ============================================

export interface CreateExperimentData {
  title: string;
  description?: string;
  status?: ExperimentStatus;
  category?: string;
  expectedWinRate?: number;
  expectedRiskReward?: number;
}

export interface UpdateExperimentData extends CreateExperimentData {
  id: string;
  promotedToPlaybook?: boolean;
}

export interface CreateRecapData {
  title: string;
  tradeId?: string;
  tradeIds?: string[];
  linkedType?: RecapLinkedType;
  linkedId?: string;
  reviewType?: "daily" | "weekly";
  weekStartDate?: string;
  weekEndDate?: string;
  whatWorked?: string;
  whatFailed?: string;
  emotionalState?: EmotionalState;
  lessonsLearned?: string;
  images?: string[];
}

export interface UpdateRecapData extends CreateRecapData {
  id: string;
}

// ============================================
// Store Interface
// ============================================

interface LaboratoryStore {
  experiments: LaboratoryExperiment[];
  recaps: LaboratoryRecap[];
  isLoading: boolean;
  error: string | null;

  loadExperiments: () => Promise<void>;
  addExperiment: (data: CreateExperimentData, imageFiles?: File[]) => Promise<LaboratoryExperiment>;
  updateExperiment: (data: UpdateExperimentData, newImageFiles?: File[]) => Promise<void>;
  removeExperiment: (id: string) => Promise<void>;
  promoteToPlaybook: (experimentId: string) => Promise<void>;

  loadRecaps: () => Promise<void>;
  addRecap: (data: CreateRecapData, imageFiles?: File[]) => Promise<LaboratoryRecap>;
  updateRecap: (data: UpdateRecapData, newImageFiles?: File[]) => Promise<void>;
  removeRecap: (id: string) => Promise<void>;

  clearError: () => void;
}

// ============================================
// Helper: Upload images to Supabase Storage
// ============================================

async function uploadExperimentImages(
  userId: string,
  experimentId: string,
  files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const compressed = await compressToWebP(file, {
        qualityWebP: 1.0,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
      const path = `${userId}/experiments/${experimentId}/${fileName}`;

      const { error } = await supabase.storage
        .from("laboratory-images")
        .upload(path, compressed.webp, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        errors.push(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("laboratory-images").getPublicUrl(path);
      urls.push(publicUrlData.publicUrl);

      if (process.env.NODE_ENV === "development") {
        const savings = (
          (1 - compressed.compressedSizeWebP / compressed.originalSize) *
          100
        ).toFixed(1);
        console.log(
          `[Laboratory] ${file.name}: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSizeWebP / 1024).toFixed(0)}KB (-${savings}%)`
        );
      }
    } catch (err) {
      errors.push(
        `Failed to process ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return { urls, errors };
}

async function uploadRecapImages(
  userId: string,
  recapId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    try {
      const compressed = await compressToWebP(file, {
        qualityWebP: 1.0,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
      const path = `${userId}/recaps/${recapId}/${fileName}`;

      const { error } = await supabase.storage
        .from("laboratory-images")
        .upload(path, compressed.webp, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("laboratory-images").getPublicUrl(path);
      urls.push(publicUrlData.publicUrl);

      if (process.env.NODE_ENV === "development") {
        const savings = (
          (1 - compressed.compressedSizeWebP / compressed.originalSize) *
          100
        ).toFixed(1);
        console.log(
          `[Laboratory Recap] ${file.name}: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSizeWebP / 1024).toFixed(0)}KB (-${savings}%)`
        );
      }
    } catch (err) {
      console.error(`Failed to process ${file.name}:`, err);
    }
  }

  return urls;
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

// ============================================
// Store Implementation
// ============================================

export const useLaboratoryStore = create<LaboratoryStore>((set, get) => ({
  experiments: [],
  recaps: [],
  isLoading: false,
  error: null,

  loadExperiments: async () => {
    set({ isLoading: true, error: null });

    try {
      const repoExperiments = await getExperimentsAction();
      set({ experiments: repoExperiments.map(mapExperiment), isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading experiments:", error);
      set({ error: message, isLoading: false });
    }
  },

  addExperiment: async (data, imageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      const result = await createExperimentAction({
        title: data.title,
        description: data.description,
        status: data.status || "em_aberto",
        category: data.category,
        expectedWinRate: data.expectedWinRate,
        expectedRiskReward: data.expectedRiskReward,
      });

      if (!result.success || !result.experiment) {
        throw new Error(result.error || "Failed to create experiment");
      }

      let images: LaboratoryImage[] = [];

      if (imageFiles && imageFiles.length > 0) {
        const { urls, errors } = await uploadExperimentImages(
          userId,
          result.experiment.id,
          imageFiles
        );

        if (errors.length > 0) {
          console.warn("Some images failed to upload:", errors);
        }

        if (urls.length > 0) {
          const imgResult = await addExperimentImagesAction(
            result.experiment.id,
            urls.map((url) => ({ imageUrl: url }))
          );

          if (imgResult.success && imgResult.images) {
            images = imgResult.images.map((img) => ({
              ...img,
              description: img.description ?? undefined,
            }));
          }
        }
      }

      const newExperiment = { ...mapExperiment(result.experiment), images };
      set({
        experiments: [newExperiment, ...get().experiments],
        isLoading: false,
      });

      return newExperiment;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding experiment:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateExperiment: async (data, newImageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      const result = await updateExperimentAction(data.id, {
        title: data.title,
        description: data.description,
        status: data.status,
        category: data.category,
        expectedWinRate: data.expectedWinRate,
        expectedRiskReward: data.expectedRiskReward,
        promotedToPlaybook: data.promotedToPlaybook,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update experiment");
      }

      const newImages: LaboratoryImage[] = [];
      if (newImageFiles && newImageFiles.length > 0) {
        const { urls } = await uploadExperimentImages(userId, data.id, newImageFiles);

        if (urls.length > 0) {
          const imgResult = await addExperimentImagesAction(
            data.id,
            urls.map((url) => ({ imageUrl: url }))
          );

          if (imgResult.success && imgResult.images) {
            newImages.push(
              ...imgResult.images.map((img) => ({
                ...img,
                description: img.description ?? undefined,
              }))
            );
          }
        }
      }

      set({
        experiments: get().experiments.map((exp) => {
          if (exp.id === data.id) {
            return {
              ...exp,
              title: data.title,
              description: data.description,
              status: data.status || exp.status,
              category: data.category,
              expectedWinRate: data.expectedWinRate,
              expectedRiskReward: data.expectedRiskReward,
              promotedToPlaybook: data.promotedToPlaybook ?? exp.promotedToPlaybook,
              images: [...exp.images, ...newImages],
              updatedAt: new Date().toISOString(),
            };
          }
          return exp;
        }),
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating experiment:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeExperiment: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await deleteExperimentAction(id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete experiment");
      }

      set({
        experiments: get().experiments.filter((exp) => exp.id !== id),
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error removing experiment:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  promoteToPlaybook: async (experimentId) => {
    set({ isLoading: true, error: null });

    try {
      const experiment = get().experiments.find((e) => e.id === experimentId);
      if (!experiment) throw new Error("Experiment not found");

      if (experiment.status !== "validado") {
        throw new Error("Only validated experiments can be promoted to Playbook");
      }

      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      const ruleGroups = experiment.category
        ? [{ id: "category", name: experiment.category, rules: [] }]
        : [];

      const { error: playbookError } = await supabase.from("playbooks").insert({
        user_id: userId,
        account_id: null,
        name: experiment.title,
        description: experiment.description || `Promoted from Laboratory experiment`,
        icon: "🧪",
        color: "#10B981",
        rule_groups: ruleGroups,
      });

      if (playbookError) throw playbookError;

      const result = await updateExperimentAction(experimentId, {
        title: experiment.title,
        promotedToPlaybook: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to mark experiment as promoted");
      }

      set({
        experiments: get().experiments.map((exp) =>
          exp.id === experimentId
            ? { ...exp, promotedToPlaybook: true, updatedAt: new Date().toISOString() }
            : exp
        ),
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error promoting experiment:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadRecaps: async () => {
    set({ isLoading: true, error: null });

    try {
      const repoRecaps = await getRecapsAction();
      set({ recaps: repoRecaps.map(mapRecap), isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading recaps:", error);
      set({ error: message, isLoading: false });
    }
  },

  addRecap: async (data, imageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      const tempId = crypto.randomUUID();

      let imageUrls: string[] = data.images || [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadedUrls = await uploadRecapImages(userId, tempId, imageFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const result = await createRecapAction({
        title: data.title,
        linkedType: data.linkedType || (data.tradeId ? "trade" : undefined),
        linkedId: data.linkedId || data.tradeId,
        tradeIds: data.tradeIds,
        reviewType: data.reviewType || "daily",
        weekStartDate: data.weekStartDate,
        weekEndDate: data.weekEndDate,
        whatWorked: data.whatWorked,
        whatFailed: data.whatFailed,
        emotionalState: data.emotionalState,
        lessonsLearned: data.lessonsLearned,
        images: imageUrls,
      });

      if (!result.success || !result.recap) {
        throw new Error(result.error || "Failed to create recap");
      }

      const newRecap = mapRecap(result.recap);
      set({
        recaps: [newRecap, ...get().recaps],
        isLoading: false,
      });

      return newRecap;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding recap:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateRecap: async (data, newImageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      let finalImages: string[] = data.images || [];
      if (newImageFiles && newImageFiles.length > 0) {
        const uploadedUrls = await uploadRecapImages(userId, data.id, newImageFiles);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      const result = await updateRecapAction(data.id, {
        title: data.title,
        whatWorked: data.whatWorked,
        whatFailed: data.whatFailed,
        emotionalState: data.emotionalState,
        lessonsLearned: data.lessonsLearned,
        images: finalImages,
        tradeIds: data.tradeIds,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update recap");
      }

      // Reload recaps to get updated linked data
      const repoRecaps = await getRecapsAction();
      set({ recaps: repoRecaps.map(mapRecap), isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating recap:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeRecap: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const result = await deleteRecapAction(id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete recap");
      }

      set({
        recaps: get().recaps.filter((recap) => recap.id !== id),
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error removing recap:", error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
