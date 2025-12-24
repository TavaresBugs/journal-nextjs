/**
 * Prisma Share Repository
 *
 * Type-safe implementation of ShareRepository using Prisma ORM.
 * Handles shared journal links.
 *
 * @example
 * import { prismaShareRepo } from '@/lib/database/repositories';
 * const shareToken = await prismaShareRepo.createShareLink(userId, journalEntryId);
 */

import { prisma } from "@/lib/database";
import { shared_journals as PrismaSharedJournal } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

// Domain types
export interface SharedJournal {
  id: string;
  journalEntryId: string;
  userId: string;
  shareToken: string;
  expiresAt: string;
  createdAt: string;
  viewCount: number;
}

// Mapper
function mapSharedJournalFromPrisma(sj: PrismaSharedJournal): SharedJournal {
  return {
    id: sj.id,
    journalEntryId: sj.journal_entry_id,
    userId: sj.user_id,
    shareToken: sj.share_token,
    expiresAt: sj.expires_at.toISOString(),
    createdAt: sj.created_at?.toISOString() || new Date().toISOString(),
    viewCount: sj.view_count || 0,
  };
}

class PrismaShareRepository {
  private logger = new Logger("PrismaShareRepository");

  /**
   * Create a share link for a journal entry.
   * If a valid (non-expired) link exists, reuse it.
   */
  async createShareLink(
    userId: string,
    journalEntryId: string,
    expirationDays = 3
  ): Promise<Result<SharedJournal, AppError>> {
    this.logger.info("Creating share link", { userId, journalEntryId });

    try {
      // Check for existing valid link
      const existing = await prisma.shared_journals.findFirst({
        where: {
          journal_entry_id: journalEntryId,
          user_id: userId,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: "desc" },
      });

      if (existing) {
        return { data: mapSharedJournalFromPrisma(existing), error: null };
      }

      // Create new link
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const created = await prisma.shared_journals.create({
        data: {
          journal_entry_id: journalEntryId,
          user_id: userId,
          expires_at: expiresAt,
        },
      });

      return { data: mapSharedJournalFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create share link", { error });
      return {
        data: null,
        error: new AppError("Failed to create share link", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get a shared journal by token.
   */
  async getByToken(token: string): Promise<Result<SharedJournal | null, AppError>> {
    this.logger.info("Fetching shared journal by token");

    try {
      const shared = await prisma.shared_journals.findUnique({
        where: { share_token: token },
      });

      if (!shared) {
        return { data: null, error: null };
      }

      // Check if expired
      if (new Date() > shared.expires_at) {
        return {
          data: null,
          error: new AppError("Share link has expired", ErrorCode.VALIDATION_ERROR, 410),
        };
      }

      return { data: mapSharedJournalFromPrisma(shared), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch shared journal", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch shared journal", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Increment view count for a shared journal.
   */
  async incrementViewCount(token: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Incrementing view count");

    try {
      await prisma.shared_journals.update({
        where: { share_token: token },
        data: { view_count: { increment: 1 } },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to increment view count", { error });
      return {
        data: null,
        error: new AppError("Failed to increment view count", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete a share link.
   */
  async deleteShareLink(shareId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting share link", { shareId });

    try {
      await prisma.shared_journals.delete({
        where: { id: shareId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete share link", { error });
      return {
        data: null,
        error: new AppError("Failed to delete share link", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get all shared journals for a user.
   */
  async getUserSharedJournals(userId: string): Promise<Result<SharedJournal[], AppError>> {
    this.logger.info("Fetching user shared journals", { userId });

    try {
      const shares = await prisma.shared_journals.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      return { data: shares.map(mapSharedJournalFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch user shared journals", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch shared journals", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaShareRepo = new PrismaShareRepository();
export { PrismaShareRepository };
