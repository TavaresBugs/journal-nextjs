/**
 * Prisma Share Repository
 *
 * Type-safe implementation of ShareRepository using Prisma ORM.
 * Handles shared journal links.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { shared_journals as PrismaSharedJournal } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";

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

class PrismaShareRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaShareRepository";

  /**
   * Create a share link for a journal entry.
   * If a valid (non-expired) link exists, reuse it.
   */
  async createShareLink(
    userId: string,
    journalEntryId: string,
    expirationDays = 3
  ): Promise<Result<SharedJournal, AppError>> {
    return this.withQuery(
      "createShareLink",
      async () => {
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
          return mapSharedJournalFromPrisma(existing);
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

        return mapSharedJournalFromPrisma(created);
      },
      { userId, journalEntryId }
    );
  }

  /**
   * Get a shared journal by token.
   */
  async getByToken(token: string): Promise<Result<SharedJournal | null, AppError>> {
    return this.withQuery("getByToken", async () => {
      const shared = await prisma.shared_journals.findUnique({
        where: { share_token: token },
      });

      if (!shared) {
        return null;
      }

      // Check if expired
      if (new Date() > shared.expires_at) {
        throw new AppError("Share link has expired", ErrorCode.VALIDATION_ERROR, 410);
      }

      return mapSharedJournalFromPrisma(shared);
    });
  }

  /**
   * Increment view count for a shared journal.
   */
  async incrementViewCount(token: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("incrementViewCount", async () => {
      await prisma.shared_journals.update({
        where: { share_token: token },
        data: { view_count: { increment: 1 } },
      });
      return true;
    });
  }

  /**
   * Delete a share link.
   */
  async deleteShareLink(shareId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteShareLink",
      async () => {
        await prisma.shared_journals.delete({
          where: { id: shareId, user_id: userId },
        });
        return true;
      },
      { shareId }
    );
  }

  /**
   * Get all shared journals for a user.
   */
  async getUserSharedJournals(userId: string): Promise<Result<SharedJournal[], AppError>> {
    return this.withQuery(
      "getUserSharedJournals",
      async () => {
        const shares = await prisma.shared_journals.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
        return shares.map(mapSharedJournalFromPrisma);
      },
      { userId }
    );
  }
}

// Export singleton instance
export const prismaShareRepo = new PrismaShareRepository();
export { PrismaShareRepository };
