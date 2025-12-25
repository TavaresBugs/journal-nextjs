import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getTradesPaginatedAction,
  saveTradeAction,
  deleteTradeAction,
  getTradeDashboardMetricsAction,
  getTradesByIdsAction,
  saveTradesBatchAction,
  deleteTradesByAccountAction,
  getTradeHistoryLiteAction,
  getTradesByJournalAction,
  getAdvancedMetricsAction,
} from "../../app/actions/trades";
import { prismaTradeRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { revalidateTag } from "next/cache";

// Mocks
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  /* eslint-disable @typescript-eslint/no-explicit-any */
  unstable_cache: (fn: any) => fn,
}));

describe("Trade Actions", () => {
  const mockUserId = "user-123";
  const mockAccountId = "acc-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getTradesPaginatedAction", () => {
    it("should return paginated trades", async () => {
      (prismaTradeRepo.getByAccountId as Mock).mockResolvedValue({
        data: [{ id: "t-1" }],
        error: null,
      });
      (prismaTradeRepo.countByAccountId as Mock).mockResolvedValue({
        data: 50,
        error: null,
      });

      const result = await getTradesPaginatedAction(mockAccountId, 1, 10);

      expect(prismaTradeRepo.getByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        mockUserId,
        expect.objectContaining({ limit: 10, offset: 0 })
      );
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(50);
    });
  });

  describe("getTradesByIdsAction", () => {
    it("should return trades by ids", async () => {
      (prismaTradeRepo.getMany as Mock).mockResolvedValue({ data: [{ id: "t-1" }], error: null });
      const result = await getTradesByIdsAction(["t-1"]);
      expect(prismaTradeRepo.getMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it("should return empty if input empty", async () => {
      const result = await getTradesByIdsAction([]);
      expect(result).toEqual([]);
    });
  });

  describe("saveTradeAction", () => {
    it("should create trade if id not present", async () => {
      (prismaTradeRepo.create as Mock).mockResolvedValue({
        data: { id: "t-1", symbol: "EURUSD", accountId: mockAccountId },
        error: null,
      });

      const result = await saveTradeAction({ symbol: "EURUSD", accountId: mockAccountId });

      expect(prismaTradeRepo.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(revalidateTag).toHaveBeenCalled();
    });
  });

  describe("saveTradesBatchAction", () => {
    it("should create multiple trades", async () => {
      (prismaTradeRepo.createMany as Mock).mockResolvedValue({ data: { count: 2 }, error: null });
      const result = await saveTradesBatchAction([
        { symbol: "A", accountId: mockAccountId },
        { symbol: "B", accountId: mockAccountId },
      ]);
      expect(prismaTradeRepo.createMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe("deleteTradeAction", () => {
    it("should delete trade and revalidate", async () => {
      (prismaTradeRepo.getById as Mock).mockResolvedValue({
        data: { id: "t-1", accountId: mockAccountId },
        error: null,
      });
      (prismaTradeRepo.delete as Mock).mockResolvedValue({ data: true, error: null });

      const result = await deleteTradeAction("t-1");

      expect(prismaTradeRepo.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteTradesByAccountAction", () => {
    it("should delete trades by account", async () => {
      (prismaTradeRepo.deleteByAccountId as Mock).mockResolvedValue({ data: 10, error: null });
      const result = await deleteTradesByAccountAction(mockAccountId);
      expect(prismaTradeRepo.deleteByAccountId).toHaveBeenCalledWith(mockAccountId, mockUserId);
      expect(result.success).toBe(true);
    });
  });

  describe("getTradeDashboardMetricsAction", () => {
    it("should get metrics", async () => {
      (prismaTradeRepo.getDashboardMetrics as Mock).mockResolvedValue({
        data: { winRate: 60 },
        error: null,
      });
      const result = await getTradeDashboardMetricsAction(mockAccountId);
      expect(result).toEqual({ winRate: 60 });
    });
  });

  describe("getTradeHistoryLiteAction", () => {
    it("should get history", async () => {
      (prismaTradeRepo.getHistoryLite as Mock).mockResolvedValue({ data: [], error: null });
      await getTradeHistoryLiteAction(mockAccountId);
      expect(prismaTradeRepo.getHistoryLite).toHaveBeenCalled();
    });
  });

  describe("getTradesByJournalAction", () => {
    it("should get trades by journal and filter by user", async () => {
      (prismaTradeRepo.getByJournalId as Mock).mockResolvedValue({
        data: [
          { id: "t-1", userId: mockUserId },
          { id: "t-2", userId: "other" },
        ],
        error: null,
      });
      const result = await getTradesByJournalAction("journal-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t-1");
    });
  });

  describe("getAdvancedMetricsAction", () => {
    it("should get advanced metrics", async () => {
      (prismaTradeRepo.getAdvancedMetrics as Mock).mockResolvedValue({ data: {}, error: null });
      const result = await getAdvancedMetricsAction(mockAccountId, 1000);
      expect(prismaTradeRepo.getAdvancedMetrics).toHaveBeenCalledWith(
        mockAccountId,
        mockUserId,
        1000
      );
      expect(result).toEqual({});
    });
  });
});
