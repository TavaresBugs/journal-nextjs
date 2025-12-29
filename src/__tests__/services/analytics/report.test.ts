import { describe, it, expect } from "vitest";
import { calculateReportMetrics, calculateMonthlyMetrics } from "@/services/analytics/report";
import { Trade } from "@/types";

describe("Report Analytics Services", () => {
  const mockTrades: Trade[] = [
    {
      id: "1",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      outcome: "win",
      pnl: 100,
      entryDate: "2023-10-01T10:00:00.000Z",
      entryPrice: 1.05,
      exitPrice: 1.06,
      status: "Closed",
    } as unknown as Trade,
    {
      id: "2",
      userId: "user1",
      accountId: "acc1",
      symbol: "GBPUSD",
      type: "Short",
      outcome: "loss",
      pnl: -50,
      entryDate: "2023-10-02T10:00:00.000Z",
      entryPrice: 1.25,
      exitPrice: 1.26,
      status: "Closed",
    } as unknown as Trade,
    {
      id: "3",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      outcome: "win",
      pnl: 200,
      entryDate: "2023-11-01T10:00:00.000Z",
      entryPrice: 1.05,
      exitPrice: 1.07,
      status: "Closed",
    } as unknown as Trade,
  ];

  describe("calculateReportMetrics", () => {
    it("should calculate summary metrics correctly", () => {
      const metrics = calculateReportMetrics(mockTrades);

      expect(metrics).toEqual({
        totalTrades: 3,
        winRate: (2 / 3) * 100,
        totalPnL: 250,
        // Avg Win: (100+200)/2 = 150. Avg Loss: 50. Profit Factor: 150*2 / 50*1 = 6
        profitFactor: 6,
        bestTrade: 200,
        worstTrade: -50,
      });
    });

    it("should handle empty trades array", () => {
      const metrics = calculateReportMetrics([]);

      expect(metrics).toEqual({
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
      });
    });
  });

  describe("calculateMonthlyMetrics", () => {
    it("should group and calculate metrics by month correctly", () => {
      const monthlyMetrics = calculateMonthlyMetrics(mockTrades);

      // Expected groups:
      // Oct 2023: 2 trades (1 win, 1 loss), PnL 50
      // Nov 2023: 1 trade (1 win), PnL 200

      expect(monthlyMetrics).toHaveLength(2);

      const octMetrics = monthlyMetrics.find((m) => m.month === "Outubro 2023");
      expect(octMetrics).toBeDefined();
      expect(octMetrics).toMatchObject({
        trades: 2,
        wins: 1,
        losses: 1,
        pnl: 50,
        winRate: 50,
      });

      const novMetrics = monthlyMetrics.find((m) => m.month === "Novembro 2023");
      expect(novMetrics).toBeDefined();
      expect(novMetrics).toMatchObject({
        trades: 1,
        wins: 1,
        losses: 0,
        pnl: 200,
        winRate: 100,
      });
    });

    it("should handle empty trades array for monthly metrics", () => {
      const monthlyMetrics = calculateMonthlyMetrics([]);
      expect(monthlyMetrics).toEqual([]);
    });
  });
});
