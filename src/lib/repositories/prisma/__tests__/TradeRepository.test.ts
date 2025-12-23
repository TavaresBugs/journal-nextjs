/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/prisma";
import { prismaTradeRepo } from "../index";

describe("PrismaTradeRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getByAccountId", () => {
    it("should return trades for an account", async () => {
      const mockTrades = [createMockData.trade(), createMockData.trade()];
      mockPrisma.trades.findMany.mockResolvedValue(mockTrades);

      const result = await prismaTradeRepo.getByAccountId("account-123", "user-123", { limit: 10 });

      expect(mockPrisma.trades.findMany).toHaveBeenCalledWith({
        where: { account_id: "account-123", user_id: "user-123" },
        take: 10,
        skip: undefined,
        orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }],
      });
      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it("should handle errors", async () => {
      mockPrisma.trades.findMany.mockRejectedValue(new Error("DB Error"));
      const result = await prismaTradeRepo.getByAccountId("account-123", "user-123");
      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new trade", async () => {
      const newTrade = createMockData.trade();
      mockPrisma.trades.create.mockResolvedValue(newTrade);

      // Input matching partial trade
      const input = {
        symbol: "EURUSD",
        entryPrice: 1.1,
        accountId: "account-123",
        userId: "user-123",
        type: "BUY",
      };

      const result = await prismaTradeRepo.create(input as any);

      expect(mockPrisma.trades.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            symbol: "EURUSD",
            users: { connect: { id: "user-123" } },
            accounts: { connect: { id: "account-123" } },
          }),
        })
      );
      expect(result.data).toBeDefined();
    });
  });

  describe("createWithJournal", () => {
    it("should create trade and link to journal in transaction", async () => {
      const mockTrade = createMockData.trade();
      const mockJournalTrade = { journal_id: "journal-123", trade_id: mockTrade.id };

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      // Journal validation mock
      mockPrisma.journal_entries.findUnique.mockResolvedValue({
        id: "journal-123",
        user_id: "user-123",
      });

      mockPrisma.trades.create.mockResolvedValue(mockTrade);
      mockPrisma.journal_entry_trades.create.mockResolvedValue(mockJournalTrade);

      const result = await prismaTradeRepo.createWithJournal(
        { symbol: "EURUSD", accountId: "acc-123" } as any,
        "journal-123",
        "user-123"
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.journal_entries.findUnique).toHaveBeenCalled();
      expect(mockPrisma.trades.create).toHaveBeenCalled();
      expect(mockPrisma.journal_entry_trades.create).toHaveBeenCalledWith({
        data: {
          journal_entry_id: "journal-123",
          trade_id: mockTrade.id,
        },
      });
      expect(result.data).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a trade if owned by user", async () => {
      const updatedTrade = createMockData.trade({ pnl: 100 });
      // Existence check mock
      mockPrisma.trades.findUnique.mockResolvedValue({ user_id: "user-123" });
      // Update mock
      mockPrisma.trades.update.mockResolvedValue(updatedTrade);

      const result = await prismaTradeRepo.update("trade-123", "user-123", { pnl: 100 });

      expect(mockPrisma.trades.findUnique).toHaveBeenCalled();
      expect(mockPrisma.trades.update).toHaveBeenCalledWith({
        where: { id: "trade-123" },
        data: expect.objectContaining({ pnl: 100 }),
      });
      expect(result.data?.pnl).toBe(100);
    });
  });

  describe("delete", () => {
    it("should delete a trade", async () => {
      mockPrisma.trades.deleteMany.mockResolvedValue({ count: 1 });

      const result = await prismaTradeRepo.delete("trade-123", "user-123");

      expect(mockPrisma.trades.deleteMany).toHaveBeenCalledWith({
        where: { id: "trade-123", user_id: "user-123" },
      });
      expect(result.data).toBe(true);
    });

    it("should return error if not found", async () => {
      mockPrisma.trades.deleteMany.mockResolvedValue({ count: 0 });
      const result = await prismaTradeRepo.delete("trade-123", "user-123");
      // Could be null data and error, or just false depending on impl.
      // Repo says: return error "Trade not found"
      expect(result.error).not.toBeNull();
    });
  });

  describe("getDashboardMetrics", () => {
    it("should aggregate trade metrics", async () => {
      // Mock aggregations
      mockPrisma.trades.aggregate.mockResolvedValue({
        _sum: {
          pnl: 500,
        },
      });

      // Mock count logic based on outcome
      mockPrisma.trades.count.mockImplementation((args: any) => {
        if (args?.where?.outcome === "win") return Promise.resolve(6);
        if (args?.where?.outcome === "loss") return Promise.resolve(4);
        return Promise.resolve(10); // Total trades (no outcome filter or filtered by user/account only)
      });

      const result = await prismaTradeRepo.getDashboardMetrics("account-123", "user-123");

      expect(result.data?.totalTrades).toBe(10);
      expect(result.data?.wins).toBe(6);
      expect(result.data?.losses).toBe(4);
      expect(result.data?.totalPnl).toBe(500);
      // Winrate = 6/10 = 60
      expect(result.data?.winRate).toBe(60);
    });
  });
});
