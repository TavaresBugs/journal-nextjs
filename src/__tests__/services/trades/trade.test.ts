/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTrades,
  getTradeById,
  getTradesByIds,
  getTradesPaginated,
  getTradeHistoryLite,
  saveTrade,
  deleteTrade,
  deleteTradesByAccount,
} from "@/services/trades/trade";
import { supabase } from "@/lib/supabase";
import { handleServiceError } from "@/lib/errorHandler";
import { TradeRepository } from "@/lib/repositories/TradeRepository";
import { getCurrentUserId } from "@/services/core/account";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/repositories/TradeRepository", () => {
  const TradeRepository = vi.fn();
  TradeRepository.prototype.getByAccountId = vi.fn();
  TradeRepository.prototype.getByIdDomain = vi.fn();
  TradeRepository.prototype.createDomain = vi.fn();
  TradeRepository.prototype.deleteDomain = vi.fn();
  return { TradeRepository };
});

vi.mock("@/lib/errorHandler", () => ({
  handleServiceError: vi.fn(),
}));

vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
}));

describe("Trade Service", () => {
  const mockUserId = "user-123";
  let repoInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    repoInstance = new TradeRepository(supabase as any);
    // Important: methods above are already created by the class mock,
    // but since `trade.ts` creates its own instance at module level,
    // we might not get access to THAT instance easily if we don't spy on the prototype or if the module code already ran.

    // However, since we mock the module "../../lib/repositories/TradeRepository",
    // when `trade.ts` imports it and calls `new TradeRepository`, it gets our mock class.
    // We need to capture the instance that `trade.ts` holds.
    // Since `trade.ts` instantiates it at the top level, it happens when the test file imports `trade.ts`.
    // Vitest mocks need to be defined BEFORE imports for this to work effectively?
    // Vitest automatically hoists vi.mock calls.

    // But how do we access the instance created inside `trade.ts`?
    // We can look at `MockTradeRepo.mock.instances`.

    // Setup default auth
    (getCurrentUserId as any).mockResolvedValue(mockUserId);
  });

  // Helper to get the repo mock instance used by the service
  const getRepoMock = () => {
    const instances = (TradeRepository as any).mock.instances;
    return instances[instances.length - 1] || repoInstance;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTrades", () => {
    it("should return trades list", async () => {
      const repo = getRepoMock();
      repo.getByAccountId.mockResolvedValue({
        data: [{ id: "t1", userId: mockUserId }],
        error: null,
      });

      const trades = await getTrades("acc1");
      expect(trades).toHaveLength(1);
      expect(repo.getByAccountId).toHaveBeenCalledWith("acc1", { detailed: true });
    });

    it("should return empty if not authenticated", async () => {
      (getCurrentUserId as any).mockResolvedValue(null);
      const trades = await getTrades("acc1");
      expect(trades).toEqual([]);
      expect(handleServiceError).toHaveBeenCalled();
    });

    it("should handle repo error", async () => {
      const repo = getRepoMock();
      repo.getByAccountId.mockResolvedValue({ data: null, error: { message: "Error" } });

      const trades = await getTrades("acc1");
      expect(trades).toEqual([]);
      expect(handleServiceError).toHaveBeenCalled();
    });

    it("should filter out trades from other users", async () => {
      const repo = getRepoMock();
      repo.getByAccountId.mockResolvedValue({
        data: [
          { id: "t1", userId: mockUserId },
          { id: "t2", userId: "other" },
        ],
        error: null,
      });

      const trades = await getTrades("acc1");
      expect(trades).toHaveLength(1);
      expect(trades[0].id).toBe("t1");
    });
  });

  describe("getTradeById", () => {
    it("should return trade if found", async () => {
      const repo = getRepoMock();
      repo.getByIdDomain.mockResolvedValue({ data: { id: "t1", userId: mockUserId }, error: null });

      const trade = await getTradeById("t1");
      expect(trade?.id).toBe("t1");
    });

    it("should return null if user mismatch", async () => {
      const repo = getRepoMock();
      repo.getByIdDomain.mockResolvedValue({ data: { id: "t1", userId: "other" }, error: null });

      const trade = await getTradeById("t1");
      expect(trade).toBeNull();
    });

    it("should return null if repo error is DB_NOT_FOUND", async () => {
      const repo = getRepoMock();
      repo.getByIdDomain.mockResolvedValue({ data: null, error: { code: "DB_NOT_FOUND" } });

      const trade = await getTradeById("t1");
      expect(trade).toBeNull();
    });

    it("should handle generic repo error", async () => {
      const repo = getRepoMock();
      repo.getByIdDomain.mockResolvedValue({ data: null, error: { message: "Err" } });

      const trade = await getTradeById("t1");
      expect(trade).toBeNull();
      expect(handleServiceError).toHaveBeenCalled();
    });
  });

  describe("getTradesByIds", () => {
    it("should return trades", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockResolvedValue({ data: [{ id: "t1", user_id: mockUserId }], error: null }),
          }),
        }),
      });

      const trades = await getTradesByIds(["t1"]);
      expect(trades).toHaveLength(1);
    });

    it("should return empty if ids empty", async () => {
      const trades = await getTradesByIds([]);
      expect(trades).toEqual([]);
    });
  });

  describe("getTradesPaginated", () => {
    it("should return paginated data", async () => {
      const mockData = [{ id: "t1", user_id: mockUserId }];
      // chain: select -> eq -> eq -> order -> order -> range
      const rangeMock = vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 });
      const order2Mock = vi.fn().mockReturnValue({ range: rangeMock });
      const order1Mock = vi.fn().mockReturnValue({ order: order2Mock });
      const eq2Mock = vi.fn().mockReturnValue({ order: order1Mock });
      const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await getTradesPaginated("acc1", 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  describe("getTradeHistoryLite", () => {
    it("should return lite trades", async () => {
      const mockData = [
        {
          id: "t1",
          entry_date: "2023-01-01",
          pnl: 100,
          entry_price: 10,
          account_id: "acc1",
          symbol: "EURUSD",
          type: "Long",
          stop_loss: 9,
          take_profit: 11,
          lot: 1,
          commission: 0,
          swap: 0,
        },
      ];
      const order2Mock = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const order1Mock = vi.fn().mockReturnValue({ order: order2Mock });
      const eq2Mock = vi.fn().mockReturnValue({ order: order1Mock });
      const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await getTradeHistoryLite("acc1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t1");
      expect(result[0].pnl).toBe(100);
    });
  });

  describe("saveTrade", () => {
    it("should return true on success", async () => {
      const repo = getRepoMock();
      repo.createDomain.mockResolvedValue({ data: {}, error: null });
      const result = await saveTrade({ id: "t1" } as any);
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      const repo = getRepoMock();
      repo.createDomain.mockResolvedValue({ data: null, error: { message: "Error" } });
      const result = await saveTrade({ id: "t1" } as any);
      expect(result).toBe(false);
      expect(handleServiceError).toHaveBeenCalled();
    });
  });

  describe("deleteTrade", () => {
    it("should return true on success", async () => {
      const repo = getRepoMock();
      repo.deleteDomain.mockResolvedValue({ data: true, error: null });
      const result = await deleteTrade("t1");
      expect(result).toBe(true);
    });
  });

  describe("deleteTradesByAccount", () => {
    it("should return true on success", async () => {
      const eq2Mock = vi.fn().mockResolvedValue({ error: null });
      const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eq1Mock });
      (supabase.from as any).mockReturnValue({ delete: deleteMock });

      const result = await deleteTradesByAccount("acc1");
      expect(result).toBe(true);
    });
  });
});
