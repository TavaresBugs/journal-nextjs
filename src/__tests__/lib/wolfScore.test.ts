import { describe, it, expect } from "vitest";
import { calculateWolfScore } from "../../lib/wolfScore";
import type { Trade, TradeMetrics } from "../../types";

// Mock helper
const createTrade = (pnl: number, date: string): Trade => ({
  id: "1",
  accountId: "1",
  symbol: "ES",
  entryDate: date,
  entryTime: "10:00",
  type: "Long",
  entryPrice: 5000,
  exitPrice: 5000,
  pnl,
  commission: 0,
  exitDate: date,
  exitTime: "11:00",
  // Missing props
  userId: "u1",
  stopLoss: 0,
  takeProfit: 0,
  lot: 1,
  setup: "test",
  notes: "",
  createdAt: date,
  updatedAt: date,
});

const mockMetrics = (overrides: Partial<TradeMetrics>): TradeMetrics => ({
  totalTrades: 10,
  wins: 5,
  losses: 5,
  breakeven: 0,
  winRate: 50,
  totalPnL: 1000,
  maxDrawdown: 100,
  profitFactor: 2.0,
  avgWin: 200,
  avgLoss: 100,
  pending: 0, // Add missing property
  ...overrides,
});

describe("Wolf Score (Zella Logic)", () => {
  it("should calculate perfect score (100) for elite stats", () => {
    const metrics = mockMetrics({
      winRate: 70, // Cap is 60 -> 100
      profitFactor: 3.0, // > 2.6 -> 100
      avgWin: 300,
      avgLoss: 100, // Ratio 3.0 -> >2.6 -> 100
      maxDrawdown: 0, // 100 - 0 = 100
      totalPnL: 5000,
    });

    const trades = [
      createTrade(1000, "2023-01-01"),
      createTrade(1000, "2023-01-02"),
      createTrade(1000, "2023-01-03"),
      createTrade(1000, "2023-01-04"),
      createTrade(1000, "2023-01-05"),
    ];
    // Consistency: CV = 0 (all equal). 100 - 0 = 100.

    const result = calculateWolfScore(trades, metrics, 10000); // 10k balance

    expect(result.metrics.winRate).toBe(100);
    expect(result.metrics.profitFactor).toBe(100);
    expect(result.metrics.avgWinLossRatio).toBe(100);
    expect(result.metrics.maxDrawdownScore).toBe(100);
    expect(result.metrics.consistency).toBe(100);
    expect(result.score).toBe(100);
    expect(result.grade).toBe("S");
  });

  it("should calculate correct win rate score", () => {
    // Formula: (Win% / 60) * 100
    // 30% WR -> (30/60)*100 = 50
    const metrics = mockMetrics({ winRate: 30 });
    const result = calculateWolfScore([], metrics, 10000);
    expect(result.metrics.winRate).toBeCloseTo(50, 0);
  });

  it("should interpolate profit factor score correctly", () => {
    // PF 2.3 (Range 2.2-2.39 -> 80-89)
    // 2.3 is roughly middle. Should be ~85.
    const metrics = mockMetrics({ profitFactor: 2.3 });
    const result = calculateWolfScore([], metrics, 10000);
    expect(result.metrics.profitFactor).toBeGreaterThanOrEqual(80);
    expect(result.metrics.profitFactor).toBeLessThanOrEqual(89);
  });

  it("should penalize high drawdown", () => {
    // Drawdown 20% of balance -> Score = 100 - 20 = 80
    const metrics = mockMetrics({ maxDrawdown: 2000 });
    const result = calculateWolfScore([], metrics, 10000);
    expect(result.metrics.maxDrawdownScore).toBe(80);
  });

  it("should calculate consistency score", () => {
    // Trades: 100, 300. Mean 200. Total 400.
    // Variance: ((100-200)^2 + (300-200)^2) / 2 = (10000 + 10000)/2 = 10000.
    // StdDev = 100.
    // Ratio = 100 / 400 = 0.25.
    // Score = 100 - (0.25 * 100) = 75.
    const trades = [createTrade(100, "2023-01-01"), createTrade(300, "2023-01-02")];

    const result = calculateWolfScore(trades, mockMetrics({}), 10000);
    expect(result.metrics.consistency).toBe(75);
  });
});
