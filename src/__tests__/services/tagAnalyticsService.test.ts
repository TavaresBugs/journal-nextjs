import { describe, it, expect } from "vitest";
import {
  parseTagsFromString,
  getAllUniqueTags,
  calculateTagMetrics,
  getTagMetricsForStrategy,
} from "@/services/analytics/tagAnalytics";
import type { Trade } from "@/types";

// Mock trades for testing
const mockTrades: Trade[] = [
  {
    id: "1",
    userId: "user-1",
    accountId: "account-1",
    symbol: "EURUSD",
    type: "Long",
    entryPrice: 1.1,
    exitPrice: 1.105,
    stopLoss: 1.095,
    takeProfit: 1.11,
    lot: 1,
    entryDate: "2024-01-01",
    pnl: 500,
    outcome: "win",
    tags: "Sweep, OB, London",
    strategy: "MMBM",
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T11:00:00Z",
  },
  {
    id: "2",
    userId: "user-1",
    accountId: "account-1",
    symbol: "GBPUSD",
    type: "Short",
    entryPrice: 1.25,
    exitPrice: 1.255,
    stopLoss: 1.245,
    takeProfit: 1.26,
    lot: 1,
    entryDate: "2024-01-02",
    pnl: -500,
    outcome: "loss",
    tags: "Sweep, FVG",
    strategy: "MMBM",
    createdAt: "2024-01-02T10:00:00Z",
    updatedAt: "2024-01-02T11:00:00Z",
  },
  {
    id: "3",
    userId: "user-1",
    accountId: "account-1",
    symbol: "XAUUSD",
    type: "Long",
    entryPrice: 2000,
    exitPrice: 2020,
    stopLoss: 1990,
    takeProfit: 2030,
    lot: 1,
    entryDate: "2024-01-03",
    pnl: 200,
    outcome: "win",
    tags: "OB, NY Session",
    strategy: "MMSM",
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-03T11:00:00Z",
  },
];

describe("tagAnalyticsService", () => {
  describe("parseTagsFromString", () => {
    it("should parse comma-separated tags", () => {
      const result = parseTagsFromString("Sweep, OB, London");
      expect(result).toEqual(["Sweep", "OB", "London"]);
    });

    it("should handle empty string", () => {
      const result = parseTagsFromString("");
      expect(result).toEqual([]);
    });

    it("should handle undefined", () => {
      const result = parseTagsFromString(undefined);
      expect(result).toEqual([]);
    });

    it("should trim whitespace from tags", () => {
      const result = parseTagsFromString("  Sweep  ,  OB  ,  FVG  ");
      expect(result).toEqual(["Sweep", "OB", "FVG"]);
    });

    it("should filter out empty tags", () => {
      const result = parseTagsFromString("Sweep,,OB,,,FVG");
      expect(result).toEqual(["Sweep", "OB", "FVG"]);
    });
  });

  describe("getAllUniqueTags", () => {
    it("should return unique sorted tags from all trades", () => {
      const result = getAllUniqueTags(mockTrades);
      expect(result).toEqual(["FVG", "London", "NY Session", "OB", "Sweep"]);
    });

    it("should return empty array for trades without tags", () => {
      const tradesWithoutTags = mockTrades.map((t) => ({ ...t, tags: undefined }));
      const result = getAllUniqueTags(tradesWithoutTags);
      expect(result).toEqual([]);
    });
  });

  describe("calculateTagMetrics", () => {
    it("should calculate metrics for each tag", () => {
      const result = calculateTagMetrics(mockTrades);

      // Sweep appears in 2 trades (1 win, 1 loss)
      const sweepMetrics = result.find((m) => m.tag === "Sweep");
      expect(sweepMetrics).toBeDefined();
      expect(sweepMetrics?.totalTrades).toBe(2);
      expect(sweepMetrics?.wins).toBe(1);
      expect(sweepMetrics?.losses).toBe(1);
      expect(sweepMetrics?.winRate).toBe(50);
      expect(sweepMetrics?.netPnL).toBe(0); // 500 - 500
    });

    it("should sort results by total trades", () => {
      const result = calculateTagMetrics(mockTrades);
      // First should have most trades
      expect(result[0].totalTrades).toBeGreaterThanOrEqual(result[1].totalTrades);
    });

    it("should calculate profit factor correctly", () => {
      const result = calculateTagMetrics(mockTrades);
      const sweepMetrics = result.find((m) => m.tag === "Sweep");
      // Win: 500, Loss: 500, PF = 500/500 = 1
      expect(sweepMetrics?.profitFactor).toBe(1);
    });
  });

  describe("getTagMetricsForStrategy", () => {
    it("should filter by strategy before calculating", () => {
      const result = getTagMetricsForStrategy(mockTrades, "MMBM");

      // Should only include tags from MMBM trades
      expect(result.some((m) => m.tag === "NY Session")).toBe(false);
      expect(result.some((m) => m.tag === "Sweep")).toBe(true);
    });

    it("should return empty array for non-existent strategy", () => {
      const result = getTagMetricsForStrategy(mockTrades, "NonExistent");
      expect(result).toEqual([]);
    });
  });
});
