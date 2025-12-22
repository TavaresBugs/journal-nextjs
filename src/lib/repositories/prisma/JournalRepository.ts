/**
 * Prisma Journal Repository
 *
 * Type-safe implementation of JournalRepository using Prisma ORM.
 * Handles journal entries with images and trade associations.
 *
 * @example
 * import { prismaJournalRepo } from '@/lib/repositories/prisma';
 * const entries = await prismaJournalRepo.getByAccountId('account-uuid');
 */

import { prisma } from "@/lib/prisma";
import {
  journal_entries as PrismaJournalEntry,
  journal_images as PrismaJournalImage,
  journal_entry_trades as PrismaJournalTrade,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { JournalEntry, JournalImage } from "@/types";

// Type with relations included
type JournalWithRelations = PrismaJournalEntry & {
  journal_images: PrismaJournalImage[];
  journal_entry_trades: PrismaJournalTrade[];
};

/**
 * Maps Prisma journal image to domain type
 */
function mapImageFromPrisma(img: PrismaJournalImage): JournalImage {
  return {
    id: img.id,
    userId: img.user_id || "",
    journalEntryId: img.journal_entry_id,
    url: img.url,
    path: img.path,
    timeframe: img.timeframe,
    displayOrder: img.display_order || 0,
    createdAt: img.created_at?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Maps Prisma journal entry to domain type
 */
function mapJournalFromPrisma(entry: JournalWithRelations): JournalEntry {
  return {
    id: entry.id,
    userId: entry.user_id || "",
    accountId: entry.account_id,
    date: entry.date instanceof Date ? entry.date.toISOString().split("T")[0] : String(entry.date),
    title: entry.title || "",
    asset: entry.asset || undefined,
    emotion: entry.emotion || undefined,
    analysis: entry.analysis || undefined,
    notes: entry.notes || undefined,
    images: entry.journal_images?.map(mapImageFromPrisma) || [],
    tradeIds: entry.journal_entry_trades?.map((jt) => jt.trade_id) || [],
    createdAt: entry.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: entry.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaJournalRepository {
  private logger = new Logger("PrismaJournalRepository");

  /**
   * Fetches all journal entries for an account.
   */
  async getByAccountId(
    accountId: string,
    options?: { limit?: number; offset?: number; orderBy?: string; ascending?: boolean }
  ): Promise<Result<JournalEntry[], AppError>> {
    this.logger.info("Fetching journal entries by account", { accountId });

    try {
      const entries = await prisma.journal_entries.findMany({
        where: { account_id: accountId },
        include: {
          journal_images: true,
          journal_entry_trades: true,
        },
        orderBy: { date: options?.ascending ? "asc" : "desc" },
        take: options?.limit,
        skip: options?.offset,
      });

      return {
        data: entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations)),
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to fetch journal entries", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch journal entries", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches a single journal entry by ID.
   */
  async getById(id: string): Promise<Result<JournalEntry, AppError>> {
    this.logger.info("Fetching journal entry by ID", { id });

    try {
      const entry = await prisma.journal_entries.findUnique({
        where: { id },
        include: {
          journal_images: true,
          journal_entry_trades: true,
        },
      });

      if (!entry) {
        return {
          data: null,
          error: new AppError("Journal entry not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: mapJournalFromPrisma(entry as JournalWithRelations), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch journal entry", { error, id });
      return {
        data: null,
        error: new AppError("Failed to fetch journal entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches journal entries by date range.
   */
  async getByDateRange(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<Result<JournalEntry[], AppError>> {
    this.logger.info("Fetching journal entries by date range", { accountId, startDate, endDate });

    try {
      const entries = await prisma.journal_entries.findMany({
        where: {
          account_id: accountId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          journal_images: true,
          journal_entry_trades: true,
        },
        orderBy: { date: "desc" },
      });

      return {
        data: entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations)),
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to fetch journal entries by date range", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch journal entries", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Searches journal entries by text content.
   */
  async search(accountId: string, query: string): Promise<Result<JournalEntry[], AppError>> {
    this.logger.info("Searching journal entries", { accountId, query });

    try {
      const entries = await prisma.journal_entries.findMany({
        where: {
          account_id: accountId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
            { analysis: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          journal_images: true,
          journal_entry_trades: true,
        },
        orderBy: { date: "desc" },
        take: 50,
      });

      return {
        data: entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations)),
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to search journal entries", { error });
      return {
        data: null,
        error: new AppError("Failed to search journal entries", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates or updates a journal entry.
   */
  async save(entry: Partial<JournalEntry>): Promise<Result<JournalEntry, AppError>> {
    this.logger.info("Saving journal entry", { id: entry.id });

    try {
      const saved = await prisma.journal_entries.upsert({
        where: { id: entry.id || "" },
        create: {
          accounts: { connect: { id: entry.accountId } },
          users: entry.userId ? { connect: { id: entry.userId } } : undefined,
          date: new Date(entry.date!),
          title: entry.title || "",
          asset: entry.asset,
          emotion: entry.emotion,
          analysis: entry.analysis,
          notes: entry.notes,
        },
        update: {
          date: entry.date ? new Date(entry.date) : undefined,
          title: entry.title,
          asset: entry.asset,
          emotion: entry.emotion,
          analysis: entry.analysis,
          notes: entry.notes,
          updated_at: new Date(),
        },
        include: {
          journal_images: true,
          journal_entry_trades: true,
        },
      });

      return { data: mapJournalFromPrisma(saved as JournalWithRelations), error: null };
    } catch (error) {
      this.logger.error("Failed to save journal entry", { error });
      return {
        data: null,
        error: new AppError("Failed to save journal entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes a journal entry with ownership verification.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting journal entry", { id, userId });

    try {
      const deleted = await prisma.journal_entries.deleteMany({
        where: { id, user_id: userId },
      });

      if (deleted.count === 0) {
        return {
          data: null,
          error: new AppError(
            "Journal entry not found or unauthorized",
            ErrorCode.DB_NOT_FOUND,
            404
          ),
        };
      }

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete journal entry", { error });
      return {
        data: null,
        error: new AppError("Failed to delete journal entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Associates a trade with a journal entry.
   */
  async linkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Linking trade to journal", { journalId, tradeId });

    try {
      await prisma.journal_entry_trades.create({
        data: {
          journal_entry_id: journalId,
          trade_id: tradeId,
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to link trade", { error });
      return {
        data: null,
        error: new AppError("Failed to link trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Removes a trade association from a journal entry.
   */
  async unlinkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Unlinking trade from journal", { journalId, tradeId });

    try {
      await prisma.journal_entry_trades.deleteMany({
        where: {
          journal_entry_id: journalId,
          trade_id: tradeId,
        },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to unlink trade", { error });
      return {
        data: null,
        error: new AppError("Failed to unlink trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Adds an image to a journal entry.
   */
  async addImage(
    journalId: string,
    image: { userId: string; url: string; path: string; timeframe: string; displayOrder?: number }
  ): Promise<Result<JournalImage, AppError>> {
    this.logger.info("Adding image to journal", { journalId });

    try {
      const created = await prisma.journal_images.create({
        data: {
          journal_entry_id: journalId,
          user_id: image.userId,
          url: image.url,
          path: image.path,
          timeframe: image.timeframe,
          display_order: image.displayOrder || 0,
        },
      });

      return { data: mapImageFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to add image", { error });
      return {
        data: null,
        error: new AppError("Failed to add image", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Removes an image from a journal entry.
   */
  async removeImage(imageId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Removing image", { imageId });

    try {
      await prisma.journal_images.delete({
        where: { id: imageId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to remove image", { error });
      return {
        data: null,
        error: new AppError("Failed to remove image", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets journal count for an account.
   */
  async getCount(accountId: string): Promise<Result<number, AppError>> {
    try {
      const count = await prisma.journal_entries.count({
        where: { account_id: accountId },
      });

      return { data: count, error: null };
    } catch (error) {
      this.logger.error("Failed to count journal entries", { error });
      return {
        data: null,
        error: new AppError("Failed to count entries", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaJournalRepo = new PrismaJournalRepository();
export { PrismaJournalRepository };
