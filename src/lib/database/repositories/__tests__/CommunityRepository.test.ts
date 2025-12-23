import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaCommunityRepo } from "../index";

describe("PrismaCommunityRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("joinLeaderboard", () => {
    it("should join leaderboard", async () => {
      const mockOptIn = createMockData.leaderboardOptIn({ display_name: "Trader One" });
      mockPrisma.leaderboard_opt_in.create.mockResolvedValue(mockOptIn);

      const result = await prismaCommunityRepo.joinLeaderboard("user-123", "Trader One", {
        showWinRate: true,
      });

      expect(mockPrisma.leaderboard_opt_in.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: "user-123",
          display_name: "Trader One",
          show_win_rate: true,
        }),
      });
      expect(result.data?.displayName).toBe("Trader One");
    });
  });

  describe("sharePlaybook", () => {
    it("should share a playbook", async () => {
      const mockShared = createMockData.sharedPlaybook();

      // Usually fetches playbook first to get info? Repository logic:
      // data: title/desc from args or playbook?
      // Assumption: Repository takes playbookId and args. May check ownership.

      // Let's verify implementation assumption:
      // sharePlaybook(userId, playbookId, description?)
      // It likely creates shared_playbooks entry.

      mockPrisma.shared_playbooks.create.mockResolvedValue(mockShared);

      const result = await prismaCommunityRepo.sharePlaybook("user-123", "pb-123", "Best Strategy");

      expect(mockPrisma.shared_playbooks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: "user-123",
            playbook_id: "pb-123",
            description: "Best Strategy",
          }),
        })
      );
      expect(result.data).toBeDefined();
    });
  });

  describe("unsharePlaybook", () => {
    it("should unshare a playbook (set is_public false)", async () => {
      mockPrisma.shared_playbooks.update.mockResolvedValue({ is_public: false });

      const result = await prismaCommunityRepo.unsharePlaybook("pb-123", "user-123");

      expect(mockPrisma.shared_playbooks.update).toHaveBeenCalledWith({
        where: { playbook_id: "pb-123", user_id: "user-123" },
        data: expect.objectContaining({ is_public: false }),
      });
      expect(result.data).toBe(true);
    });
  });

  describe("togglePlaybookStar", () => {
    it("should add star if not starred", async () => {
      mockPrisma.playbook_stars.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockResolvedValue([{}, {}]); // create, update

      const result = await prismaCommunityRepo.togglePlaybookStar("shared-123", "user-123");

      expect(mockPrisma.playbook_stars.findUnique).toHaveBeenCalled(); // checks status
      expect(mockPrisma.$transaction).toHaveBeenCalled(); // executes create + update

      // Check create call inside transaction?
      // Since transaction is mocked to return array/run callback, and here implementation passes array of promises:
      // await prisma.$transaction([ prisma.playbook_stars.create(...), ... ])
      // My mock $transaction handles function but if array is passed it returns Promise.all(fn).
      // But verify `prisma.playbook_stars.create` was called?
      // Yes, because `prisma.playbook_stars.create(...)` acts as a promise creator immediately if not deferred.
      // Wait, `prisma.playbook_stars.create(...)` returns a PrismaPromise.
      // My mock returns `mockResolvedValue`. So it executes immediately when called?
      // Yes. So verifying the call is correct.

      expect(mockPrisma.playbook_stars.create).toHaveBeenCalledWith({
        data: { user_id: "user-123", shared_playbook_id: "shared-123" },
      });
      expect(mockPrisma.shared_playbooks.update).toHaveBeenCalledWith({
        where: { id: "shared-123" },
        data: { stars: { increment: 1 } },
      });

      expect(result.data).toBe(true); // Starred
    });

    it("should remove star if already starred", async () => {
      mockPrisma.playbook_stars.findUnique.mockResolvedValue({ id: "star-1" });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await prismaCommunityRepo.togglePlaybookStar("shared-123", "user-123");

      expect(mockPrisma.playbook_stars.delete).toHaveBeenCalled();
      expect(mockPrisma.shared_playbooks.update).toHaveBeenCalledWith({
        where: { id: "shared-123" },
        data: { stars: { decrement: 1 } },
      });

      expect(result.data).toBe(false); // Unstarred
    });
  });
});
