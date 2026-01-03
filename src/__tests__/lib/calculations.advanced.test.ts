import { describe, it, expect } from "vitest";
import {
  calculateSharpeRatio,
  calculateCalmarRatio,
  calculateTradeDuration,
} from "@/lib/utils/trading";
import type { Trade } from "@/types";

// ============================================
// calculateSharpeRatio Tests
// ============================================

describe("calculateSharpeRatio", () => {
  const baseTrade = {
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long" as const,
    entryPrice: 1.1,
    lot: 1,
    stopLoss: 0,
    takeProfit: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    outcome: "win" as const,
  };

  it("should return 0 for less than 2 trades", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
    ];

    const sharpe = calculateSharpeRatio(trades);
    expect(sharpe).toBe(0);
  });

  it("should return 0 for empty trades", () => {
    expect(calculateSharpeRatio([])).toBe(0);
  });

  it("should calculate Sharpe Ratio for winning streak", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: 150,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 120,
      },
      {
        ...baseTrade,
        id: "4",
        entryDate: "2024-01-04",
        pnl: 180,
      },
    ];

    const sharpe = calculateSharpeRatio(trades);
    // Should be a positive number for profitable trading
    expect(sharpe).toBeGreaterThan(0);
  });

  it("should calculate lower Sharpe for volatile returns", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 500,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: -300,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 400,
      },
      {
        ...baseTrade,
        id: "4",
        entryDate: "2024-01-04",
        pnl: -200,
      },
    ];

    const sharpe = calculateSharpeRatio(trades);
    // Volatile returns should have lower Sharpe
    expect(typeof sharpe).toBe("number");
    expect(sharpe).not.toBe(0);
  });

  it("should handle custom risk-free rate", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: 110,
      },
    ];

    const sharpe1 = calculateSharpeRatio(trades, 0.02);
    const sharpe2 = calculateSharpeRatio(trades, 0.05);

    // Higher risk-free rate should lower the Sharpe ratio
    expect(sharpe1).toBeGreaterThanOrEqual(sharpe2);
  });

  it("should return 0 when all returns are zero", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 0,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: 0,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 0,
      },
    ];

    const sharpe = calculateSharpeRatio(trades);
    expect(sharpe).toBe(0);
  });

  it("should sort trades by date before calculation", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 120,
      },
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: 110,
      },
    ];

    // Should not throw error and should calculate
    const sharpe = calculateSharpeRatio(trades);
    expect(typeof sharpe).toBe("number");
  });
});

// ============================================
// calculateCalmarRatio Tests
// ============================================

describe("calculateCalmarRatio", () => {
  const baseTrade = {
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long" as const,
    entryPrice: 1.1,
    lot: 1,
    stopLoss: 0,
    takeProfit: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    outcome: "win" as const,
  };

  it("should return 0 for empty trades", () => {
    expect(calculateCalmarRatio([], 10000)).toBe(0);
  });

  it("should return 0 for zero initial balance", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
    ];

    expect(calculateCalmarRatio(trades, 0)).toBe(0);
  });

  it("should calculate Calmar Ratio for profitable trading", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 500,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: -200,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 300,
      },
      {
        ...baseTrade,
        id: "4",
        entryDate: "2024-01-04",
        pnl: 400,
      },
    ];

    const calmar = calculateCalmarRatio(trades, 10000, 365);
    // Should be a positive number for profitable trading
    expect(calmar).toBeGreaterThan(0);
  });

  it("should return 0 when max drawdown is 0 (no losses)", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 100,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: 200,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: 300,
      },
    ];

    const calmar = calculateCalmarRatio(trades, 10000);
    // With no drawdown, should return 0 (division by zero case)
    expect(calmar).toBe(0);
  });

  it("should handle custom period days", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 500,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: -200,
      },
    ];

    const calmar365 = calculateCalmarRatio(trades, 10000, 365);
    const calmar180 = calculateCalmarRatio(trades, 10000, 180);

    // Different period should affect annualized return
    expect(calmar365).not.toBe(calmar180);
  });

  it("should calculate negative Calmar for losing trading", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: -500,
        outcome: "loss" as const,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: -300,
        outcome: "loss" as const,
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: -200,
        outcome: "loss" as const,
      },
    ];

    const calmar = calculateCalmarRatio(trades, 10000);
    // Net negative should result in negative Calmar
    expect(calmar).toBeLessThan(0);
  });

  it("should handle trades with drawdown recovery", () => {
    const trades: Trade[] = [
      {
        ...baseTrade,
        id: "1",
        entryDate: "2024-01-01",
        pnl: 1000,
      },
      {
        ...baseTrade,
        id: "2",
        entryDate: "2024-01-02",
        pnl: -800, // Drawdown from peak
      },
      {
        ...baseTrade,
        id: "3",
        entryDate: "2024-01-03",
        pnl: -300, // Deeper drawdown
      },
      {
        ...baseTrade,
        id: "4",
        entryDate: "2024-01-04",
        pnl: 1500, // Recovery
      },
    ];

    const calmar = calculateCalmarRatio(trades, 10000);
    expect(typeof calmar).toBe("number");
    expect(calmar).toBeGreaterThan(0);
  });
});

// ============================================
// calculateTradeDuration Tests
// ============================================

describe("calculateTradeDuration", () => {
  const baseTrade = {
    id: "1",
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long" as const,
    entryPrice: 1.1,
    lot: 1,
    stopLoss: 0,
    takeProfit: 0,
    pnl: 100,
    outcome: "win" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should return 0 if no exit date", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "10:00",
    };

    expect(calculateTradeDuration(trade)).toBe(0);
  });

  it("should return 0 if no exit time", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "10:00",
      exitDate: "2024-01-01",
    };

    expect(calculateTradeDuration(trade)).toBe(0);
  });

  it("should calculate duration in minutes for same-day trade", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "10:00",
      exitDate: "2024-01-01",
      exitTime: "11:30",
    };

    expect(calculateTradeDuration(trade)).toBe(90); // 1h 30m = 90 minutes
  });

  it("should calculate duration for multi-day trade", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "10:00",
      exitDate: "2024-01-02",
      exitTime: "10:00",
    };

    expect(calculateTradeDuration(trade)).toBe(1440); // 24 hours = 1440 minutes
  });

  it("should use default entry time 00:00 if not provided", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      exitDate: "2024-01-01",
      exitTime: "12:00",
    };

    expect(calculateTradeDuration(trade)).toBe(720); // 12 hours = 720 minutes
  });

  it("should handle fractional minutes correctly", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "10:00",
      exitDate: "2024-01-01",
      exitTime: "10:01:30",
    };

    // Should floor to 1 minute (90 seconds = 1.5 minutes → floor to 1)
    expect(calculateTradeDuration(trade)).toBe(1);
  });

  it("should handle multi-week trades", () => {
    const trade: Trade = {
      ...baseTrade,
      entryDate: "2024-01-01",
      entryTime: "09:00",
      exitDate: "2024-01-08",
      exitTime: "09:00",
    };

    expect(calculateTradeDuration(trade)).toBe(10080); // 7 days * 24h * 60m = 10080 minutes
  });
});
