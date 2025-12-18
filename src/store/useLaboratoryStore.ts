import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { compressToWebP } from "@/lib/utils/imageCompression";
import type {
  LaboratoryExperiment,
  LaboratoryImage,
  LaboratoryRecap,
  ExperimentStatus,
  EmotionalState,
  TradeLite,
  RecapLinkedType,
  JournalEntryLite,
} from "@/types";

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
  /** @deprecated Use linkedType + linkedId instead */
  tradeId?: string; // For daily review (single trade)
  tradeIds?: string[]; // For weekly review (multiple trades)
  /** Type of linked record (trade or journal) */
  linkedType?: RecapLinkedType;
  /** ID of the linked record (trade or journal entry) */
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

  // Experiment actions
  loadExperiments: () => Promise<void>;
  addExperiment: (data: CreateExperimentData, imageFiles?: File[]) => Promise<LaboratoryExperiment>;
  updateExperiment: (data: UpdateExperimentData, newImageFiles?: File[]) => Promise<void>;
  removeExperiment: (id: string) => Promise<void>;
  promoteToPlaybook: (experimentId: string) => Promise<void>;

  // Recap actions
  loadRecaps: () => Promise<void>;
  addRecap: (data: CreateRecapData, imageFiles?: File[]) => Promise<LaboratoryRecap>;
  updateRecap: (data: UpdateRecapData, newImageFiles?: File[]) => Promise<void>;
  removeRecap: (id: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

// ============================================
// Helper: Map DB row to LaboratoryExperiment
// ============================================

function mapExperimentFromDB(
  row: Record<string, unknown>,
  images: LaboratoryImage[] = []
): LaboratoryExperiment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    status: row.status as ExperimentStatus,
    category: row.category as string | undefined,
    expectedWinRate: row.expected_win_rate as number | undefined,
    expectedRiskReward: row.expected_risk_reward as number | undefined,
    promotedToPlaybook: row.promoted_to_playbook as boolean,
    images,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Helper: Map DB row to LaboratoryRecap
// ============================================

function mapRecapFromDB(
  row: Record<string, unknown>,
  trade?: TradeLite,
  journal?: JournalEntryLite
): LaboratoryRecap {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tradeId: row.trade_id as string | undefined,
    linkedType: row.linked_type as RecapLinkedType | undefined,
    linkedId: row.linked_id as string | undefined,
    title: row.title as string,
    type: row.review_type as "daily" | "weekly" | undefined,
    whatWorked: row.what_worked as string | undefined,
    whatFailed: row.what_failed as string | undefined,
    emotionalState: row.emotional_state as EmotionalState | undefined,
    lessonsLearned: row.lessons_learned as string | undefined,
    images: (row.images as string[]) || [],
    createdAt: row.created_at as string,
    trade,
    journal,
  };
}

// ============================================
// Helper: Upload images to storage
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
      // Convert to WebP before upload (100% quality for storage)
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
      // Convert to WebP before upload (100% quality for storage)
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

// ============================================
// Store Implementation
// ============================================

