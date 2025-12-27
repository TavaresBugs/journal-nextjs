import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaMentorRepo } from "../index";

describe("PrismaMentorRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getSentInvites", () => {
    it("should return sent invites", async () => {
      mockPrisma.mentor_invites.findMany.mockResolvedValue([{ id: "inv-1", mentor_id: "m-1" }]);
      const result = await prismaMentorRepo.getSentInvites("m-1");
      expect(result.data).toHaveLength(1);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getSentInvites("m-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getReceivedInvites", () => {
    it("should return received invites", async () => {
      mockPrisma.mentor_invites.findMany.mockResolvedValue([
        { id: "inv-2", mentee_email: "test@test.com" },
      ]);
      const result = await prismaMentorRepo.getReceivedInvites("test@test.com");
      expect(result.data).toHaveLength(1);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getReceivedInvites("test@test.com");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getMyMentors", () => {
    it("should return accepted mentors", async () => {
      mockPrisma.mentor_invites.findMany.mockResolvedValue([{ id: "inv-3", status: "accepted" }]);
      const result = await prismaMentorRepo.getMyMentors("mentee-1");
      expect(result.data).toHaveLength(1);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getMyMentors("mentee-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getMentees", () => {
    it("should return accepted mentees", async () => {
      mockPrisma.mentor_invites.findMany.mockResolvedValue([{ id: "inv-4", status: "accepted" }]);
      const result = await prismaMentorRepo.getMentees("mentor-1");
      expect(result.data).toHaveLength(1);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getMentees("mentor-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getMenteesOverview", () => {
    it("should return overview with stats", async () => {
      // Mock invites
      mockPrisma.mentor_invites.findMany.mockResolvedValue([
        {
          id: "inv-1",
          mentee_id: "mentee-1",
          mentor_account_permissions: [{ account_id: "acc-1", can_view_trades: true }],
          users_mentor_invites_mentee_idTousers: {
            profiles: { display_name: "Mentee 1", avatar_url: "url" },
          },
        },
      ]);

      // Mock trades
      mockPrisma.trades.findMany.mockResolvedValue([
        {
          id: "t-1",
          user_id: "mentee-1",
          account_id: "acc-1",
          outcome: "win",
          entry_date: new Date(),
        },
        {
          id: "t-2",
          user_id: "mentee-1",
          account_id: "acc-1",
          outcome: "loss",
          entry_date: new Date(),
        },
      ]);

      const result = await prismaMentorRepo.getMenteesOverview("mentor-1");

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].totalTrades).toBe(2);
      expect(result.data?.[0].winRate).toBe(50);
      expect(result.data?.[0].menteeName).toBe("Mentee 1");
      expect(result.data?.[0].menteeName).toBe("Mentee 1");
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getMenteesOverview("mentor-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("createInvite", () => {
    it("should create a new invitation", async () => {
      mockPrisma.mentor_invites.findFirst.mockResolvedValue(null);
      mockPrisma.mentor_invites.create.mockResolvedValue({
        id: "inv-new",
        invite_token: "token",
      });

      const result = await prismaMentorRepo.createInvite("m-1", "m@e.com", "t@e.com");
      expect(result.data?.id).toBe("inv-new");
    });

    it("should return existing invite", async () => {
      mockPrisma.mentor_invites.findFirst.mockResolvedValue({ id: "inv-exist" });
      const result = await prismaMentorRepo.createInvite("m-1", "m@e.com", "t@e.com");
      expect(result.data?.id).toBe("inv-exist");
      expect(mockPrisma.mentor_invites.create).not.toHaveBeenCalled();
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.findFirst.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.createInvite("m-1", "m@e.com", "t@e.com");
      expect(result.error).not.toBeNull();
    });
  });

  describe("acceptInvite", () => {
    it("should accept invite", async () => {
      mockPrisma.mentor_invites.update.mockResolvedValue({});
      const result = await prismaMentorRepo.acceptInvite("token", "mentee-1");
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.update.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.acceptInvite("token", "mentee-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("rejectInvite", () => {
    it("should reject invite", async () => {
      mockPrisma.mentor_invites.update.mockResolvedValue({});
      const result = await prismaMentorRepo.rejectInvite("inv-1");
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.update.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.rejectInvite("inv-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("revokeInvite", () => {
    it("should revoke invite", async () => {
      mockPrisma.mentor_invites.update.mockResolvedValue({});
      const result = await prismaMentorRepo.revokeInvite("inv-1");
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.update.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.revokeInvite("inv-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("updateInvite", () => {
    it("should update invite permission", async () => {
      mockPrisma.mentor_invites.update.mockResolvedValue({});
      const result = await prismaMentorRepo.updateInvite("inv-1", { permission: "full" });
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_invites.update.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.updateInvite("inv-1", { permission: "full" });
      expect(result.error).not.toBeNull();
    });
  });

  describe("getAccountPermissions", () => {
    it("should return permissions", async () => {
      mockPrisma.mentor_account_permissions.findMany.mockResolvedValue([]);
      const result = await prismaMentorRepo.getAccountPermissions("inv-1");
      expect(result.data).toEqual([]);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_account_permissions.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getAccountPermissions("inv-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("setAccountPermission", () => {
    it("should update permissions for an account", async () => {
      mockPrisma.mentor_account_permissions.upsert.mockResolvedValue({});
      const result = await prismaMentorRepo.setAccountPermission("inv-1", "acc-1", {
        canViewTrades: true,
      });
      expect(result.data).toBe(true);
    });
  });

  describe("removeAccountPermission", () => {
    it("should remove permission", async () => {
      mockPrisma.mentor_account_permissions.delete.mockResolvedValue({});
      const result = await prismaMentorRepo.removeAccountPermission("inv-1", "acc-1");
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.mentor_account_permissions.delete.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.removeAccountPermission("inv-1", "acc-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getTradeComments", () => {
    it("should return comments", async () => {
      mockPrisma.trade_comments.findMany.mockResolvedValue([]);
      const result = await prismaMentorRepo.getTradeComments("t-1");
      expect(result.data).toEqual([]);
    });

    it("should return error on failure", async () => {
      mockPrisma.trade_comments.findMany.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.getTradeComments("t-1");
      expect(result.error).not.toBeNull();
    });
  });

  describe("addTradeComment", () => {
    it("should add a comment to a trade", async () => {
      mockPrisma.trade_comments.create.mockResolvedValue({ id: "c-1", content: "Hi" });
      const result = await prismaMentorRepo.addTradeComment("t-1", "u-1", "Hi");
      expect(result.data?.id).toBe("c-1");
    });

    it("should return error on failure", async () => {
      mockPrisma.trade_comments.create.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.addTradeComment("t-1", "u-1", "Hi");
      expect(result.error).not.toBeNull();
    });
  });

  describe("deleteTradeComment", () => {
    it("should delete comment", async () => {
      mockPrisma.trade_comments.delete.mockResolvedValue({});
      const result = await prismaMentorRepo.deleteTradeComment("c-1", "u-1");
      expect(result.data).toBe(true);
    });

    it("should return error on failure", async () => {
      mockPrisma.trade_comments.delete.mockRejectedValue(new Error("Err"));
      const result = await prismaMentorRepo.deleteTradeComment("c-1", "u-1");
      expect(result.error).not.toBeNull();
    });
  });
});
