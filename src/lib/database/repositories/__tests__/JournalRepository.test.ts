/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaJournalRepo } from "../index";

describe("PrismaJournalRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getByAccountId", () => {
    it("should return journal entries for an account", async () => {
      const mockEntries = [
        { ...createMockData.journalEntry(), journal_images: [], journal_entry_trades: [] },
      ];
      mockPrisma.journal_entries.findMany.mockResolvedValue(mockEntries);

      const result = await prismaJournalRepo.getByAccountId("account-123", { limit: 10 });

      expect(mockPrisma.journal_entries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { account_id: "account-123" },
          take: 10,
        })
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe("save", () => {
    it("should create a new journal entry", async () => {
      // Mock create response
      const createdEntry = {
        ...createMockData.journalEntry(),
        journal_images: [],
        journal_entry_trades: [],
      };
      mockPrisma.journal_entries.create.mockResolvedValue(createdEntry);

      const input = {
        accountId: "account-123",
        userId: "user-123",
        title: "Test Entry",
        content: "Testing",
        date: "2024-12-20",
      };

      const result = await prismaJournalRepo.save(input as any);

      expect(mockPrisma.journal_entries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Test Entry",
            accounts: { connect: { id: "account-123" } },
            users: { connect: { id: "user-123" } },
            date: expect.any(Date),
          }),
        })
      );
      expect(result.data?.id).toBe("journal-123");
    });

    it("should update an existing journal entry and handle trade links", async () => {
      const existingId = "journal-123";
      const updatedEntry = {
        ...createMockData.journalEntry(),
        id: existingId,
        journal_images: [],
        journal_entry_trades: [],
      };

      mockPrisma.journal_entries.upsert.mockResolvedValue(updatedEntry);

      // For trade links re-fetching
      mockPrisma.journal_entries.findUnique.mockResolvedValue(updatedEntry);

      const input = {
        id: existingId,
        accountId: "account-123",
        userId: "user-123",
        title: "Updated Entry",
        tradeIds: ["trade-1", "trade-2"],
      };

      const result = await prismaJournalRepo.save(input as any);

      expect(mockPrisma.journal_entries.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingId },
        })
      );

      // Verify trade linking logic
      expect(mockPrisma.journal_entry_trades.deleteMany).toHaveBeenCalledWith({
        where: { journal_entry_id: existingId },
      });
      expect(mockPrisma.journal_entry_trades.createMany).toHaveBeenCalledWith({
        data: [
          { journal_entry_id: existingId, trade_id: "trade-1" },
          { journal_entry_id: existingId, trade_id: "trade-2" },
        ],
      });

      // Verify refetch was called
      expect(mockPrisma.journal_entries.findUnique).toHaveBeenCalled();

      expect(result.data?.id).toBe(existingId);
    });
  });

  describe("delete", () => {
    it("should delete a journal entry", async () => {
      mockPrisma.journal_entries.deleteMany.mockResolvedValue({ count: 1 });

      const result = await prismaJournalRepo.delete("journal-123", "user-123");

      expect(mockPrisma.journal_entries.deleteMany).toHaveBeenCalledWith({
        where: { id: "journal-123", user_id: "user-123" },
      });
      expect(result.data).toBe(true);
    });
  });

  describe("linkTrade", () => {
    it("should link a trade", async () => {
      mockPrisma.journal_entry_trades.create.mockResolvedValue({});

      const result = await prismaJournalRepo.linkTrade("journal-123", "trade-123");

      expect(mockPrisma.journal_entry_trades.create).toHaveBeenCalledWith({
        data: {
          journal_entry_id: "journal-123",
          trade_id: "trade-123",
        },
      });
      expect(result.data).toBe(true);
    });
  });

  describe("addImage", () => {
    it("should add an image", async () => {
      const mockImage = {
        id: "img-123",
        journal_entry_id: "journal-123",
        user_id: "user-123",
        url: "http://test.com/img.jpg",
        path: "path/to/img.jpg",
      };
      mockPrisma.journal_images.create.mockResolvedValue(mockImage);

      const result = await prismaJournalRepo.addImage("journal-123", {
        userId: "user-123",
        url: "http://test.com/img.jpg",
        path: "path/to/img.jpg",
        timeframe: "H1",
      });

      expect(mockPrisma.journal_images.create).toHaveBeenCalled();
      expect(result.data?.url).toBe("http://test.com/img.jpg");
    });
  });
});
