import { prisma } from "@/lib/database";
import { Prisma } from "@/generated/prisma";
import { MentorReview } from "@/types";
export type { MentorReview };

type ReviewWithJournal = Prisma.mentor_reviewsGetPayload<{
  include: {
    journal_entries: {
      select: {
        date: true;
        account_id: true;
      };
    };
  };
}>;

export class PrismaReviewRepository {
  /**
   * Maps Prisma result to Domain type
   */
  private mapToDomain(db: ReviewWithJournal): MentorReview {
    return {
      id: db.id,
      mentorId: db.mentor_id,
      menteeId: db.mentee_id,
      tradeId: db.trade_id || undefined,
      journalEntryId: db.journal_entry_id || undefined,
      reviewType: db.review_type as MentorReview["reviewType"],
      content: db.content,
      rating: db.rating || undefined,
      isRead: db.is_read ?? false,
      createdAt: db.created_at?.toISOString() || "",
      updatedAt: db.updated_at?.toISOString() || "",
      // Join fields
      entryDate: db.journal_entries?.date?.toISOString(),
      entryAccountId: db.journal_entries?.account_id,
    };
  }

  /**
   * Gets reviews for a mentee
   */
  async getByMenteeId(menteeId: string): Promise<{ data: MentorReview[] | null; error?: Error }> {
    try {
      const result = await prisma.mentor_reviews.findMany({
        where: { mentee_id: menteeId },
        include: {
          journal_entries: {
            select: {
              date: true,
              account_id: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      return { data: result.map((r) => this.mapToDomain(r as ReviewWithJournal)) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets reviews for a specific trade
   */
  async getByTradeId(tradeId: string): Promise<{ data: MentorReview[] | null; error?: Error }> {
    try {
      const result = await prisma.mentor_reviews.findMany({
        where: { trade_id: tradeId },
        include: {
          journal_entries: {
            select: {
              date: true,
              account_id: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
      });
      return { data: result.map((r) => this.mapToDomain(r as ReviewWithJournal)) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets reviews for a specific journal entry
   */
  async getByJournalEntryId(
    journalEntryId: string
  ): Promise<{ data: MentorReview[] | null; error?: Error }> {
    try {
      const result = await prisma.mentor_reviews.findMany({
        where: { journal_entry_id: journalEntryId },
        include: {
          journal_entries: {
            select: {
              date: true,
              account_id: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
      });
      return { data: result.map((r) => this.mapToDomain(r as ReviewWithJournal)) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets reviews for items in context (trades/journal entries)
   */
  async getByContext(
    userId: string,
    tradeIds: string[],
    journalEntryIds: string[]
  ): Promise<{ data: MentorReview[] | null; error?: Error }> {
    try {
      if (tradeIds.length === 0 && journalEntryIds.length === 0) {
        return { data: [] };
      }

      const result = await prisma.mentor_reviews.findMany({
        where: {
          mentee_id: userId,
          OR: [{ trade_id: { in: tradeIds } }, { journal_entry_id: { in: journalEntryIds } }],
        },
        include: {
          journal_entries: {
            select: {
              date: true,
              account_id: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: result.map((r: any) => this.mapToDomain(r as ReviewWithJournal)) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Creates a new review
   */
  async create(
    data: Omit<MentorReview, "id" | "createdAt" | "updatedAt" | "isRead">
  ): Promise<{ data: MentorReview | null; error?: Error }> {
    try {
      const result = await prisma.mentor_reviews.create({
        data: {
          mentor_id: data.mentorId,
          mentee_id: data.menteeId,
          trade_id: data.tradeId || null,
          journal_entry_id: data.journalEntryId || null,
          review_type: data.reviewType,
          content: data.content,
          rating: data.rating || null,
          is_read: false,
        },
        include: {
          journal_entries: {
            select: {
              date: true,
              account_id: true,
            },
          },
        },
      });
      return { data: this.mapToDomain(result as ReviewWithJournal) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Updates review content
   */
  async updateContent(id: string, content: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await prisma.mentor_reviews.update({
        where: { id },
        data: {
          content,
          updated_at: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Deletes a review
   */
  async delete(id: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await prisma.mentor_reviews.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Marks review as read
   */
  async markAsRead(id: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await prisma.mentor_reviews.update({
        where: { id },
        data: { is_read: true },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Counts unread reviews for a user
   */
  async getUnreadCount(userId: string): Promise<{ data: number; error?: Error }> {
    try {
      const count = await prisma.mentor_reviews.count({
        where: {
          mentee_id: userId,
          is_read: false,
        },
      });
      return { data: count };
    } catch (error) {
      return { data: 0, error: error as Error };
    }
  }
}

export const prismaReviewRepo = new PrismaReviewRepository();
