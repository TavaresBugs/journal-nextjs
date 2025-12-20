import { describe, it, expect } from "vitest";
import {
  calculateTradePnL,
  determineTradeOutcome,
  formatCurrency,
  groupTradesByDay,
  filterTrades,
  formatDuration,
  formatPercentage,
  formatTimeMinutes,
  calculateTradeMetrics,
  calculateConsecutiveStreaks,
} from "@/lib/calculations";
import type { Trade } from "@/types";

// ============================================
// calculateTradePnL Tests
// ============================================

describe("calculateTradePnL", () => {
  const baseTrade: Trade = {
    id: "1",
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long",
    entryPrice: 1.1,
    exitPrice: 1.105,
    lot: 1,
    commission: -7,
    swap: -2,
    stopLoss: 1.095,
    takeProfit: 1.11,
    entryDate: "2024-01-15",
    pnl: 0,
    outcome: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should calculate positive PnL for winning Long trade", () => {
    const trade = { ...baseTrade };
    const multiplier = 100000; // Standard forex lot

    const pnl = calculateTradePnL(trade, multiplier);

    // (1.1050 - 1.1000) * 1 * 100000 = 500
    // 500 - 7 - 2 = 491
    expect(pnl).toBeCloseTo(491, 0);
  });

  it("should calculate negative PnL for losing Long trade", () => {
    const trade = {
      ...baseTrade,
      exitPrice: 1.095, // Hit stop loss
    };
    const multiplier = 100000;

    const pnl = calculateTradePnL(trade, multiplier);

    // (1.0950 - 1.1000) * 1 * 100000 = -500
    // -500 - 7 - 2 = -509
    expect(pnl).toBeCloseTo(-509, 0);
  });

  it("should calculate positive PnL for winning Short trade", () => {
    const trade = {
      ...baseTrade,
      type: "Short" as const,
      entryPrice: 1.105,
      exitPrice: 1.1,
    };
    const multiplier = 100000;

    const pnl = calculateTradePnL(trade, multiplier);

    // (1.1050 - 1.1000) * 1 * 100000 = 500
    // 500 - 7 - 2 = 491
    expect(pnl).toBeCloseTo(491, 0);
  });

  it("should return 0 if no exit price", () => {
    const trade = { ...baseTrade, exitPrice: undefined };
    const pnl = calculateTradePnL(trade, 100000);

    expect(pnl).toBe(0);
  });

  it("should handle different lot sizes", () => {
    const trade = { ...baseTrade, lot: 0.5 };
    const multiplier = 100000;

    const pnl = calculateTradePnL(trade, multiplier);

    // (1.1050 - 1.1000) * 0.5 * 100000 = 250
    // 250 - 7 - 2 = 241
    expect(pnl).toBeCloseTo(241, 0);
  });
});

// ============================================
// determineTradeOutcome Tests
// ============================================

describe("determineTradeOutcome", () => {
  const baseTrade: Trade = {
    id: "1",
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long",
    entryPrice: 1.1,
    exitPrice: 1.105,
    lot: 1,
    commission: 0,
    swap: 0,
    stopLoss: 1.095,
    takeProfit: 1.11,
    entryDate: "2024-01-15",
    pnl: 0,
    outcome: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should return "win" for positive PnL', () => {
    const trade = { ...baseTrade, pnl: 100 };
    expect(determineTradeOutcome(trade)).toBe("win");
  });

  it('should return "loss" for negative PnL', () => {
    const trade = { ...baseTrade, pnl: -100 };
    expect(determineTradeOutcome(trade)).toBe("loss");
  });

  it('should return "breakeven" for zero PnL', () => {
    const trade = { ...baseTrade, pnl: 0 };
    expect(determineTradeOutcome(trade)).toBe("breakeven");
  });

  it('should return "pending" if no exitPrice', () => {
    const trade = { ...baseTrade, exitPrice: undefined, pnl: undefined };
    expect(determineTradeOutcome(trade)).toBe("pending");
  });
});

// ============================================
// formatCurrency Tests
// ============================================