export const useLaboratoryStore = create<LaboratoryStore>((set, get) => ({
  experiments: [],
  recaps: [],
  isLoading: false,
  error: null,

  // ====================================
  // EXPERIMENTS
  // ====================================

  loadExperiments: async () => {
    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Load experiments
      const { data: experimentsData, error: experimentsError } = await supabase
        .from("laboratory_experiments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (experimentsError) throw experimentsError;

      // Load images for all experiments
      const experimentIds = (experimentsData || []).map((e) => e.id);
      let imagesMap: Record<string, LaboratoryImage[]> = {};

      if (experimentIds.length > 0) {
        const { data: imagesData, error: imagesError } = await supabase
          .from("laboratory_images")
          .select("*")
          .in("experiment_id", experimentIds);

        if (imagesError) throw imagesError;

        imagesMap = (imagesData || []).reduce(
          (acc, img) => {
            const expId = img.experiment_id as string;
            if (!acc[expId]) acc[expId] = [];
            acc[expId].push({
              id: img.id,
              experimentId: img.experiment_id,
              imageUrl: img.image_url,
              description: img.description,
              uploadedAt: img.uploaded_at,
            });
            return acc;
          },
          {} as Record<string, LaboratoryImage[]>
        );
      }

      const experiments = (experimentsData || []).map((row) =>
        mapExperimentFromDB(row, imagesMap[row.id] || [])
      );

      set({ experiments, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading experiments:", error);
      set({ error: message, isLoading: false });
    }
  },

  addExperiment: async (data, imageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Insert experiment
      const { data: insertedData, error: insertError } = await supabase
        .from("laboratory_experiments")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          status: data.status || "em_aberto",
          category: data.category,
          expected_win_rate: data.expectedWinRate,
          expected_risk_reward: data.expectedRiskReward,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload images if provided
      const images: LaboratoryImage[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const { urls, errors } = await uploadExperimentImages(user.id, insertedData.id, imageFiles);

        if (errors.length > 0) {
          console.warn("Some images failed to upload:", errors);
        }

        // Save image records to database
        for (const url of urls) {
          const { data: imgData, error: imgError } = await supabase
            .from("laboratory_images")
            .insert({
              experiment_id: insertedData.id,
              image_url: url,
            })
            .select()
            .single();

          if (!imgError && imgData) {
            images.push({
              id: imgData.id,
              experimentId: imgData.experiment_id,
              imageUrl: imgData.image_url,
              description: imgData.description,
              uploadedAt: imgData.uploaded_at,
            });
          }
        }
      }

      const newExperiment = mapExperimentFromDB(insertedData, images);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: updateError } = await supabase
        .from("laboratory_experiments")
        .update({
          title: data.title,
          description: data.description,
          status: data.status,
          category: data.category,
          expected_win_rate: data.expectedWinRate,
          expected_risk_reward: data.expectedRiskReward,
          promoted_to_playbook: data.promotedToPlaybook,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) throw updateError;

      // Handle new image uploads
      const newImages: LaboratoryImage[] = [];
      if (newImageFiles && newImageFiles.length > 0) {
        const { urls } = await uploadExperimentImages(user.id, data.id, newImageFiles);

        for (const url of urls) {
          const { data: imgData, error: imgError } = await supabase
            .from("laboratory_images")
            .insert({
              experiment_id: data.id,
              image_url: url,
            })
            .select()
            .single();

          if (!imgError && imgData) {
            newImages.push({
              id: imgData.id,
              experimentId: imgData.experiment_id,
              imageUrl: imgData.image_url,
              description: imgData.description,
              uploadedAt: imgData.uploaded_at,
            });
          }
        }
      }

      // Update local state
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
      // Delete experiment (cascade will handle images table)
      const { error } = await supabase.from("laboratory_experiments").delete().eq("id", id);

      if (error) throw error;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const experiment = get().experiments.find((e) => e.id === experimentId);
      if (!experiment) throw new Error("Experiment not found");

      if (experiment.status !== "validado") {
        throw new Error("Only validated experiments can be promoted to Playbook");
      }

      // Create playbook entry
      const ruleGroups = experiment.category
        ? [{ id: "category", name: experiment.category, rules: [] }]
        : [];

      const { error: playbookError } = await supabase.from("playbooks").insert({
        user_id: user.id,
        account_id: null,
        name: experiment.title,
        description: experiment.description || `Promoted from Laboratory experiment`,
        icon: "🧪",
        color: "#10B981",
        rule_groups: ruleGroups,
      });

      if (playbookError) throw playbookError;

      // Mark experiment as promoted
      const { error: updateError } = await supabase
        .from("laboratory_experiments")
        .update({
          promoted_to_playbook: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", experimentId);

      if (updateError) throw updateError;

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

  // ====================================
  // RECAPS
  // ====================================

  loadRecaps: async () => {
    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Load recaps with linked trades (for legacy and trade links)
      const { data: recapsData, error: recapsError } = await supabase
        .from("laboratory_recaps")
        .select(
          `
                    *,
                    trades:trade_id (
                        id,
                        symbol,
                        type,
                        entry_date,
                        entry_time,
                        exit_date,
                        exit_time,
                        pnl,
                        outcome,
                        entry_price,
                        exit_price,
                        stop_loss,
                        take_profit,
                        lot
                    )
                `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (recapsError) throw recapsError;

      // Collect journal IDs that need to be fetched
      const journalIds = (recapsData || [])
        .filter((row) => row.linked_type === "journal" && row.linked_id)
        .map((row) => row.linked_id as string);

      // Fetch journal entries if there are any linked
      let journalMap: Record<string, JournalEntryLite> = {};
      if (journalIds.length > 0) {
        const { data: journalData } = await supabase
          .from("journal_entries")
          .select("id, date, title, asset")
          .in("id", journalIds);

        if (journalData) {
          journalMap = journalData.reduce(
            (acc, j) => {
              acc[j.id] = {
                id: j.id,
                date: j.date,
                title: j.title,
                asset: j.asset,
              };
              return acc;
            },
            {} as Record<string, JournalEntryLite>
          );
        }
      }

      const recaps = (recapsData || []).map((row) => {
        const tradeData = row.trades as Record<string, unknown> | null;
        let trade: TradeLite | undefined;
        let journal: JournalEntryLite | undefined;

        // Map trade data if present (legacy or linked_type = 'trade')
        if (tradeData) {
          trade = {
            id: tradeData.id as string,
            symbol: tradeData.symbol as string,
            type: tradeData.type as "Long" | "Short",
            entryDate: tradeData.entry_date as string,
            entryTime: tradeData.entry_time as string | undefined,
            exitDate: tradeData.exit_date as string | undefined,
            exitTime: tradeData.exit_time as string | undefined,
            pnl: tradeData.pnl as number | undefined,
            outcome: tradeData.outcome as "win" | "loss" | "breakeven" | "pending" | undefined,
            entryPrice: tradeData.entry_price as number,
            exitPrice: tradeData.exit_price as number | undefined,
            stopLoss: tradeData.stop_loss as number,
            takeProfit: tradeData.take_profit as number,
            lot: tradeData.lot as number,
            accountId: "", // Not needed for display
          };
        }

        // Map journal data if linked_type is 'journal'
        if (row.linked_type === "journal" && row.linked_id) {
          journal = journalMap[row.linked_id as string];
        }

        return mapRecapFromDB(row, trade, journal);
      });

      set({ recaps, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading recaps:", error);
      set({ error: message, isLoading: false });
    }
  },

  addRecap: async (data, imageFiles) => {
    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate temporary ID for image upload path
      const tempId = crypto.randomUUID();

      // Upload images if provided
      let imageUrls: string[] = data.images || [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadedUrls = await uploadRecapImages(user.id, tempId, imageFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      // Insert recap
      const { data: insertedData, error: insertError } = await supabase
        .from("laboratory_recaps")
        .insert({
          user_id: user.id,
          // Legacy trade_id for backward compatibility (only for trade links)
          trade_id: data.linkedType === "trade" ? data.linkedId || data.tradeId || null : null,
          // New generic linking fields
          linked_type: data.linkedType || (data.tradeId ? "trade" : null),
          linked_id: data.linkedId || (data.tradeId ? data.tradeId : null),
          title: data.title,
          what_worked: data.whatWorked,
          what_failed: data.whatFailed,
          emotional_state: data.emotionalState,
          lessons_learned: data.lessonsLearned,
          images: imageUrls,
          review_type: data.reviewType || "daily",
          week_start_date: data.weekStartDate || null,
          week_end_date: data.weekEndDate || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If weekly review, insert trade relationships
      if (data.reviewType === "weekly" && data.tradeIds && data.tradeIds.length > 0) {
        const relationships = data.tradeIds.map((tradeId) => ({
          recap_id: insertedData.id,
          trade_id: tradeId,
        }));

        const { error: relError } = await supabase
          .from("laboratory_recap_trades")
          .insert(relationships);

        if (relError) {
          console.warn("Error inserting recap trade relationships:", relError);
        }
      }

      // Fetch linked record data if needed
      let linkedJournal: JournalEntryLite | undefined;
      let linkedTrade: TradeLite | undefined;

      if (data.linkedType === "journal" && data.linkedId) {
        const { data: journalData } = await supabase
          .from("journal_entries")
          .select("id, date, title, asset")
          .eq("id", data.linkedId)
          .single();

        if (journalData) {
          linkedJournal = {
            id: journalData.id,
            date: journalData.date,
            title: journalData.title,
            asset: journalData.asset,
          };
        }
      } else if (data.linkedType === "trade" && data.linkedId) {
        const { data: tradeData } = await supabase
          .from("trades")
          .select(
            "id, symbol, type, entry_date, entry_time, exit_date, exit_time, pnl, outcome, entry_price, exit_price, stop_loss, take_profit, lot"
          )
          .eq("id", data.linkedId)
          .single();

        if (tradeData) {
          linkedTrade = {
            id: tradeData.id,
            symbol: tradeData.symbol,
            type: tradeData.type as "Long" | "Short",
            entryDate: tradeData.entry_date,
            entryTime: tradeData.entry_time,
            exitDate: tradeData.exit_date,
            exitTime: tradeData.exit_time,
            pnl: tradeData.pnl,
            outcome: tradeData.outcome,
            entryPrice: tradeData.entry_price,
            exitPrice: tradeData.exit_price,
            stopLoss: tradeData.stop_loss,
            takeProfit: tradeData.take_profit,
            lot: tradeData.lot,
            accountId: "",
          };
        }
      }

      const newRecap = mapRecapFromDB(insertedData, linkedTrade, linkedJournal);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Handle new image uploads
      let finalImages: string[] = data.images || [];
      if (newImageFiles && newImageFiles.length > 0) {
        // Determine recap ID for storage path
        const recapId = data.id;
        const uploadedUrls = await uploadRecapImages(user.id, recapId, newImageFiles);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      const { error: updateError } = await supabase
        .from("laboratory_recaps")
        .update({
          // Legacy trade_id for backward compatibility
          trade_id: data.linkedType === "trade" ? data.linkedId || data.tradeId || null : null,
          // New generic linking fields
          linked_type: data.linkedType || (data.tradeId ? "trade" : null),
          linked_id: data.linkedId || (data.tradeId ? data.tradeId : null),
          title: data.title,
          what_worked: data.whatWorked,
          what_failed: data.whatFailed,
          emotional_state: data.emotionalState,
          lessons_learned: data.lessonsLearned,
          images: finalImages,
        })
        .eq("id", data.id);

      if (updateError) throw updateError;

      // Fetch linked record data if needed
      let linkedJournal: JournalEntryLite | undefined;
      let linkedTrade: TradeLite | undefined;

      if (data.linkedType === "journal" && data.linkedId) {
        const { data: journalData } = await supabase
          .from("journal_entries")
          .select("id, date, title, asset")
          .eq("id", data.linkedId)
          .single();

        if (journalData) {
          linkedJournal = {
            id: journalData.id,
            date: journalData.date,
            title: journalData.title,
            asset: journalData.asset,
          };
        }
      } else if (data.linkedType === "trade" && data.linkedId) {
        const { data: tradeData } = await supabase
          .from("trades")
          .select(
            "id, symbol, type, entry_date, entry_time, exit_date, exit_time, pnl, outcome, entry_price, exit_price, stop_loss, take_profit, lot"
          )
          .eq("id", data.linkedId)
          .single();

        if (tradeData) {
          linkedTrade = {
            id: tradeData.id,
            symbol: tradeData.symbol,
            type: tradeData.type as "Long" | "Short",
            entryDate: tradeData.entry_date,
            entryTime: tradeData.entry_time,
            exitDate: tradeData.exit_date,
            exitTime: tradeData.exit_time,
            pnl: tradeData.pnl,
            outcome: tradeData.outcome,
            entryPrice: tradeData.entry_price,
            exitPrice: tradeData.exit_price,
            stopLoss: tradeData.stop_loss,
            takeProfit: tradeData.take_profit,
            lot: tradeData.lot,
            accountId: "",
          };
        }
      }

      set({
        recaps: get().recaps.map((recap) => {
          if (recap.id === data.id) {
            return {
              ...recap,
              tradeId: data.linkedType === "trade" ? data.linkedId : undefined,
              linkedType: data.linkedType,
              linkedId: data.linkedId,
              title: data.title,
              whatWorked: data.whatWorked,
              whatFailed: data.whatFailed,
              emotionalState: data.emotionalState,
              lessonsLearned: data.lessonsLearned,
              images: finalImages,
              // Update with fetched linked record data
              trade: linkedTrade,
              journal: linkedJournal,
            };
          }
          return recap;
        }),
        isLoading: false,
      });
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
      const { error } = await supabase.from("laboratory_recaps").delete().eq("id", id);

      if (error) throw error;

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
