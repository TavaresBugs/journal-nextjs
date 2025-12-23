/**
 * Prisma Laboratory Repository
 *
 * Type-safe implementation of LaboratoryRepository using Prisma ORM.
 * Handles experiments and recaps for the Laboratory feature.
 *
 * NOTE: Image upload to Supabase Storage is handled client-side.
 * This repository only manages CRUD operations and image metadata.
 *
 * @example
 * import { prismaLaboratoryRepo } from '@/lib/repositories/prisma';
 * const experiments = await prismaLaboratoryRepo.getExperiments(userId);
 */

import { prisma } from "@/lib/prisma";
import {
  laboratory_experiments as PrismaExperiment,
  laboratory_images as PrismaImage,
  laboratory_recaps as PrismaRecap,
  laboratory_recap_trades as PrismaRecapTrade,
  trades as PrismaTrade,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

// Domain types
export interface LaboratoryImage {
  id: string;
  experimentId: string;
  imageUrl: string;
  description: string | null;
  uploadedAt: string;
}

export interface LaboratoryExperiment {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: "em_aberto" | "em_teste" | "validado" | "invalidado";
  category: string | null;
  expectedWinRate: number | null;
  expectedRiskReward: number | null;
  promotedToPlaybook: boolean;
  createdAt: string;
  updatedAt: string;
  images: LaboratoryImage[];
}

export interface LaboratoryRecap {
  id: string;
  userId: string;
  tradeId: string | null;
  tradeIds: string[];
  title: string;
  whatWorked: string | null;
  whatFailed: string | null;
  emotionalState: string | null;
  lessonsLearned: string | null;
  images: string[];
  createdAt: string;
  reviewType: "daily" | "weekly";
  weekStartDate: string | null;
  weekEndDate: string | null;
  linkedType: string | null;
  linkedId: string | null;
  // Linked data
  linkedTrade?: { asset: string; pnl: number; date: string } | null;
  linkedJournal?: { date: string; accountId: string } | null;
}

// Type for recap with relations
type RecapWithRelations = PrismaRecap & {
  laboratory_recap_trades: (PrismaRecapTrade & { trades: PrismaTrade | null })[];
  trades: PrismaTrade | null;
};

// Mappers
function mapImageFromPrisma(img: PrismaImage): LaboratoryImage {
  return {
    id: img.id,
    experimentId: img.experiment_id,
    imageUrl: img.image_url,
    description: img.description,
    uploadedAt: img.uploaded_at?.toISOString() || new Date().toISOString(),
  };
}

function mapExperimentFromPrisma(
  exp: PrismaExperiment & { laboratory_images?: PrismaImage[] }
): LaboratoryExperiment {
  return {
    id: exp.id,
    userId: exp.user_id,
    title: exp.title,
    description: exp.description,
    status: exp.status as LaboratoryExperiment["status"],
    category: exp.category,
    expectedWinRate: exp.expected_win_rate ? Number(exp.expected_win_rate) : null,
    expectedRiskReward: exp.expected_risk_reward ? Number(exp.expected_risk_reward) : null,
    promotedToPlaybook: exp.promoted_to_playbook || false,
    createdAt: exp.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: exp.updated_at?.toISOString() || new Date().toISOString(),
    images: (exp.laboratory_images || []).map(mapImageFromPrisma),
  };
}

function mapRecapFromPrisma(recap: RecapWithRelations): LaboratoryRecap {
  // Get all trade IDs from junction table
  const tradeIds = recap.laboratory_recap_trades
    .filter((rt) => rt.trade_id)
    .map((rt) => rt.trade_id as string);

  // Get linked trade data if available
  let linkedTrade = null;
  if (recap.trades) {
    linkedTrade = {
      asset: recap.trades.symbol || "",
      pnl: Number(recap.trades.pnl) || 0,
      date: recap.trades.entry_date?.toISOString().split("T")[0] || "",
    };
  }

  return {
    id: recap.id,
    userId: recap.user_id,
    tradeId: recap.trade_id,
    tradeIds,
    title: recap.title,
    whatWorked: recap.what_worked,
    whatFailed: recap.what_failed,
    emotionalState: recap.emotional_state,
    lessonsLearned: recap.lessons_learned,
    images: recap.images || [],
    createdAt: recap.created_at?.toISOString() || new Date().toISOString(),
    reviewType: (recap.review_type as "daily" | "weekly") || "daily",
    weekStartDate: recap.week_start_date?.toISOString().split("T")[0] || null,
    weekEndDate: recap.week_end_date?.toISOString().split("T")[0] || null,
    linkedType: recap.linked_type,
    linkedId: recap.linked_id,
    linkedTrade,
  };
}

class PrismaLaboratoryRepository {
  private logger = new Logger("PrismaLaboratoryRepository");

  // ========================================
  // EXPERIMENTS
  // ========================================

  /**
   * Get all experiments for a user.
   */
  async getExperiments(userId: string): Promise<Result<LaboratoryExperiment[], AppError>> {
    this.logger.info("Fetching experiments", { userId });

    try {
      const experiments = await prisma.laboratory_experiments.findMany({
        where: { user_id: userId },
        include: { laboratory_images: true },
        orderBy: { created_at: "desc" },
      });

      return { data: experiments.map(mapExperimentFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch experiments", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch experiments", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get a single experiment.
   */
  async getExperimentById(
    experimentId: string,
    userId: string
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    this.logger.info("Fetching experiment", { experimentId });

    try {
      const experiment = await prisma.laboratory_experiments.findFirst({
        where: { id: experimentId, user_id: userId },
        include: { laboratory_images: true },
      });

      if (!experiment) {
        return {
          data: null,
          error: new AppError("Experiment not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: mapExperimentFromPrisma(experiment), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch experiment", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch experiment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create an experiment.
   */
  async createExperiment(
    userId: string,
    data: {
      title: string;
      description?: string;
      status?: string;
      category?: string;
      expectedWinRate?: number;
      expectedRiskReward?: number;
    }
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    this.logger.info("Creating experiment", { userId, title: data.title });

    try {
      const created = await prisma.laboratory_experiments.create({
        data: {
          user_id: userId,
          title: data.title,
          description: data.description || null,
          status: data.status || "em_aberto",
          category: data.category || null,
          expected_win_rate: data.expectedWinRate || null,
          expected_risk_reward: data.expectedRiskReward || null,
        },
        include: { laboratory_images: true },
      });

      return { data: mapExperimentFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create experiment", { error });
      return {
        data: null,
        error: new AppError("Failed to create experiment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update an experiment.
   */
  async updateExperiment(
    experimentId: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string;
      status: string;
      category: string;
      expectedWinRate: number;
      expectedRiskReward: number;
      promotedToPlaybook: boolean;
    }>
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    this.logger.info("Updating experiment", { experimentId });

    try {
      const updated = await prisma.laboratory_experiments.update({
        where: { id: experimentId, user_id: userId },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          category: data.category,
          expected_win_rate: data.expectedWinRate,
          expected_risk_reward: data.expectedRiskReward,
          promoted_to_playbook: data.promotedToPlaybook,
          updated_at: new Date(),
        },
        include: { laboratory_images: true },
      });

      return { data: mapExperimentFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update experiment", { error });
      return {
        data: null,
        error: new AppError("Failed to update experiment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete an experiment.
   */
  async deleteExperiment(experimentId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting experiment", { experimentId });

    try {
      await prisma.laboratory_experiments.delete({
        where: { id: experimentId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete experiment", { error });
      return {
        data: null,
        error: new AppError("Failed to delete experiment", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Add images to an experiment.
   */
  async addExperimentImages(
    experimentId: string,
    images: Array<{ imageUrl: string; description?: string }>
  ): Promise<Result<LaboratoryImage[], AppError>> {
    this.logger.info("Adding experiment images", { experimentId, count: images.length });

    try {
      const created = await prisma.laboratory_images.createManyAndReturn({
        data: images.map((img) => ({
          experiment_id: experimentId,
          image_url: img.imageUrl,
          description: img.description || null,
        })),
      });

      return { data: created.map(mapImageFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to add images", { error });
      return {
        data: null,
        error: new AppError("Failed to add images", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete images from an experiment.
   */
  async deleteExperimentImages(imageIds: string[]): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting experiment images", { count: imageIds.length });

    try {
      await prisma.laboratory_images.deleteMany({
        where: { id: { in: imageIds } },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete images", { error });
      return {
        data: null,
        error: new AppError("Failed to delete images", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // RECAPS
  // ========================================

  /**
   * Get all recaps for a user.
   */
  async getRecaps(userId: string): Promise<Result<LaboratoryRecap[], AppError>> {
    this.logger.info("Fetching recaps", { userId });

    try {
      const recaps = await prisma.laboratory_recaps.findMany({
        where: { user_id: userId },
        include: {
          laboratory_recap_trades: { include: { trades: true } },
          trades: true,
        },
        orderBy: { created_at: "desc" },
      });

      return { data: recaps.map(mapRecapFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch recaps", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch recaps", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create a recap.
   */
  async createRecap(
    userId: string,
    data: {
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
    }
  ): Promise<Result<LaboratoryRecap, AppError>> {
    this.logger.info("Creating recap", { userId, title: data.title });

    try {
      const created = await prisma.$transaction(async (tx) => {
        // Create the recap
        const recap = await tx.laboratory_recaps.create({
          data: {
            user_id: userId,
            title: data.title,
            trade_id: data.tradeId || null,
            what_worked: data.whatWorked || null,
            what_failed: data.whatFailed || null,
            emotional_state: data.emotionalState || null,
            lessons_learned: data.lessonsLearned || null,
            images: data.images || [],
            review_type: data.reviewType || "daily",
            week_start_date: data.weekStartDate ? new Date(data.weekStartDate) : null,
            week_end_date: data.weekEndDate ? new Date(data.weekEndDate) : null,
            linked_type: data.linkedType || null,
            linked_id: data.linkedId || null,
          },
        });

        // Create trade links if provided
        if (data.tradeIds && data.tradeIds.length > 0) {
          await tx.laboratory_recap_trades.createMany({
            data: data.tradeIds.map((tradeId) => ({
              recap_id: recap.id,
              trade_id: tradeId,
            })),
          });
        }

        // Fetch with relations
        return tx.laboratory_recaps.findUnique({
          where: { id: recap.id },
          include: {
            laboratory_recap_trades: { include: { trades: true } },
            trades: true,
          },
        });
      });

      if (!created) {
        return {
          data: null,
          error: new AppError("Failed to create recap", ErrorCode.DB_QUERY_FAILED, 500),
        };
      }

      return { data: mapRecapFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create recap", { error });
      return {
        data: null,
        error: new AppError("Failed to create recap", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update a recap.
   */
  async updateRecap(
    recapId: string,
    userId: string,
    data: Partial<{
      title: string;
      whatWorked: string;
      whatFailed: string;
      emotionalState: string;
      lessonsLearned: string;
      images: string[];
      tradeIds: string[];
    }>
  ): Promise<Result<LaboratoryRecap, AppError>> {
    this.logger.info("Updating recap", { recapId });

    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Update the recap
        const recap = await tx.laboratory_recaps.update({
          where: { id: recapId, user_id: userId },
          data: {
            title: data.title,
            what_worked: data.whatWorked,
            what_failed: data.whatFailed,
            emotional_state: data.emotionalState,
            lessons_learned: data.lessonsLearned,
            images: data.images,
          },
        });

        // Update trade links if provided
        if (data.tradeIds !== undefined) {
          // Delete existing links
          await tx.laboratory_recap_trades.deleteMany({
            where: { recap_id: recapId },
          });

          // Create new links
          if (data.tradeIds.length > 0) {
            await tx.laboratory_recap_trades.createMany({
              data: data.tradeIds.map((tradeId) => ({
                recap_id: recapId,
                trade_id: tradeId,
              })),
            });
          }
        }

        // Fetch with relations
        return tx.laboratory_recaps.findUnique({
          where: { id: recap.id },
          include: {
            laboratory_recap_trades: { include: { trades: true } },
            trades: true,
          },
        });
      });

      if (!updated) {
        return {
          data: null,
          error: new AppError("Failed to update recap", ErrorCode.DB_QUERY_FAILED, 500),
        };
      }

      return { data: mapRecapFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update recap", { error });
      return {
        data: null,
        error: new AppError("Failed to update recap", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete a recap.
   */
  async deleteRecap(recapId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting recap", { recapId });

    try {
      await prisma.laboratory_recaps.delete({
        where: { id: recapId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete recap", { error });
      return {
        data: null,
        error: new AppError("Failed to delete recap", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaLaboratoryRepo = new PrismaLaboratoryRepository();
export { PrismaLaboratoryRepository };
