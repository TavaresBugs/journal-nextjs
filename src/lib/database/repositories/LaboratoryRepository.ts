/**
 * Prisma Laboratory Repository
 *
 * Type-safe implementation of LaboratoryRepository using Prisma ORM.
 * Handles experiments and recaps for the Laboratory feature.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  laboratory_experiments as PrismaExperiment,
  laboratory_images as PrismaImage,
  laboratory_recaps as PrismaRecap,
  laboratory_recap_trades as PrismaRecapTrade,
  trades as PrismaTrade,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";

// Domain types
export interface ExperimentLinkedTrade {
  id: string;
  tradeId: string;
  symbol: string;
  type: "Long" | "Short";
  pnl: number;
  outcome: "win" | "loss" | "breakeven" | "pending";
  category: "pro" | "contra";
  entryDate: string;
  entryTime: string | null;
}

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
  experimentType: string | null;
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
  linkedTrade?: { asset: string; pnl: number; date: string } | null;
  linkedJournal?: { date: string; accountId: string } | null;
}

type RecapWithRelations = PrismaRecap & {
  laboratory_recap_trades: (PrismaRecapTrade & { trades: PrismaTrade | null })[];
  trades: PrismaTrade | null;
};

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
    experimentType: exp.experiment_type,
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
  const tradeIds = recap.laboratory_recap_trades
    .filter((rt) => rt.trade_id)
    .map((rt) => rt.trade_id as string);
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

class PrismaLaboratoryRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaLaboratoryRepository";

  // EXPERIMENTS
  async getExperiments(userId: string): Promise<Result<LaboratoryExperiment[], AppError>> {
    return this.withQuery(
      "getExperiments",
      async () => {
        const experiments = await prisma.laboratory_experiments.findMany({
          where: { user_id: userId },
          include: { laboratory_images: true },
          orderBy: { created_at: "desc" },
        });
        return experiments.map(mapExperimentFromPrisma);
      },
      { userId }
    );
  }

  async getExperimentById(
    experimentId: string,
    userId: string
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    return this.withQuery(
      "getExperimentById",
      async () => {
        const experiment = await prisma.laboratory_experiments.findFirst({
          where: { id: experimentId, user_id: userId },
          include: { laboratory_images: true },
        });
        if (!experiment) throw this.notFoundError("Experiment");
        return mapExperimentFromPrisma(experiment);
      },
      { experimentId }
    );
  }

  async createExperiment(
    userId: string,
    data: {
      title: string;
      description?: string;
      experimentType?: string;
      status?: string;
      category?: string;
      expectedWinRate?: number;
      expectedRiskReward?: number;
    }
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    return this.withQuery(
      "createExperiment",
      async () => {
        const created = await prisma.laboratory_experiments.create({
          data: {
            user_id: userId,
            title: data.title,
            description: data.description || null,
            experiment_type: data.experimentType || null,
            status: data.status || "em_aberto",
            category: data.category || null,
            expected_win_rate: data.expectedWinRate || null,
            expected_risk_reward: data.expectedRiskReward || null,
          },
          include: { laboratory_images: true },
        });
        return mapExperimentFromPrisma(created);
      },
      { userId, title: data.title }
    );
  }

  async updateExperiment(
    experimentId: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string;
      experimentType: string;
      status: string;
      category: string;
      expectedWinRate: number;
      expectedRiskReward: number;
      promotedToPlaybook: boolean;
    }>
  ): Promise<Result<LaboratoryExperiment, AppError>> {
    return this.withQuery(
      "updateExperiment",
      async () => {
        const updated = await prisma.laboratory_experiments.update({
          where: { id: experimentId, user_id: userId },
          data: {
            title: data.title,
            description: data.description,
            experiment_type: data.experimentType,
            status: data.status,
            category: data.category,
            expected_win_rate: data.expectedWinRate,
            expected_risk_reward: data.expectedRiskReward,
            promoted_to_playbook: data.promotedToPlaybook,
            updated_at: new Date(),
          },
          include: { laboratory_images: true },
        });
        return mapExperimentFromPrisma(updated);
      },
      { experimentId }
    );
  }

  async deleteExperiment(experimentId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteExperiment",
      async () => {
        await prisma.laboratory_experiments.delete({
          where: { id: experimentId, user_id: userId },
        });
        return true;
      },
      { experimentId }
    );
  }

  async addExperimentImages(
    experimentId: string,
    images: Array<{ imageUrl: string; description?: string }>
  ): Promise<Result<LaboratoryImage[], AppError>> {
    return this.withQuery(
      "addExperimentImages",
      async () => {
        const created = await prisma.laboratory_images.createManyAndReturn({
          data: images.map((img) => ({
            experiment_id: experimentId,
            image_url: img.imageUrl,
            description: img.description || null,
          })),
        });
        return created.map(mapImageFromPrisma);
      },
      { experimentId, count: images.length }
    );
  }

  async deleteExperimentImages(imageIds: string[]): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteExperimentImages",
      async () => {
        await prisma.laboratory_images.deleteMany({ where: { id: { in: imageIds } } });
        return true;
      },
      { count: imageIds.length }
    );
  }

  // EXPERIMENT TRADES
  async linkTradeToExperiment(
    experimentId: string,
    tradeId: string,
    userId: string,
    category: "pro" | "contra" = "pro"
  ): Promise<Result<ExperimentLinkedTrade, AppError>> {
    return this.withQuery(
      "linkTradeToExperiment",
      async () => {
        const experiment = await prisma.laboratory_experiments.findFirst({
          where: { id: experimentId, user_id: userId },
        });
        if (!experiment) throw this.notFoundError("Experiment");

        const result = await prisma.$transaction(async (tx) => {
          const link = await tx.laboratory_experiment_trades.create({
            data: { experiment_id: experimentId, trade_id: tradeId, category },
          });
          const trade = await tx.trades.findUnique({ where: { id: tradeId } });
          return { link, trade };
        });

        if (!result.trade) throw this.notFoundError("Trade");

        return {
          id: result.link.id,
          tradeId: result.trade.id,
          symbol: result.trade.symbol,
          type: result.trade.type as "Long" | "Short",
          pnl: Number(result.trade.pnl) || 0,
          outcome: (result.trade.outcome as ExperimentLinkedTrade["outcome"]) || "pending",
          category,
          entryDate: result.trade.entry_date?.toISOString().split("T")[0] || "",
          entryTime: result.trade.entry_time,
        };
      },
      { experimentId, tradeId, category }
    );
  }

  async unlinkTradeFromExperiment(
    experimentId: string,
    tradeId: string,
    userId: string
  ): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "unlinkTradeFromExperiment",
      async () => {
        const experiment = await prisma.laboratory_experiments.findFirst({
          where: { id: experimentId, user_id: userId },
        });
        if (!experiment) throw this.notFoundError("Experiment");
        await prisma.laboratory_experiment_trades.deleteMany({
          where: { experiment_id: experimentId, trade_id: tradeId },
        });
        return true;
      },
      { experimentId, tradeId }
    );
  }

  async getExperimentTrades(
    experimentId: string,
    userId: string
  ): Promise<Result<ExperimentLinkedTrade[], AppError>> {
    return this.withQuery(
      "getExperimentTrades",
      async () => {
        const experiment = await prisma.laboratory_experiments.findFirst({
          where: { id: experimentId, user_id: userId },
        });
        if (!experiment) throw this.notFoundError("Experiment");

        const links = await prisma.laboratory_experiment_trades.findMany({
          where: { experiment_id: experimentId },
          include: { trades: true },
          orderBy: { created_at: "desc" },
        });

        return links
          .filter((link) => link.trades)
          .map((link) => ({
            id: link.id,
            tradeId: link.trades!.id,
            symbol: link.trades!.symbol,
            type: link.trades!.type as "Long" | "Short",
            pnl: Number(link.trades!.pnl) || 0,
            outcome: (link.trades!.outcome as ExperimentLinkedTrade["outcome"]) || "pending",
            category: (link.category as "pro" | "contra") || "pro",
            entryDate: link.trades!.entry_date?.toISOString().split("T")[0] || "",
            entryTime: link.trades!.entry_time,
          }));
      },
      { experimentId }
    );
  }

  // RECAPS
  async getRecaps(userId: string): Promise<Result<LaboratoryRecap[], AppError>> {
    return this.withQuery(
      "getRecaps",
      async () => {
        const recaps = await prisma.laboratory_recaps.findMany({
          where: { user_id: userId },
          include: { laboratory_recap_trades: { include: { trades: true } }, trades: true },
          orderBy: { created_at: "desc" },
        });
        return recaps.map(mapRecapFromPrisma);
      },
      { userId }
    );
  }

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
    return this.withQuery(
      "createRecap",
      async () => {
        const created = await prisma.$transaction(async (tx) => {
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

          if (data.tradeIds && data.tradeIds.length > 0) {
            await tx.laboratory_recap_trades.createMany({
              data: data.tradeIds.map((tradeId) => ({ recap_id: recap.id, trade_id: tradeId })),
            });
          }

          return tx.laboratory_recaps.findUnique({
            where: { id: recap.id },
            include: { laboratory_recap_trades: { include: { trades: true } }, trades: true },
          });
        });

        if (!created) throw new AppError("Failed to create recap", ErrorCode.DB_QUERY_FAILED, 500);
        return mapRecapFromPrisma(created);
      },
      { userId, title: data.title }
    );
  }

  async updateRecap(
    recapId: string,
    userId: string,
    data: Partial<{
      title: string;
      linkedType: string;
      linkedId: string;
      whatWorked: string;
      whatFailed: string;
      emotionalState: string;
      lessonsLearned: string;
      images: string[];
      tradeIds: string[];
    }>
  ): Promise<Result<LaboratoryRecap, AppError>> {
    return this.withQuery(
      "updateRecap",
      async () => {
        const updated = await prisma.$transaction(async (tx) => {
          await tx.laboratory_recaps.update({
            where: { id: recapId, user_id: userId },
            data: {
              title: data.title,
              linked_type: data.linkedType,
              linked_id: data.linkedId,
              what_worked: data.whatWorked,
              what_failed: data.whatFailed,
              emotional_state: data.emotionalState,
              lessons_learned: data.lessonsLearned,
              images: data.images,
            },
          });

          if (data.tradeIds !== undefined) {
            await tx.laboratory_recap_trades.deleteMany({ where: { recap_id: recapId } });
            if (data.tradeIds.length > 0) {
              await tx.laboratory_recap_trades.createMany({
                data: data.tradeIds.map((tradeId) => ({ recap_id: recapId, trade_id: tradeId })),
              });
            }
          }

          return tx.laboratory_recaps.findUnique({
            where: { id: recapId },
            include: { laboratory_recap_trades: { include: { trades: true } }, trades: true },
          });
        });

        if (!updated) throw new AppError("Failed to update recap", ErrorCode.DB_QUERY_FAILED, 500);
        return mapRecapFromPrisma(updated);
      },
      { recapId }
    );
  }

  async deleteRecap(recapId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteRecap",
      async () => {
        await prisma.laboratory_recaps.delete({ where: { id: recapId, user_id: userId } });
        return true;
      },
      { recapId }
    );
  }
}

export const prismaLaboratoryRepo = new PrismaLaboratoryRepository();
export { PrismaLaboratoryRepository };
