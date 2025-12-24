import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  fetchTrades,
  createTrade,
  updateTrade,
  deleteTradePrisma,
  fetchDashboardMetrics,
} from "../trades";

const { mockTradeRepo, mockSupabase } = vi.hoisted(() => ({
  mockTradeRepo: {
    getByAccountId: vi.fn(),
    countByAccountId: vi.fn(),
    getCount: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getDashboardMetrics: vi.fn(),
  },
  mockSupabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/database/repositories", () => ({
  prismaTradeRepo: mockTradeRepo,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Trade Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchTrades", () => {
    it("should return paginated trades", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.getByAccountId.mockResolvedValue({ data: [{ id: "t-1" }], error: null });
      mockTradeRepo.countByAccountId.mockResolvedValue({ data: 50, error: null });

      const result = await fetchTrades("acc-123", 1, 10);

      expect(mockTradeRepo.getByAccountId).toHaveBeenCalledWith(
        "acc-123",
        "user-123",
        expect.objectContaining({ limit: 10, offset: 0 })
      );
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(50);
    });

    it("should return empty if unauthenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await fetchTrades("acc-123", 1, 10);

      expect(mockTradeRepo.getByAccountId).not.toHaveBeenCalled();
      expect(result.data).toEqual([]);
    });
  });

  describe("createTrade", () => {
    it("should create trade", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.create.mockResolvedValue({
        data: { id: "t-1", symbol: "EURUSD" },
        error: null,
      });

      const result = await createTrade({ symbol: "EURUSD" });

      expect(mockTradeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: "EURUSD",
          userId: "user-123",
        })
      );
      expect(result.id).toBe("t-1");
    });

    it("should throw on creation failure", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.create.mockResolvedValue({ data: null, error: { message: "DB Error" } });

      await expect(createTrade({ symbol: "EURUSD" })).rejects.toThrow("DB Error");
    });
  });

  describe("updateTrade", () => {
    it("should update trade", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.update.mockResolvedValue({ data: { id: "t-1", pnl: 100 }, error: null });

      const result = await updateTrade("t-1", { pnl: 100 });

      expect(mockTradeRepo.update).toHaveBeenCalledWith("t-1", "user-123", { pnl: 100 });
      expect(result.pnl).toBe(100);
    });
  });

  describe("deleteTradePrisma", () => {
    it("should delete trade", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.delete.mockResolvedValue({ data: true, error: null });

      const result = await deleteTradePrisma("t-1");

      expect(mockTradeRepo.delete).toHaveBeenCalledWith("t-1", "user-123");
      expect(result).toBe(true);
    });
  });

  describe("fetchDashboardMetrics", () => {
    it("should get metrics", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.getDashboardMetrics.mockResolvedValue({ data: { winRate: 60 }, error: null });

      const result = await fetchDashboardMetrics("acc-123");

      expect(mockTradeRepo.getDashboardMetrics).toHaveBeenCalledWith("acc-123", "user-123");
      expect(result).toEqual({ winRate: 60 });
    });
  });
});
