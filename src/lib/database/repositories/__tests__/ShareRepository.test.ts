import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaShareRepo } from "../index";

describe("PrismaShareRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("createShareLink", () => {
    it("should create a new share link", async () => {
      const mockShare = {
        id: "share-123",
        share_token: "token-123",
        journal_entry_id: "entry-123",
        user_id: "user-123",
        expires_at: new Date(Date.now() + 86400000),
      };
      // Returns existing?
      mockPrisma.shared_journals.findFirst.mockResolvedValue(null);
      mockPrisma.shared_journals.create.mockResolvedValue(mockShare);

      const result = await prismaShareRepo.createShareLink("entry-123", "user-123", 24);

      expect(mockPrisma.shared_journals.create).toHaveBeenCalled();
      expect(result.data?.shareToken).toBe("token-123");
      expect(result.error).toBeNull();
    });

    it("should return existing valid link", async () => {
      const existingShare = {
        id: "share-existing",
        share_token: "token-existing",
        expires_at: new Date(Date.now() + 100000),
      };
      mockPrisma.shared_journals.findFirst.mockResolvedValue(existingShare);

      const result = await prismaShareRepo.createShareLink("entry-123", "user-123", 24);

      expect(mockPrisma.shared_journals.create).not.toHaveBeenCalled();
      expect(result.data?.shareToken).toBe("token-existing");
    });
  });

  describe("getByToken", () => {
    it("should return share for valid token", async () => {
      const mockShare = {
        id: "share-123",
        journal_entry_id: "entry-123",
        expires_at: new Date(Date.now() + 100000),
        journal_entries: { id: "entry-123", title: "Shared Entry" },
        users: { name: "Sharer" },
        view_count: 0,
      };
      mockPrisma.shared_journals.findUnique.mockResolvedValue(mockShare);

      const result = await prismaShareRepo.getByToken("token-123");

      // getByToken does not increment view count automatically
      expect(result.data?.journalEntryId).toBe("entry-123");
      expect(result.error).toBeNull();
    });

    it("should return error for expired token", async () => {
      const expiredShare = {
        id: "share-123",
        expires_at: new Date(Date.now() - 100000),
      };
      mockPrisma.shared_journals.findUnique.mockResolvedValue(expiredShare);

      const result = await prismaShareRepo.getByToken("token-expired");

      expect(result.error).not.toBeNull();
    });
  });

  describe("getUserSharedJournals", () => {
    it("should return shares for a user", async () => {
      const mockShares = [
        {
          id: "share-1",
          share_token: "token-1",
          expires_at: new Date(),
          journal_entries: { date: new Date(), symbol: "EURUSD" },
          view_count: 5,
        },
      ];
      mockPrisma.shared_journals.findMany.mockResolvedValue(mockShares);

      const result = await prismaShareRepo.getUserSharedJournals("user-123");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].shareToken).toBe("token-1");
    });
  });

  describe("deleteShareLink", () => {
    it("should delete a share link", async () => {
      mockPrisma.shared_journals.delete.mockResolvedValue({ id: "share-123" });

      const result = await prismaShareRepo.deleteShareLink("share-123", "user-123");

      expect(mockPrisma.shared_journals.delete).toHaveBeenCalledWith({
        where: { id: "share-123", user_id: "user-123" },
      });
      expect(result.data).toBe(true);
    });
  });
});
