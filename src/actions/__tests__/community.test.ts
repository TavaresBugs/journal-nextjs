import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  joinLeaderboardAction,
  getLeaderboardAction,
  sharePlaybookAction,
  togglePlaybookStarAction,
} from "../../app/actions/community";
import { prismaCommunityRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";

// Mock Repositories
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth");

// Mock Prisma
const mockPrismaFunctions = vi.hoisted(() => ({
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  profiles: { findMany: vi.fn() },
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    $executeRaw: mockPrismaFunctions.$executeRaw,
    $queryRaw: mockPrismaFunctions.$queryRaw,
    profiles: { findMany: mockPrismaFunctions.profiles.findMany },
  },
}));

describe("Community Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("joinLeaderboardAction", () => {
    it("should join leaderboard", async () => {
      (prismaCommunityRepo.joinLeaderboard as Mock).mockResolvedValue({
        data: { userId: mockUserId },
        error: null,
      });

      const result = await joinLeaderboardAction("Trader1");

      expect(prismaCommunityRepo.joinLeaderboard).toHaveBeenCalledWith(
        mockUserId,
        "Trader1",
        undefined
      );
      expect(result.success).toBe(true);
    });

    it("should fail if not authenticated", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);

      const result = await joinLeaderboardAction("Trader1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });
  });

  describe("getLeaderboardAction", () => {
    it("should return leaderboard entries", async () => {
      // Mock view execution
      mockPrismaFunctions.$executeRaw.mockResolvedValue(0);

      // Mock query result
      mockPrismaFunctions.$queryRaw.mockResolvedValue([
        {
          user_id: "user-1",
          display_name: "Trader1",
          total_trades: 10,
          win_rate: 60,
          total_pnl: 1000,
        },
      ]);

      // Mock profiles
      mockPrismaFunctions.profiles.findMany.mockResolvedValue([
        { id: "user-1", display_name: "Trader1", avatar_url: "avatar.jpg" },
      ]);

      const result = await getLeaderboardAction();

      expect(mockPrismaFunctions.$executeRaw).toHaveBeenCalled();
      expect(mockPrismaFunctions.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-1");
      expect(result[0].displayName).toBe("Trader1");
    });
  });

  describe("sharePlaybookAction", () => {
    it("should share playbook", async () => {
      (prismaCommunityRepo.sharePlaybook as Mock).mockResolvedValue({
        data: { id: "shared-1" },
        error: null,
      });

      const result = await sharePlaybookAction("pb-1", "desc");

      expect(prismaCommunityRepo.sharePlaybook).toHaveBeenCalledWith(mockUserId, "pb-1", "desc");
      expect(result.success).toBe(true);
    });
  });

  describe("togglePlaybookStarAction", () => {
    it("should toggle star", async () => {
      (prismaCommunityRepo.togglePlaybookStar as Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await togglePlaybookStarAction("shared-1");

      expect(prismaCommunityRepo.togglePlaybookStar).toHaveBeenCalledWith("shared-1", mockUserId);
      expect(result.success).toBe(true);
      expect(result.isStarred).toBe(true);
    });
  });
});
