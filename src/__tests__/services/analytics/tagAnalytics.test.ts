import { describe, it, expect } from "vitest";
import {
  parseTagsFromString,
  getAllUniqueTags,
  calculateTagMetrics,
  calculateTimeframeAnaliseMetrics,
  calculateTimeframeEntradaMetrics,
} from "@/services/analytics/tagAnalytics";
import { Trade } from "@/types";

const mockTradeBase = {
  userId: "u1",
  accountId: "a1",
  symbol: "EURUSD",
  type: "Long" as const,
  entryDate: "2023-01-01",
  entryPrice: 100,
  stopLoss: 90,
  takeProfit: 110,
  lot: 1,
  createdAt: "2023-01-01",
  updatedAt: "2023-01-01",
  session: "London",
  htfAligned: true,
  rMultiple: 2,
};

describe("Tag Analytics Service", () => {
  const mockTrades: Trade[] = [
    {
      ...mockTradeBase,
      id: "1",
      tags: "tag1, tag2",
      outcome: "win",
      pnl: 100,
      tfAnalise: "1H",
      tfEntrada: "5m",
    } as unknown as Trade,
    {
      ...mockTradeBase,
      id: "2",
      tags: "tag2, tag3",
      outcome: "loss",
      pnl: -50,
      tfAnalise: "1H",
      tfEntrada: "15m",
    } as unknown as Trade,
    {
      ...mockTradeBase,
      id: "3",
      tags: " tag1 ,  tag3 ",
      outcome: "win",
      pnl: 200,
      tfAnalise: "4H",
      tfEntrada: "5m",
    } as unknown as Trade,
    {
      ...mockTradeBase,
      id: "4",
      tags: null,
      outcome: "breakeven",
      pnl: 0,
      tfAnalise: null,
      tfEntrada: null,
    } as unknown as Trade,
  ];

  describe("parseTagsFromString", () => {
    it("should parse comma separated tags", () => {
      expect(parseTagsFromString("tag1,tag2")).toEqual(["tag1", "tag2"]);
    });

    it("should trim whitespace", () => {
      expect(parseTagsFromString(" tag1 , tag2 ")).toEqual(["tag1", "tag2"]);
    });

    it("should handle empty or null", () => {
      expect(parseTagsFromString("")).toEqual([]);
      expect(parseTagsFromString(null)).toEqual([]);
      expect(parseTagsFromString(undefined)).toEqual([]);
    });
  });

  describe("getAllUniqueTags", () => {
    it("should return sorted unique tags", () => {
      const tags = getAllUniqueTags(mockTrades);
      expect(tags).toEqual(["tag1", "tag2", "tag3"]);
    });
  });

  describe("calculateTagMetrics", () => {
    it("should calculate metrics per tag", () => {
      const metrics = calculateTagMetrics(mockTrades);

      const tag1 = metrics.find((m) => m.tag === "tag1");
      expect(tag1).toBeDefined();
      expect(tag1?.totalTrades).toBe(2);
      expect(tag1?.wins).toBe(2);
      expect(tag1?.losses).toBe(0);
      expect(tag1?.netPnL).toBe(300);
      expect(tag1?.profitFactor).toBe(999);

      const tag2 = metrics.find((m) => m.tag === "tag2");
      expect(tag2).toBeDefined();
      expect(tag2?.totalTrades).toBe(2);
      expect(tag2?.wins).toBe(1);
      expect(tag2?.losses).toBe(1);
      expect(tag2?.netPnL).toBe(50);
      expect(tag2?.profitFactor).toBe(100 / 50);
    });
  });

  describe("calculateTimeframeAnaliseMetrics", () => {
    it("should group by tfAnalise", () => {
      const metrics = calculateTimeframeAnaliseMetrics(mockTrades);

      const h1 = metrics.find((m) => m.timeframe === "1H");
      expect(h1).toBeDefined();
      expect(h1?.totalTrades).toBe(2);
      expect(h1?.netPnL).toBe(50);

      const h4 = metrics.find((m) => m.timeframe === "4H");
      expect(h4?.netPnL).toBe(200);

      const undef = metrics.find((m) => m.timeframe === "Não definido");
      expect(undef?.totalTrades).toBe(1);
    });
  });

  describe("calculateTimeframeEntradaMetrics", () => {
    it("should group by tfEntrada", () => {
      const metrics = calculateTimeframeEntradaMetrics(mockTrades);

      const m5 = metrics.find((m) => m.timeframe === "5m");
      expect(m5?.totalTrades).toBe(2);
      expect(m5?.netPnL).toBe(300);
    });
  });
});
