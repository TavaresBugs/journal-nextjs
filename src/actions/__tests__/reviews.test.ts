import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  createReviewAction,
  updateReviewAction,
  deleteReviewAction,
  getReviewsForMenteeAction,
  getMyReviewsAction,
  getReviewsForTradeAction,
  getReviewsForJournalEntryAction,
  markReviewAsReadAction,
  getUnreadReviewCountAction,
  getReviewsForContextAction,
} from "../../app/actions/reviews";
import { prismaReviewRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
// import { revalidatePath } from "next/cache";

vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => fn,
}));

describe("Review Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("createReviewAction", () => {
    it("should create review", async () => {
      (prismaReviewRepo.create as Mock).mockResolvedValue({
        data: { id: "review-1" },
        error: null,
      });

      const result = await createReviewAction({
        menteeId: "mentee-1",
        content: "Good job",
        reviewType: "correction",
      });
      expect(result.success).toBe(true);
    });

    it("should fail if no auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await createReviewAction({
        menteeId: "1",
        content: "",
        reviewType: "correction",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateReviewAction", () => {
    it("should update review content", async () => {
      (prismaReviewRepo.updateContent as Mock).mockResolvedValue({ data: true, error: null });
      const result = await updateReviewAction("review-1", "New content");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteReviewAction", () => {
    it("should delete review", async () => {
      (prismaReviewRepo.delete as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deleteReviewAction("review-1");
      expect(result.success).toBe(true);
    });
  });

  describe("Getters", () => {
    it("should get reviews for mentee", async () => {
      (prismaReviewRepo.getByMenteeId as Mock).mockResolvedValue({ data: [], error: null });
      await getReviewsForMenteeAction("mentee-1");
      expect(prismaReviewRepo.getByMenteeId).toHaveBeenCalledWith("mentee-1");
    });

    it("should return empty if error for mentee", async () => {
      (prismaReviewRepo.getByMenteeId as Mock).mockResolvedValue({
        data: null,
        error: { message: "Err" },
      });
      const result = await getReviewsForMenteeAction("mentee-1");
      expect(result).toEqual([]);
    });

    it("should get my reviews", async () => {
      (prismaReviewRepo.getByMenteeId as Mock).mockResolvedValue({ data: [], error: null });
      await getMyReviewsAction();
      expect(prismaReviewRepo.getByMenteeId).toHaveBeenCalledWith(mockUserId);
    });

    it("should fail get my reviews auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getMyReviewsAction();
      expect(result).toEqual([]);
    });

    it("should get reviews for trade", async () => {
      (prismaReviewRepo.getByTradeId as Mock).mockResolvedValue({ data: [], error: null });
      await getReviewsForTradeAction("t-1");
      expect(prismaReviewRepo.getByTradeId).toHaveBeenCalledWith("t-1");
    });

    it("should get reviews for journal", async () => {
      (prismaReviewRepo.getByJournalEntryId as Mock).mockResolvedValue({ data: [], error: null });
      await getReviewsForJournalEntryAction("j-1");
      expect(prismaReviewRepo.getByJournalEntryId).toHaveBeenCalledWith("j-1");
    });

    it("should get reviews for context", async () => {
      (prismaReviewRepo.getByContext as Mock).mockResolvedValue({ data: [], error: null });
      await getReviewsForContextAction(["t-1"], ["j-1"]);
      expect(prismaReviewRepo.getByContext).toHaveBeenCalledWith(mockUserId, ["t-1"], ["j-1"]);
    });
  });

  describe("markReviewAsReadAction", () => {
    it("should mark as read and revalidate", async () => {
      (prismaReviewRepo.markAsRead as Mock).mockResolvedValue({ data: true, error: null });
      const result = await markReviewAsReadAction("review-1");
      expect(result.success).toBe(true);
    });
  });

  describe("getUnreadReviewCountAction", () => {
    it("should get count", async () => {
      (prismaReviewRepo.getUnreadCount as Mock).mockResolvedValue({ data: 5, error: null });
      const result = await getUnreadReviewCountAction();
      expect(result).toBe(5);
    });

    it("should return 0 fail auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getUnreadReviewCountAction();
      expect(result).toBe(0);
    });
  });
});
