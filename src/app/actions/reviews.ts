"use server";

/**
 * Review Server Actions
 *
 * Server-side actions for mentor review operations using Prisma ORM.
 * These actions run exclusively on the server and can be called from client components.
 *
 * @example
 * // In a client component
 * import { getMyReviewsAction, createReviewAction } from "@/app/actions/reviews";
 *
 * const reviews = await getMyReviewsAction();
 * const review = await createReviewAction(reviewData);
 */

import { prismaReviewRepo, MentorReview } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { revalidatePath } from "next/cache";

/**
 * Create a new review (correction/comment) from the current user as mentor.
 */
export async function createReviewAction(
  data: Omit<MentorReview, "id" | "createdAt" | "updatedAt" | "isRead" | "mentorId">
): Promise<{ success: boolean; review?: MentorReview; error?: string }> {
  try {
    const mentorId = await getCurrentUserId();
    if (!mentorId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaReviewRepo.create({
      menteeId: data.menteeId,
      tradeId: data.tradeId,
      journalEntryId: data.journalEntryId,
      reviewType: data.reviewType,
      content: data.content,
      rating: data.rating,
      mentorId,
    });

    if (result.error) {
      console.error("[createReviewAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, review: result.data || undefined };
  } catch (error) {
    console.error("[createReviewAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update a review's content.
 */
export async function updateReviewAction(
  reviewId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaReviewRepo.updateContent(reviewId, content);

    if (result.error) {
      console.error("[updateReviewAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateReviewAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete a review.
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaReviewRepo.delete(reviewId);

    if (result.error) {
      console.error("[deleteReviewAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteReviewAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get all reviews for a specific mentee (used by mentors).
 */
export async function getReviewsForMenteeAction(menteeId: string): Promise<MentorReview[]> {
  try {
    const result = await prismaReviewRepo.getByMenteeId(menteeId);

    if (result.error) {
      console.error("[getReviewsForMenteeAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getReviewsForMenteeAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get all reviews received by the current user (as mentee).
 */
export async function getMyReviewsAction(): Promise<MentorReview[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaReviewRepo.getByMenteeId(userId);

    if (result.error) {
      console.error("[getMyReviewsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMyReviewsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get reviews for a specific trade.
 */
export async function getReviewsForTradeAction(tradeId: string): Promise<MentorReview[]> {
  try {
    const result = await prismaReviewRepo.getByTradeId(tradeId);

    if (result.error) {
      console.error("[getReviewsForTradeAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getReviewsForTradeAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get reviews for a specific journal entry.
 */
export async function getReviewsForJournalEntryAction(
  journalEntryId: string
): Promise<MentorReview[]> {
  try {
    const result = await prismaReviewRepo.getByJournalEntryId(journalEntryId);

    if (result.error) {
      console.error("[getReviewsForJournalEntryAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getReviewsForJournalEntryAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get reviews for multiple trades and journal entries (batch loading).
 */
export async function getReviewsForContextAction(
  tradeIds: string[],
  journalEntryIds: string[]
): Promise<MentorReview[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaReviewRepo.getByContext(userId, tradeIds, journalEntryIds);

    if (result.error) {
      console.error("[getReviewsForContextAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getReviewsForContextAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Mark a review as read.
 */
export async function markReviewAsReadAction(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaReviewRepo.markAsRead(reviewId);

    if (result.error) {
      console.error("[markReviewAsReadAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate to update unread counts
    revalidatePath("/mentor", "page");

    return { success: true };
  } catch (error) {
    console.error("[markReviewAsReadAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get count of unread reviews for the current user.
 */
export async function getUnreadReviewCountAction(): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    const result = await prismaReviewRepo.getUnreadCount(userId);

    if (result.error) {
      console.error("[getUnreadReviewCountAction] Error:", result.error);
      return 0;
    }

    return result.data || 0;
  } catch (error) {
    console.error("[getUnreadReviewCountAction] Unexpected error:", error);
    return 0;
  }
}
