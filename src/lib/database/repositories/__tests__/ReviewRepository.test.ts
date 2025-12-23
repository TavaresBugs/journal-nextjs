/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaReviewRepo } from "../index";

describe("PrismaReviewRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("create", () => {
    it("should create a new review", async () => {
      const mockReview = createMockData.mentorReview();
      mockPrisma.mentor_reviews.create.mockResolvedValue(mockReview);

      const input = {
        mentorId: "mentor-123",
        menteeId: "mentee-123",
        rating: 5,
        content: "Great job",
        reviewType: "trade",
        tradeId: "trade-123",
      };

      const result = await prismaReviewRepo.create(input as any);

      expect(mockPrisma.mentor_reviews.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            users_mentor_reviews_mentor_idTousers: { connect: { id: "mentor-123" } },
            users_mentor_reviews_mentee_idTousers: { connect: { id: "mentee-123" } },
            trades: { connect: { id: "trade-123" } },
            rating: 5,
          }),
        })
      );
      expect(result.data).toBeDefined();
    });
  });

  describe("updateContent", () => {
    it("should update review content", async () => {
      const mockReview = createMockData.mentorReview({ content: "Updated content" });
      mockPrisma.mentor_reviews.update.mockResolvedValue(mockReview);

      const result = await prismaReviewRepo.updateContent("review-123", "Updated content");

      expect(mockPrisma.mentor_reviews.update).toHaveBeenCalledWith({
        where: { id: "review-123" },
        data: expect.objectContaining({ content: "Updated content" }),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a review", async () => {
      mockPrisma.mentor_reviews.delete.mockResolvedValue({ id: "review-123" });

      const result = await prismaReviewRepo.delete("review-123");

      expect(mockPrisma.mentor_reviews.delete).toHaveBeenCalledWith({
        where: { id: "review-123" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getByMenteeId", () => {
    it("should return reviews for a mentee", async () => {
      const mockReviews = [createMockData.mentorReview()];
      mockPrisma.mentor_reviews.findMany.mockResolvedValue(mockReviews);

      const result = await prismaReviewRepo.getByMenteeId("mentee-123");

      expect(mockPrisma.mentor_reviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mentee_id: "mentee-123" },
          orderBy: { created_at: "desc" },
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });
});
