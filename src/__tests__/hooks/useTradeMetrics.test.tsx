import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useTradeMetrics } from "@/hooks/useTradeMetrics";
import type { Trade, JournalEntry } from "@/types";

describe("useTradeMetrics", () => {
  const createMockTrade = (overrides: Partial<Trade> = {}): Trade => ({
    id: "trade-1",
    userId: "user-1",
    accountId: "account-1",
    symbol: "EURUSD",
    type: "Long",
    entryDate: "2024-01-15T10:00:00.000Z",
    entryTime: "10:00",
    exitDate: "2024-01-15T11:00:00.000Z",
    exitTime: "11:00",
    entryPrice: 1.1,
    exitPrice: 1.11,
    pnl: 100,
    lot: 1,
    stopLoss: 1.095,
    takeProfit: 1.12,
    outcome: "win",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T11:00:00.000Z",
    ...overrides,
  });

  const createMockEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
    id: "entry-1",
    userId: "user-1",
    accountId: "account-1",
    date: "2024-01-15",
    title: "Test Entry",
    images: [],
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
    ...overrides,
  });

  it("should calculate basic metrics for trades", () => {
    const trades = [
      createMockTrade({ pnl: 100, outcome: "win" }),
      createMockTrade({ id: "trade-2", pnl: -50, outcome: "loss" }),
      createMockTrade({ id: "trade-3", pnl: 75, outcome: "win" }),
    ];

    const { result } = renderHook(() =>
      useTradeMetrics({
        trades,
        entries: [],
        initialBalance: 10000,
        currentBalance: 10125,
      })
    );

    expect(result.current.metrics.totalTrades).toBe(3);
    expect(result.current.metrics.winRate).toBeCloseTo(66.67, 1);
  });

  it("should calculate PnL metrics correctly", () => {
    const { result } = renderHook(() =>
      useTradeMetrics({
        trades: [],
        entries: [],
        initialBalance: 10000,
        currentBalance: 12500,
      })
    );

    expect(result.current.pnlMetrics.pnl).toBe(2500);
    expect(result.current.pnlMetrics.pnlPercent).toBe(25);
    expect(result.current.pnlMetrics.isProfit).toBe(true);
  });

  it("should calculate negative PnL correctly", () => {
    const { result } = renderHook(() =>
      useTradeMetrics({
        trades: [],
        entries: [],
        initialBalance: 10000,
        currentBalance: 8000,
      })
    );

    expect(result.current.pnlMetrics.pnl).toBe(-2000);
    expect(result.current.pnlMetrics.pnlPercent).toBe(-20);
    expect(result.current.pnlMetrics.isProfit).toBe(false);
  });

  it("should calculate streak metrics from trades and entries", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

    const trades = [
      createMockTrade({ entryDate: `${today}T10:00:00.000Z` }),
      createMockTrade({ id: "trade-2", entryDate: `${yesterday}T10:00:00.000Z` }),
    ];

    const entries = [createMockEntry({ date: twoDaysAgo })];

    const { result } = renderHook(() =>
      useTradeMetrics({
        trades,
        entries,
        initialBalance: 10000,
        currentBalance: 10000,
      })
    );

    expect(result.current.streakMetrics.daysAccessed).toBe(3);
    expect(result.current.streakMetrics.streak).toBe(3);
  });

  it("should break streak on gap day", () => {
    const today = new Date().toISOString().split("T")[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

    const trades = [
      createMockTrade({ entryDate: `${today}T10:00:00.000Z` }),
      createMockTrade({ id: "trade-2", entryDate: `${threeDaysAgo}T10:00:00.000Z` }),
    ];

    const { result } = renderHook(() =>
      useTradeMetrics({
        trades,
        entries: [],
        initialBalance: 10000,
        currentBalance: 10000,
      })
    );

    expect(result.current.streakMetrics.daysAccessed).toBe(2);
    expect(result.current.streakMetrics.streak).toBe(1);
  });

  it("should return zero streak when no recent activity", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0];

    const trades = [createMockTrade({ entryDate: `${tenDaysAgo}T10:00:00.000Z` })];

    const { result } = renderHook(() =>
      useTradeMetrics({
        trades,
        entries: [],
        initialBalance: 10000,
        currentBalance: 10000,
      })
    );

    expect(result.current.streakMetrics.streak).toBe(0);
    expect(result.current.streakMetrics.daysAccessed).toBe(1);
  });

  it("should handle empty trades and entries", () => {
    const { result } = renderHook(() =>
      useTradeMetrics({
        trades: [],
        entries: [],
        initialBalance: 10000,
        currentBalance: 10000,
      })
    );

    expect(result.current.metrics.totalTrades).toBe(0);
    expect(result.current.streakMetrics.daysAccessed).toBe(0);
    expect(result.current.streakMetrics.streak).toBe(0);
    expect(result.current.pnlMetrics.pnl).toBe(0);
  });

  it("should handle zero initial balance gracefully", () => {
    const { result } = renderHook(() =>
      useTradeMetrics({
        trades: [],
        entries: [],
        initialBalance: 0,
        currentBalance: 1000,
      })
    );

    expect(result.current.pnlMetrics.pnl).toBe(1000);
    expect(result.current.pnlMetrics.pnlPercent).toBe(0); // Avoids division by zero
  });

  it("should include advanced metrics", () => {
    const trades = [createMockTrade({ pnl: 100 }), createMockTrade({ id: "trade-2", pnl: -50 })];

    const { result } = renderHook(() =>
      useTradeMetrics({
        trades,
        entries: [],
        initialBalance: 10000,
        currentBalance: 10050,
      })
    );

    // Just verify the structure exists
    expect(result.current.advancedMetrics).toHaveProperty("sharpe");
    expect(result.current.advancedMetrics).toHaveProperty("calmar");
    expect(result.current.advancedMetrics).toHaveProperty("holdTime");
    expect(result.current.advancedMetrics).toHaveProperty("streaks");
  });
});
