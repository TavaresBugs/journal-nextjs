/**
 * Prisma Journal Repository
 *
 * Type-safe implementation of JournalRepository using Prisma ORM.
 * Handles journal entries with images and trade associations.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  journal_entries as PrismaJournalEntry,
  journal_images as PrismaJournalImage,
  journal_entry_trades as PrismaJournalTrade,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
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

class PrismaJournalRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaJournalRepository";

  /**
   * Fetches all journal entries for an account.
   */
  async getByAccountId(
    accountId: string,
    options?: { limit?: number; offset?: number; orderBy?: string; ascending?: boolean }
  ): Promise<Result<JournalEntry[], AppError>> {
    return this.withQuery(
      "getByAccountId",
      async () => {
        const entries = await prisma.journal_entries.findMany({
          where: { account_id: accountId },
          include: { journal_images: true, journal_entry_trades: true },
          orderBy: { date: options?.ascending ? "asc" : "desc" },
          take: options?.limit,
          skip: options?.offset,
        });
        return entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations));
      },
      { accountId }
    );
  }

  /**
   * Fetches a single journal entry by ID with ownership verification.
   */
  async getById(id: string, userId: string): Promise<Result<JournalEntry, AppError>> {
    return this.withQuery(
      "getById",
      async () => {
        const entry = await prisma.journal_entries.findFirst({
          where: { id, user_id: userId },
          include: { journal_images: true, journal_entry_trades: true },
        });

        if (!entry) throw this.notFoundError("Journal entry");
        return mapJournalFromPrisma(entry as JournalWithRelations);
      },
      { id, userId }
    );
  }

  /**
   * Fetches journal entries by date range.
   */
  async getByDateRange(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<Result<JournalEntry[], AppError>> {
    return this.withQuery(
      "getByDateRange",
      async () => {
        const entries = await prisma.journal_entries.findMany({
          where: {
            account_id: accountId,
            date: { gte: new Date(startDate), lte: new Date(endDate) },
          },
          include: { journal_images: true, journal_entry_trades: true },
          orderBy: { date: "desc" },
        });
        return entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations));
      },
      { accountId, startDate, endDate }
    );
  }

  /**
   * Searches journal entries by text content.
   */
  async search(accountId: string, query: string): Promise<Result<JournalEntry[], AppError>> {
    return this.withQuery(
      "search",
      async () => {
        const entries = await prisma.journal_entries.findMany({
          where: {
            account_id: accountId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
              { analysis: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { journal_images: true, journal_entry_trades: true },
          orderBy: { date: "desc" },
          take: 50,
        });
        return entries.map((e) => mapJournalFromPrisma(e as JournalWithRelations));
      },
      { accountId, query }
    );
  }

  /**
   * Creates or updates a journal entry.
   */
  async save(entry: Partial<JournalEntry>): Promise<Result<JournalEntry, AppError>> {
    return this.withQuery(
      "save",
      async () => {
        if (!entry.accountId || !entry.userId) {
          throw new AppError("Missing accountId or userId", ErrorCode.VALIDATION_ERROR, 400);
        }

        const entryDate = entry.date ? new Date(entry.date) : new Date();
        let saved: JournalWithRelations;

        if (entry.id) {
          saved = await prisma.journal_entries.upsert({
            where: { id: entry.id },
            create: {
              accounts: { connect: { id: entry.accountId } },
              users: entry.userId ? { connect: { id: entry.userId } } : undefined,
              date: entryDate,
              title: entry.title || "",
              asset: entry.asset,
              emotion: entry.emotion,
              analysis: entry.analysis,
              notes: entry.notes,
              journal_images: entry.images
                ? {
                    create: entry.images.map((img) => ({
                      user_id: entry.userId || img.userId,
                      url: img.url,
                      path: img.path,
                      timeframe: img.timeframe,
                      display_order: img.displayOrder || 0,
                    })),
                  }
                : undefined,
            },
            update: {
              date: entry.date ? new Date(entry.date) : undefined,
              title: entry.title,
              asset: entry.asset,
              emotion: entry.emotion,
              analysis: entry.analysis,
              notes: entry.notes,
              updated_at: new Date(),
              journal_images: entry.images
                ? {
                    deleteMany: {},
                    create: entry.images.map((img) => ({
                      user_id: entry.userId || img.userId,
                      url: img.url,
                      path: img.path,
                      timeframe: img.timeframe,
                      display_order: img.displayOrder || 0,
                    })),
                  }
                : undefined,
            },
            include: { journal_images: true, journal_entry_trades: true },
          });
        } else {
          saved = await prisma.journal_entries.create({
            data: {
              accounts: { connect: { id: entry.accountId } },
              users: entry.userId ? { connect: { id: entry.userId } } : undefined,
              date: entryDate,
              title: entry.title || "",
              asset: entry.asset,
              emotion: entry.emotion,
              analysis: entry.analysis,
              notes: entry.notes,
              journal_images: entry.images
                ? {
                    create: entry.images.map((img) => ({
                      user_id: entry.userId || img.userId,
                      url: img.url,
                      path: img.path,
                      timeframe: img.timeframe,
                      display_order: img.displayOrder || 0,
                    })),
                  }
                : undefined,
            },
            include: { journal_images: true, journal_entry_trades: true },
          });
        }

        // Handle trade links
        if (entry.tradeIds !== undefined) {
          await prisma.journal_entry_trades.deleteMany({
            where: { journal_entry_id: saved.id },
          });

          if (entry.tradeIds.length > 0) {
            await prisma.journal_entry_trades.createMany({
              data: entry.tradeIds.map((tradeId) => ({
                journal_entry_id: saved.id,
                trade_id: tradeId,
              })),
            });
          }

          const refreshed = await prisma.journal_entries.findUnique({
            where: { id: saved.id },
            include: { journal_images: true, journal_entry_trades: true },
          });
          if (refreshed) saved = refreshed;
        }

        return mapJournalFromPrisma(saved as JournalWithRelations);
      },
      { entryId: entry.id }
    );
  }

  /**
   * Deletes a journal entry with ownership verification.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "delete",
      async () => {
        const deleted = await prisma.journal_entries.deleteMany({
          where: { id, user_id: userId },
        });
        if (deleted.count === 0) throw this.notFoundError("Journal entry");
        return true;
      },
      { id, userId }
    );
  }

  /**
   * Associates a trade with a journal entry.
   */
  async linkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "linkTrade",
      async () => {
        await prisma.journal_entry_trades.create({
          data: { journal_entry_id: journalId, trade_id: tradeId },
        });
        return true;
      },
      { journalId, tradeId }
    );
  }

  /**
   * Removes a trade association from a journal entry.
   */
  async unlinkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("unlinkTrade", async () => {
      await prisma.journal_entry_trades.deleteMany({
        where: { journal_entry_id: journalId, trade_id: tradeId },
      });
      return true;
    });
  }

  /**
   * Adds an image to a journal entry.
   */
  async addImage(
    journalId: string,
    image: { userId: string; url: string; path: string; timeframe: string; displayOrder?: number }
  ): Promise<Result<JournalImage, AppError>> {
    return this.withQuery(
      "addImage",
      async () => {
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
        return mapImageFromPrisma(created);
      },
      { journalId }
    );
  }

  /**
   * Removes an image from a journal entry.
   */
  async removeImage(imageId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("removeImage", async () => {
      await prisma.journal_images.delete({ where: { id: imageId } });
      return true;
    });
  }

  /**
   * Gets journal count for an account.
   */
  async getCount(accountId: string): Promise<Result<number, AppError>> {
    return this.withQuery("getCount", async () => {
      return prisma.journal_entries.count({ where: { account_id: accountId } });
    });
  }

  /**
   * Gets journal availability map for a date range.
   */
  async getAvailabilityMap(
    userId: string,
    accountIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Result<Record<string, number>, AppError>> {
    return this.withQuery(
      "getAvailabilityMap",
      async () => {
        const entries = await prisma.journal_entries.findMany({
          where: {
            user_id: userId,
            account_id: { in: accountIds },
            date: { gte: startDate, lte: endDate },
          },
          select: { date: true },
        });

        const availabilityMap: Record<string, number> = {};
        for (const entry of entries) {
          const dateKey =
            entry.date instanceof Date
              ? entry.date.toISOString().split("T")[0]
              : String(entry.date);
          availabilityMap[dateKey] = (availabilityMap[dateKey] || 0) + 1;
        }

        return availabilityMap;
      },
      { userId, startDate, endDate }
    );
  }
}

// Export singleton instance
export const prismaJournalRepo = new PrismaJournalRepository();
export { PrismaJournalRepository };
