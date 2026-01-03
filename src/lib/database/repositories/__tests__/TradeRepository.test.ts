/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
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

  describe("countByAccountId", () => {
    it("should return count", async () => {
      mockPrisma.trades.count.mockResolvedValue(55);
      const result = await prismaTradeRepo.countByAccountId("account-123", "user-123");
      expect(result.data).toBe(55);
    });

    it("should handle error", async () => {
      mockPrisma.trades.count.mockRejectedValue(new Error("Error"));
      const result = await prismaTradeRepo.countByAccountId("acc", "user");
      expect(result.error).not.toBeNull();
    });
  });

  describe("getMany", () => {
    it("should return trades by ids", async () => {
      const mockTrades = [createMockData.trade({ id: "t-1" })];
      mockPrisma.trades.findMany.mockResolvedValue(mockTrades);
      const result = await prismaTradeRepo.getMany({ where: { id: { in: ["t-1"] } } });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should create a new trade", async () => {
      const newTrade = createMockData.trade();
      mockPrisma.trades.create.mockResolvedValue(newTrade);

      const input = {
        symbol: "EURUSD",
        entryPrice: 1.1,
        accountId: "account-123",
        userId: "user-123",
        type: "Long", // corrected
      };

      const result = await prismaTradeRepo.create(input as any);
      expect(result.data).toBeDefined();
    });
  });

  describe("createMany", () => {
    it("should create multiple trades", async () => {
      mockPrisma.trades.createMany.mockResolvedValue({ count: 5 });
      const result = await prismaTradeRepo.createMany([{ symbol: "A" }] as any);
      expect(result.data?.count).toBe(5);
    });
  });

  describe("createWithJournal", () => {
    it("should create trade and link to journal in transaction", async () => {
      const mockTrade = createMockData.trade();
      const mockJournalTrade = { journal_id: "journal-123", trade_id: mockTrade.id };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

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

      expect(result.data).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a trade if owned by user", async () => {
      const updatedTrade = createMockData.trade({ pnl: 100 });
      mockPrisma.trades.findUnique.mockResolvedValue({ user_id: "user-123" });
      mockPrisma.trades.update.mockResolvedValue(updatedTrade);

      const result = await prismaTradeRepo.update("trade-123", "user-123", { pnl: 100 });
      expect(result.data?.pnl).toBe(100);
    });
  });

  describe("delete", () => {
    it("should delete a trade", async () => {
      mockPrisma.trades.deleteMany.mockResolvedValue({ count: 1 });
      const result = await prismaTradeRepo.delete("trade-123", "user-123");
      expect(result.data).toBe(true);
    });

    it("should return error if not found", async () => {
      mockPrisma.trades.deleteMany.mockResolvedValue({ count: 0 });
      const result = await prismaTradeRepo.delete("trade-123", "user-123");
      expect(result.error).not.toBeNull();
    });
  });

  describe("deleteByAccountId", () => {
    it("should delete trades", async () => {
      mockPrisma.trades.deleteMany.mockResolvedValue({ count: 10 });
      const result = await prismaTradeRepo.deleteByAccountId("acc-1", "user-1");
      expect(result.data).toBe(10);
    });
  });

  describe("getByJournalId", () => {
    it("should return trades for journal", async () => {
      mockPrisma.journal_entry_trades.findMany.mockResolvedValue([
        { trade: createMockData.trade({ id: "t-1" }) },
      ]);
      const result = await prismaTradeRepo.getByJournalId("j-1");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getDashboardMetrics", () => {
    it("should aggregate trade metrics", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          total_trades: BigInt(10),
          wins: BigInt(6),
          losses: BigInt(4),
          breakeven: BigInt(0),
          total_pnl: 500,
        },
      ]);
      const result = await prismaTradeRepo.getDashboardMetrics("account-123", "user-123");
      expect(result.data?.winRate).toBe(60);
    });
  });

  describe("getHistoryLite", () => {
    it("should return lightweight trade history", async () => {
      const mockTrades = [createMockData.trade()];
      mockPrisma.trades.findMany.mockResolvedValue(mockTrades);
      const result = await prismaTradeRepo.getHistoryLite("account-123", "user-123");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getAdvancedMetrics", () => {
    it("should return advanced metrics", async () => {
      // First query: Aggregate metrics
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          avg_pnl: 100,
          pnl_stddev: 10,
          total_pnl: 1000,
          max_pnl: 200,
          min_pnl: -100,
          total_wins: BigInt(10),
          total_losses: BigInt(10),
          sum_wins: 2000,
          sum_losses: 1000,
          max_win: 200,
          max_loss: -100,
        },
      ]);

      // Second query: Streaks
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          current_streak: 3,
          max_win_streak: 5,
          max_loss_streak: 2,
        },
      ]);

      const result = await prismaTradeRepo.getAdvancedMetrics("acc-1", "user-1", 30);

      expect(result.data).toBeDefined();
      expect(result.data?.profitFactor).toBe(2); // 2000 / 1000
      expect(result.data?.avgPnl).toBe(100);
      expect(result.data?.currentStreak).toBe(3);
    });
  });
});
