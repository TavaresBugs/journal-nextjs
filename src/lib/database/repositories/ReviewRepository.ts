/**
 * Prisma Review Repository
 *
 * Type-safe implementation of ReviewRepository using Prisma ORM.
 * Handles mentor reviews for trades and journal entries.
 *
 * @example
 * import { prismaReviewRepo } from '@/lib/database/repositories';
 * const reviews = await prismaReviewRepo.getByMenteeId('user-uuid');
 */

import { prisma } from "@/lib/database";
import { mentor_reviews as PrismaMentorReview } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

// Domain type for mentor reviews
export interface MentorReview {
  id: string;
  mentorId: string;
  menteeId: string;
  tradeId?: string;
  journalEntryId?: string;
  reviewType: "correction" | "comment" | "suggestion";
  content: string;
  rating?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  // Context data from joins
  entryDate?: string;
  entryAccountId?: string;
}

/**
 * Maps Prisma mentor review to domain type
 */
function mapReviewFromPrisma(
  review: PrismaMentorReview & {
    journal_entries?: { date: Date; account_id: string } | null;
  }
): MentorReview {
  return {
    id: review.id,
    mentorId: review.mentor_id,
    menteeId: review.mentee_id,
    tradeId: review.trade_id || undefined,
    journalEntryId: review.journal_entry_id || undefined,
    reviewType: review.review_type as MentorReview["reviewType"],
    content: review.content,
    rating: review.rating || undefined,
    isRead: review.is_read || false,
    createdAt: review.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: review.updated_at?.toISOString() || new Date().toISOString(),
    entryDate: review.journal_entries?.date
      ? review.journal_entries.date.toISOString().split("T")[0]
      : undefined,
    entryAccountId: review.journal_entries?.account_id,
  };
}

class PrismaReviewRepository {
  private logger = new Logger("PrismaReviewRepository");

  /**
   * Creates a new mentor review.
   */
  async create(
    data: Omit<MentorReview, "id" | "createdAt" | "updatedAt" | "isRead">
  ): Promise<Result<MentorReview, AppError>> {
    this.logger.info("Creating mentor review", {
      mentorId: data.mentorId,
      menteeId: data.menteeId,
    });

    try {
      const created = await prisma.mentor_reviews.create({
        data: {
          users_mentor_reviews_mentor_idTousers: { connect: { id: data.mentorId } },
          users_mentor_reviews_mentee_idTousers: { connect: { id: data.menteeId } },
          trades: data.tradeId ? { connect: { id: data.tradeId } } : undefined,
          journal_entries: data.journalEntryId
            ? { connect: { id: data.journalEntryId } }
            : undefined,
          review_type: data.reviewType,
          content: data.content,
          rating: data.rating,
          is_read: false,
        },
      });

      return { data: mapReviewFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create review", { error });
      return {
        data: null,
        error: new AppError("Failed to create review", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Updates a review's content.
   */
  async updateContent(reviewId: string, content: string): Promise<Result<MentorReview, AppError>> {
    this.logger.info("Updating review content", { reviewId });

    try {
      const updated = await prisma.mentor_reviews.update({
        where: { id: reviewId },
        data: {
          content,
          updated_at: new Date(),
        },
      });

      return { data: mapReviewFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update review", { error });
      return {
        data: null,
        error: new AppError("Failed to update review", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes a review.
   */
  async delete(reviewId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting review", { reviewId });

    try {
      await prisma.mentor_reviews.delete({
        where: { id: reviewId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete review", { error });
      return {
        data: null,
        error: new AppError("Failed to delete review", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches all reviews for a mentee.
   */
  async getByMenteeId(menteeId: string): Promise<Result<MentorReview[], AppError>> {
    this.logger.info("Fetching reviews for mentee", { menteeId });

    try {
      const reviews = await prisma.mentor_reviews.findMany({
        where: { mentee_id: menteeId },
        include: {
          journal_entries: { select: { date: true, account_id: true } },
        },
        orderBy: { created_at: "desc" },
      });

      return { data: reviews.map(mapReviewFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch reviews", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch reviews", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches reviews for a specific trade.
   */
  async getByTradeId(tradeId: string): Promise<Result<MentorReview[], AppError>> {
    this.logger.info("Fetching reviews for trade", { tradeId });

    try {
      const reviews = await prisma.mentor_reviews.findMany({
        where: { trade_id: tradeId },
        orderBy: { created_at: "asc" },
      });

      return { data: reviews.map(mapReviewFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch reviews for trade", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch reviews", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches reviews for a specific journal entry.
   */
  async getByJournalEntryId(journalEntryId: string): Promise<Result<MentorReview[], AppError>> {
    this.logger.info("Fetching reviews for journal entry", { journalEntryId });

    try {
      const reviews = await prisma.mentor_reviews.findMany({
        where: { journal_entry_id: journalEntryId },
        orderBy: { created_at: "asc" },
      });

      return { data: reviews.map(mapReviewFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch reviews for journal entry", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch reviews", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Marks a review as read.
   */
  async markAsRead(reviewId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Marking review as read", { reviewId });

    try {
      await prisma.mentor_reviews.update({
        where: { id: reviewId },
        data: { is_read: true },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to mark review as read", { error });
      return {
        data: null,
        error: new AppError("Failed to mark review as read", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Counts unread reviews for a mentee.
   */
  async getUnreadCount(menteeId: string): Promise<Result<number, AppError>> {
    this.logger.info("Counting unread reviews", { menteeId });

    try {
      const count = await prisma.mentor_reviews.count({
        where: {
          mentee_id: menteeId,
          is_read: false,
        },
      });

      return { data: count, error: null };
    } catch (error) {
      this.logger.error("Failed to count unread reviews", { error });
      return {
        data: null,
        error: new AppError("Failed to count reviews", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches reviews for multiple trades and journal entries (batch).
   */
  async getByContext(
    menteeId: string,
    tradeIds: string[],
    journalEntryIds: string[]
  ): Promise<Result<MentorReview[], AppError>> {
    this.logger.info("Fetching reviews by context", { menteeId, tradeIds, journalEntryIds });

    if (tradeIds.length === 0 && journalEntryIds.length === 0) {
      return { data: [], error: null };
    }

    try {
      const reviews = await prisma.mentor_reviews.findMany({
        where: {
          mentee_id: menteeId,
          OR: [
            ...(tradeIds.length > 0 ? [{ trade_id: { in: tradeIds } }] : []),
            ...(journalEntryIds.length > 0 ? [{ journal_entry_id: { in: journalEntryIds } }] : []),
          ],
        },
        orderBy: { created_at: "desc" },
      });

      return { data: reviews.map(mapReviewFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch reviews by context", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch reviews", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaReviewRepo = new PrismaReviewRepository();
export { PrismaReviewRepository };
