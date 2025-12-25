import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  isMentorAction,
  inviteMenteeAction,
  getMenteeTradesAction,
  acceptInviteAction,
  addTradeCommentAction,
} from "../../app/actions/mentor";
import { prismaMentorRepo, prismaAdminRepo, prismaTradeRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { createClient } from "@/lib/supabase/server";

// Mock Repositories
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/cache/mentorPermissionCache", () => ({
  getCachedPermissions: vi.fn(),
  setCachedPermissions: vi.fn(),
}));

// Mock Prisma calls used directly in some actions
const mockPrismaFunctions = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    journal_entries: { findMany: mockPrismaFunctions.findMany },
    daily_routines: { findFirst: mockPrismaFunctions.findFirst },
  },
}));

describe("Mentor Actions", () => {
  const mockUserId = "user-123";
  const mockMenteeId = "mentee-456";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("isMentorAction", () => {
    it("should return true if user has mentor role", async () => {
      (prismaAdminRepo.getUserExtended as Mock).mockResolvedValue({
        data: { role: "mentor" },
        error: null,
      });

      const result = await isMentorAction();
      expect(result).toBe(true);
    });

    it("should return true if user has mentees", async () => {
      (prismaAdminRepo.getUserExtended as Mock).mockResolvedValue({
        data: { role: "user" },
        error: null,
      });
      (prismaMentorRepo.getMentees as Mock).mockResolvedValue({
        data: [{ id: "invite-1" }],
        error: null,
      });

      const result = await isMentorAction();
      expect(result).toBe(true);
    });

    it("should return false otherwise", async () => {
      (prismaAdminRepo.getUserExtended as Mock).mockResolvedValue({
        data: { role: "user" },
        error: null,
      });
      (prismaMentorRepo.getMentees as Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await isMentorAction();
      expect(result).toBe(false);
    });
  });

  describe("inviteMenteeAction", () => {
    it("should create invite successfully", async () => {
      const mockUser = { id: mockUserId, email: "mentor@test.com" };
      (createClient as Mock).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      });

      (prismaMentorRepo.createInvite as Mock).mockResolvedValue({
        data: { id: "invite-1", status: "pending" },
        error: null,
      });

      const result = await inviteMenteeAction("mentee@test.com", "view");

      expect(prismaMentorRepo.createInvite).toHaveBeenCalledWith(
        mockUserId,
        "mentor@test.com",
        "mentee@test.com",
        "view"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("acceptInviteAction", () => {
    it("should accept invite", async () => {
      (prismaMentorRepo.acceptInvite as Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await acceptInviteAction("token-123");

      expect(prismaMentorRepo.acceptInvite).toHaveBeenCalledWith("token-123", mockUserId);
      expect(result.success).toBe(true);
    });
  });

  describe("getMenteeTradesAction", () => {
    it("should return trades for permitted accounts", async () => {
      // Mock getMentees for permission check (fallback if cache miss)
      (prismaMentorRepo.getMentees as Mock).mockResolvedValue({
        data: [{ id: "invite-1", menteeId: mockMenteeId }],
        error: null,
      });

      // Mock permissions
      (prismaMentorRepo.getAccountPermissions as Mock).mockResolvedValue({
        data: [{ accountId: "acc-1", canViewTrades: true }],
        error: null,
      });

      // Mock trades repo
      (prismaTradeRepo.getByUserId as Mock).mockResolvedValue({
        data: [{ id: "trade-1" }],
        error: null,
      });

      const result = await getMenteeTradesAction(mockMenteeId);

      expect(prismaTradeRepo.getByUserId).toHaveBeenCalledWith(
        mockMenteeId,
        expect.objectContaining({
          accountIds: ["acc-1"],
        })
      );
      expect(result).toHaveLength(1);
    });

    it("should return empty if no permitted accounts", async () => {
      (prismaMentorRepo.getMentees as Mock).mockResolvedValue({
        data: [{ id: "invite-1", menteeId: mockMenteeId }],
        error: null,
      });
      (prismaMentorRepo.getAccountPermissions as Mock).mockResolvedValue({
        data: [], // No permissions
        error: null,
      });

      const result = await getMenteeTradesAction(mockMenteeId);

      expect(result).toEqual([]);
      expect(prismaTradeRepo.getByUserId).not.toHaveBeenCalled();
    });
  });

  describe("addTradeCommentAction", () => {
    it("should add comment", async () => {
      (prismaMentorRepo.addTradeComment as Mock).mockResolvedValue({
        data: { id: "comment-1" },
        error: null,
      });

      const result = await addTradeCommentAction("trade-1", "Nice trade");

      expect(prismaMentorRepo.addTradeComment).toHaveBeenCalledWith(
        "trade-1",
        mockUserId,
        "Nice trade"
      );
      expect(result.success).toBe(true);
    });
  });
});