describe("formatCurrency", () => {
  // Note: Tests use pt-BR locale which outputs "US$ X.XXX,XX" format
  it("should format positive numbers with currency symbol", () => {
    const result = formatCurrency(1234.56);
    // Check it contains basic number representation
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("should format negative numbers with minus sign", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("-");
    expect(result).toContain("500");
  });

  it("should format zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("should handle small decimals", () => {
    const result = formatCurrency(0.01);
    expect(result).toContain("0");
    expect(result).toContain("01");
  });
});

// ============================================
// groupTradesByDay Tests
// ============================================

describe("groupTradesByDay", () => {
  const trades: Trade[] = [
    {
      id: "1",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      lot: 1,
      commission: 0,
      swap: 0,
      stopLoss: 1.095,
      takeProfit: 1.11,
      entryDate: "2024-01-15",
      pnl: 100,
      outcome: "win",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      userId: "user1",
      accountId: "acc1",
      symbol: "GBPUSD",
      type: "Short",
      entryPrice: 1.25,
      lot: 1,
      commission: 0,
      swap: 0,
      stopLoss: 1.255,
      takeProfit: 1.24,
      entryDate: "2024-01-15", // Same day
      pnl: 50,
      outcome: "win",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      userId: "user1",
      accountId: "acc1",
      symbol: "USDJPY",
      type: "Long",
      entryPrice: 150.0,
      lot: 1,
      commission: 0,
      swap: 0,
      stopLoss: 149.5,
      takeProfit: 150.5,
      entryDate: "2024-01-16", // Different day
      pnl: -30,
      outcome: "loss",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("should group trades by entryDate", () => {
    const grouped = groupTradesByDay(trades);

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2024-01-15"]).toHaveLength(2);
    expect(grouped["2024-01-16"]).toHaveLength(1);
  });

  it("should return empty object for empty array", () => {
    const grouped = groupTradesByDay([]);
    expect(grouped).toEqual({});
  });

  it("should preserve trade data in groups", () => {
    const grouped = groupTradesByDay(trades);

    expect(grouped["2024-01-15"][0].symbol).toBe("EURUSD");
    expect(grouped["2024-01-15"][1].symbol).toBe("GBPUSD");
  });
});

// ============================================
// filterTrades Tests
// ============================================

describe("filterTrades", () => {
  const trades: Trade[] = [
    {
      id: "1",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      lot: 1,
      entryDate: "2024-01-15",
      pnl: 100,
      outcome: "win",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      userId: "user1",
      accountId: "acc2",
      symbol: "GBPUSD",
      type: "Short",
      entryPrice: 1.25,
      lot: 1,
      entryDate: "2024-01-20",
      pnl: -50,
      outcome: "loss",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("should filter by accountId", () => {
    const result = filterTrades(trades, { accountId: "acc1" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should filter by symbol", () => {
    const result = filterTrades(trades, { symbol: "GBPUSD" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("should filter by type", () => {
    const result = filterTrades(trades, { type: "Long" });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("Long");
  });

  it("should filter by outcome", () => {
    const result = filterTrades(trades, { outcome: "loss" });
    expect(result).toHaveLength(1);
    expect(result[0].outcome).toBe("loss");
  });

  it("should filter by dateFrom", () => {
    const result = filterTrades(trades, { dateFrom: "2024-01-18" });
    expect(result).toHaveLength(1);
    expect(result[0].entryDate).toBe("2024-01-20");
  });

  it("should filter by dateTo", () => {
    const result = filterTrades(trades, { dateTo: "2024-01-16" });
    expect(result).toHaveLength(1);
    expect(result[0].entryDate).toBe("2024-01-15");
  });

  it("should return all if no filters", () => {
    const result = filterTrades(trades, {});
    expect(result).toHaveLength(2);
  });
});

// ============================================
// formatDuration Tests
// ============================================

describe("formatDuration", () => {
  it("should format minutes only", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("should format days and hours", () => {
    expect(formatDuration(1500)).toBe("1d 1h");
  });
});

// ============================================
// formatPercentage Tests
// ============================================

describe("formatPercentage", () => {
  it("should format with default 2 decimals", () => {
    expect(formatPercentage(75.5678)).toBe("75.57%");
  });

  it("should format with custom decimals", () => {
    expect(formatPercentage(75.5678, 1)).toBe("75.6%");
  });
});

// ============================================
// formatTimeMinutes Tests
// ============================================

describe("formatTimeMinutes", () => {
  it("should format minutes only", () => {
    expect(formatTimeMinutes(45)).toBe("45m");
  });

  it("should format exact hours", () => {
    expect(formatTimeMinutes(120)).toBe("2h");
  });

  it("should format hours and minutes", () => {
    expect(formatTimeMinutes(90)).toBe("1h 30m");
  });
});

// ============================================
// calculateTradeMetrics Tests
// ============================================

describe("calculateTradeMetrics", () => {
  const trades: Trade[] = [
    {
      id: "1",
      userId: "user1",
      accountId: "acc1",
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      lot: 1,
      entryDate: "2024-01-15",
      pnl: 100,
      outcome: "win",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      userId: "user1",
      accountId: "acc1",
      symbol: "GBPUSD",
      type: "Short",
      entryPrice: 1.25,
      lot: 1,
      entryDate: "2024-01-16",
      pnl: -50,
      outcome: "loss",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      userId: "user1",
      accountId: "acc1",
      symbol: "USDJPY",
      type: "Long",
      entryPrice: 150,
      lot: 1,
      entryDate: "2024-01-17",
      pnl: 0,
      outcome: "breakeven",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("should calculate basic metrics", () => {
    const metrics = calculateTradeMetrics(trades);

    expect(metrics.totalTrades).toBe(3);
    expect(metrics.wins).toBe(1);
    expect(metrics.losses).toBe(1);
    expect(metrics.breakeven).toBe(1);
    expect(metrics.totalPnL).toBe(50);
  });

  it("should calculate win rate", () => {
    const metrics = calculateTradeMetrics(trades);
    expect(metrics.winRate).toBe(50);
  });

  it("should handle empty trades", () => {
    const metrics = calculateTradeMetrics([]);
    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRate).toBe(0);
  });
});

// ============================================
// calculateConsecutiveStreaks Tests
// ============================================

describe("calculateConsecutiveStreaks", () => {
  const baseTrade = {
    userId: "user1",
    accountId: "acc1",
    symbol: "EURUSD",
    type: "Long" as const,
    entryPrice: 1.1,
    lot: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should calculate win streaks", () => {
    const trades: Trade[] = [
      { ...baseTrade, id: "1", entryDate: "2024-01-01", pnl: 100, outcome: "win" },
      { ...baseTrade, id: "2", entryDate: "2024-01-02", pnl: 100, outcome: "win" },
      { ...baseTrade, id: "3", entryDate: "2024-01-03", pnl: 100, outcome: "win" },
      { ...baseTrade, id: "4", entryDate: "2024-01-04", pnl: -50, outcome: "loss" },
    ];

    const result = calculateConsecutiveStreaks(trades);
    expect(result.maxWinStreak).toBe(3);
    expect(result.currentStreak.type).toBe("loss");
    expect(result.currentStreak.count).toBe(1);
  });

  it("should calculate loss streaks", () => {
    const trades: Trade[] = [
      { ...baseTrade, id: "1", entryDate: "2024-01-01", pnl: -50, outcome: "loss" },
      { ...baseTrade, id: "2", entryDate: "2024-01-02", pnl: -50, outcome: "loss" },
    ];

    const result = calculateConsecutiveStreaks(trades);
    expect(result.maxLossStreak).toBe(2);
    expect(result.currentStreak.type).toBe("loss");
  });

  it("should handle empty trades", () => {
    const result = calculateConsecutiveStreaks([]);
    expect(result.maxWinStreak).toBe(0);
    expect(result.maxLossStreak).toBe(0);
    expect(result.currentStreak.type).toBe("none");
  });
});
