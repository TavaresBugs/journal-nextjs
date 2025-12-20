/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsForMentee,
  getMyReviews,
  getReviewsForTrade,
  getReviewsForJournalEntry,
  getReviewsForContext,
  markReviewAsRead,
  getUnreadReviewCount,
} from "@/services/journal/review";
import { supabase } from "@/lib/supabase";

// Mock do supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe("Review Service", () => {
  const mockUser = { id: "user-1", email: "test@example.com" };
  const mockDate = "2025-12-19T10:00:00Z";

  const mockReviewDB = {
    id: "review-1",
    mentor_id: "mentor-1",
    mentee_id: "mentee-1",
    trade_id: "trade-1",
    journal_entry_id: null,
    review_type: "correction",
    content: "Good trade",
    rating: 5,
    is_read: false,
    created_at: mockDate,
    updated_at: mockDate,
    journal_entries: {
      date: "2025-12-01",
      account_id: "acc-1",
    },
  };

  const mockReview = {
    id: "review-1",
    mentorId: "mentor-1",
    menteeId: "mentee-1",
    tradeId: "trade-1",
    journalEntryId: undefined,
    reviewType: "correction",
    content: "Good trade",
    rating: 5,
    isRead: false,
    createdAt: mockDate,
    updatedAt: mockDate,
    entryDate: "2025-12-01",
    entryAccountId: "acc-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReview", () => {
    it("should create a review successfully", async () => {
      // Mock auth
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      // Mock DB insert
      const insertMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({ data: mockReviewDB, error: null });

      (supabase.from as any).mockReturnValue({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      });

      const input = {
        mentorId: mockUser.id, // Not used in input directly, taken from auth
        menteeId: "mentee-1",
        tradeId: "trade-1",
        reviewType: "correction" as const,
        content: "Good trade",
        rating: 5,
      };

      const result = await createReview(input);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("mentor_reviews");
      expect(insertMock).toHaveBeenCalledWith({
        mentor_id: mockUser.id,
        mentee_id: input.menteeId,
        trade_id: input.tradeId,
        journal_entry_id: undefined,
        review_type: input.reviewType,
        content: input.content,
        rating: input.rating,
        is_read: false,
      });
      expect(result).toEqual(mockReview);
    });

    it("should return null if not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      const result = await createReview({
        menteeId: "mentee-1",
        reviewType: "comment",
        content: "test",
      } as any);

      expect(result).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should return null on DB error", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const insertMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } });

      (supabase.from as any).mockReturnValue({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      });

      const result = await createReview({
        menteeId: "mentee-1",
        reviewType: "comment",
        content: "test",
      } as any);

      expect(result).toBeNull();
    });
  });

  describe("updateReview", () => {
    it("should update a review successfully", async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await updateReview("review-1", "Updated content");

      expect(updateMock).toHaveBeenCalledWith({
        content: "Updated content",
        updated_at: expect.any(String),
      });
      expect(eqMock).toHaveBeenCalledWith("id", "review-1");
      expect(result).toBe(true);
    });

    it("should return false on DB error", async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await updateReview("review-1", "Updated content");
      expect(result).toBe(false);
    });
  });

  describe("deleteReview", () => {
    it("should delete a review successfully", async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      });

      const result = await deleteReview("review-1");

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith("id", "review-1");
      expect(result).toBe(true);
    });

    it("should return false on DB error", async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      });

      const result = await deleteReview("review-1");
      expect(result).toBe(false);
    });
  });

  describe("getReviewsForMentee", () => {
    it("should return reviews for a mentee", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: [mockReviewDB], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForMentee("mentee-1");

      expect(selectMock).toHaveBeenCalledWith("*");
      expect(eqMock).toHaveBeenCalledWith("mentee_id", "mentee-1");
      expect(result).toEqual([mockReview]);
    });

    it("should return empty array on invalid data or error", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForMentee("mentee-1");
      expect(result).toEqual([]);
    });
  });

  describe("getMyReviews", () => {
    it("should return reviews for the authenticated user", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: [mockReviewDB], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getMyReviews();

      expect(selectMock).toHaveBeenCalledWith("*, journal_entries(date, account_id)");
      expect(eqMock).toHaveBeenCalledWith("mentee_id", mockUser.id);
      expect(result).toEqual([mockReview]);
    });

    it("should return empty array if not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
      const result = await getMyReviews();
      expect(result).toEqual([]);
    });

    it("should return empty array on DB error", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getMyReviews();
      expect(result).toEqual([]);
    });
  });

  describe("getReviewsForTrade", () => {
    it("should return reviews for a trade", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: [mockReviewDB], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForTrade("trade-1");

      expect(eqMock).toHaveBeenCalledWith("trade_id", "trade-1");
      expect(result).toEqual([mockReview]);
    });

    it("should handle errors", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForTrade("trade-1");
      expect(result).toEqual([]);
    });
  });

  describe("getReviewsForJournalEntry", () => {
    it("should return reviews for a journal entry", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: [mockReviewDB], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForJournalEntry("entry-1");

      expect(eqMock).toHaveBeenCalledWith("journal_entry_id", "entry-1");
      expect(result).toEqual([mockReview]);
    });

    it("should handle errors", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getReviewsForJournalEntry("entry-1");
      expect(result).toEqual([]);
    });
  });

  describe("getReviewsForContext", () => {
    it("should return reviews for mixed context", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orMock = vi.fn().mockResolvedValue({ data: [mockReviewDB], error: null });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        or: orMock,
      });

      const result = await getReviewsForContext(["trade-1"], ["entry-1"]);

      expect(eqMock).toHaveBeenCalledWith("mentee_id", mockUser.id);
      expect(orMock).toHaveBeenCalledWith("trade_id.in.(trade-1),journal_entry_id.in.(entry-1)");
      expect(result).toEqual([mockReview]);
    });

    it("should return empty array if not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
      const result = await getReviewsForContext([], []);
      expect(result).toEqual([]);
    });

    it("should return empty array if no context provided", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();

      // Mock chain
      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
      });

      const result = await getReviewsForContext([], []);
      expect(result).toEqual([]);
      // Should not call or() or await result
    });

    it("should handle errors", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        or: orMock,
      });

      const result = await getReviewsForContext(["trade-1"], []);
      expect(result).toEqual([]);
    });
  });

  describe("markReviewAsRead", () => {
    it("should mark review as read", async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await markReviewAsRead("review-1");

      expect(updateMock).toHaveBeenCalledWith({ is_read: true });
      expect(eqMock).toHaveBeenCalledWith("id", "review-1");
      expect(result).toBe(true);
    });

    it("should handle error", async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: { message: "Error" } });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await markReviewAsRead("review-1");
      expect(result).toBe(false);
    });
  });

  describe("getUnreadReviewCount", () => {
    it("should return unread count", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      // Second eq
      const eqMock2 = vi.fn().mockResolvedValue({ count: 5, error: null });

      eqMock.mockReturnValue({ eq: eqMock2 });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
      });

      const result = await getUnreadReviewCount();

      expect(selectMock).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(eqMock).toHaveBeenCalledWith("mentee_id", mockUser.id);
      expect(eqMock2).toHaveBeenCalledWith("is_read", false);
      expect(result).toBe(5);
    });

    it("should return 0 if not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
      const result = await getUnreadReviewCount();
      expect(result).toBe(0);
    });

    it("should return 0 on error", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const selectMock = vi.fn().mockReturnThis();
      // Setup chain for failure
      const eqMock = vi.fn().mockReturnThis();
      const eqMock2 = vi.fn().mockResolvedValue({ count: null, error: { message: "Error" } });

      eqMock.mockReturnValue({ eq: eqMock2 });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        eq: eqMock,
      });

      const result = await getUnreadReviewCount();
      expect(result).toBe(0);
    });
  });
});
