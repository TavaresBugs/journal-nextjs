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

  describe("getMyLeaderboardStatus", () => {
    it("should return status if exists", async () => {
      mockPrisma.leaderboard_opt_in.findUnique.mockResolvedValue({ user_id: "u-1" });
      const result = await prismaCommunityRepo.getMyLeaderboardStatus("u-1");
      expect(result.data?.userId).toBe("u-1");
    });

    it("should return null if not found", async () => {
      mockPrisma.leaderboard_opt_in.findUnique.mockResolvedValue(null);
      const result = await prismaCommunityRepo.getMyLeaderboardStatus("u-1");
      expect(result.data).toBeNull();
    });
  });

  describe("joinLeaderboard", () => {
    it("should join leaderboard", async () => {
      const mockOptIn = createMockData.leaderboardOptIn({ display_name: "Trader One" });
      mockPrisma.leaderboard_opt_in.create.mockResolvedValue(mockOptIn);

      const result = await prismaCommunityRepo.joinLeaderboard("user-123", "Trader One", {
        showWinRate: true,
      });

      expect(mockPrisma.leaderboard_opt_in.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: "user-123",
            display_name: "Trader One",
          }),
        })
      );
      expect(result.data?.displayName).toBe("Trader One");
    });
  });

  describe("leaveLeaderboard", () => {
    it("should leave leaderboard", async () => {
      mockPrisma.leaderboard_opt_in.delete.mockResolvedValue({});
      const result = await prismaCommunityRepo.leaveLeaderboard("u-1");
      expect(result.data).toBe(true);
    });
  });

  describe("updateLeaderboardPreferences", () => {
    it("should update preferences", async () => {
      mockPrisma.leaderboard_opt_in.update.mockResolvedValue({ display_name: "New Name" });
      const result = await prismaCommunityRepo.updateLeaderboardPreferences("u-1", {
        displayName: "New Name",
      });
      expect(result.data?.displayName).toBe("New Name");
    });
  });

  describe("getLeaderboardOptIns", () => {
    it("should return all opt-ins", async () => {
      mockPrisma.leaderboard_opt_in.findMany.mockResolvedValue([{ user_id: "u-1" }]);
      const result = await prismaCommunityRepo.getLeaderboardOptIns();
      expect(result.data).toHaveLength(1);
    });
  });

  describe("sharePlaybook", () => {
    it("should share a playbook (create)", async () => {
      const mockShared = createMockData.sharedPlaybook();
      mockPrisma.shared_playbooks.findUnique.mockResolvedValue(null);
      mockPrisma.shared_playbooks.create.mockResolvedValue(mockShared);

      const result = await prismaCommunityRepo.sharePlaybook("user-123", "pb-123", "Best Strategy");

      expect(mockPrisma.shared_playbooks.create).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it("should update if already shared", async () => {
      mockPrisma.shared_playbooks.findUnique.mockResolvedValue({ id: "s-1" });
      mockPrisma.shared_playbooks.update.mockResolvedValue({ id: "s-1", description: "Updated" });
      const result = await prismaCommunityRepo.sharePlaybook("u-1", "pb-1", "Updated");
      expect(result.data?.description).toBe("Updated");
    });
  });

  describe("unsharePlaybook", () => {
    it("should unshare a playbook (set is_public false)", async () => {
      mockPrisma.shared_playbooks.update.mockResolvedValue({ is_public: false });
      const result = await prismaCommunityRepo.unsharePlaybook("pb-123", "user-123");
      expect(result.data).toBe(true);
    });
  });

  describe("getPublicPlaybooks", () => {
    it("should return public playbooks with stats", async () => {
      // Mock playbooks
      mockPrisma.shared_playbooks.findMany.mockResolvedValue([
        {
          id: "s-1",
          user_id: "u-1",
          playbooks: { name: "Strategy A" },
          users: { profiles: { display_name: "Author" } },
        },
      ]);

      // Mock trades for stats
      mockPrisma.trades.findMany.mockResolvedValue([
        {
          user_id: "u-1",
          strategy: "Strategy A",
          outcome: "win",
          pnl: 100,
          r_multiple: 2,
          entry_date: new Date(),
          exit_date: new Date(),
          symbol: "EURUSD",
        },
      ]);

      const result = await prismaCommunityRepo.getPublicPlaybooks();

      expect(result.data).toHaveLength(1);
      const pb = result.data?.[0];
      // @ts-expect-error - Runtime extension
      expect(pb?.authorStats?.totalTrades).toBe(1);
      // @ts-expect-error - Runtime extension
      expect(pb?.authorStats?.winRate).toBe(100);
      // @ts-expect-error - Runtime extension
      expect(pb?.authorStats?.netPnl).toBe(100);
    });
  });

  describe("getMySharedPlaybooks", () => {
    it("should return shares", async () => {
      mockPrisma.shared_playbooks.findMany.mockResolvedValue([]);
      const result = await prismaCommunityRepo.getMySharedPlaybooks("u-1");
      expect(result.data).toHaveLength(0);
    });
  });

  describe("togglePlaybookStar", () => {
    it("should add star if not starred", async () => {
      mockPrisma.playbook_stars.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]); // create, update
      const result = await prismaCommunityRepo.togglePlaybookStar("shared-123", "user-123");
      expect(result.data).toBe(true); // Starred
    });

    it("should remove star if already starred", async () => {
      mockPrisma.playbook_stars.findUnique.mockResolvedValue({ id: "star-1" });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);
      const result = await prismaCommunityRepo.togglePlaybookStar("shared-123", "user-123");
      expect(result.data).toBe(false); // Unstarred
    });
  });

  describe("incrementPlaybookDownloads", () => {
    it("should increment", async () => {
      mockPrisma.shared_playbooks.update.mockResolvedValue({});
      const result = await prismaCommunityRepo.incrementPlaybookDownloads("s-1");
      expect(result.data).toBe(true);
    });
  });
});
