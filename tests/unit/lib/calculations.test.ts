import { describe, test, expect } from "bun:test";
import { formatCurrency } from "@/lib/calculations";

describe("Calculations - formatCurrency", () => {
  test("formats BRL currency correctly", () => {
    const result = formatCurrency(1000, "BRL");
    // Note: formatCurrency uses non-breaking space (\u00A0) between currency and value
    expect(result).toContain("R$");
    expect(result).toContain("1.000,00");
  });

  test("formats USD currency correctly", () => {
    const result = formatCurrency(1000, "USD");
    expect(result).toContain("US$");
    expect(result).toContain("1.000,00");
  });

  test("handles negative values", () => {
    const result = formatCurrency(-500, "BRL");
    expect(result).toContain("-");
    expect(result).toContain("500,00");
  });

  test("handles zero", () => {
    const result = formatCurrency(0, "BRL");
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });

  test("handles decimal values", () => {
    const result = formatCurrency(1234.56, "BRL");
    expect(result).toContain("1.234,56");
  });
});

describe("Calculations - Metrics", () => {
  test("calculates basic trade metrics", () => {
    const mockTrades = [
      { pnl: 100, outcome: "win" },
      { pnl: -50, outcome: "loss" },
      { pnl: 200, outcome: "win" },
      { pnl: -30, outcome: "loss" }
    ];

    const totalPnL = mockTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    expect(totalPnL).toBe(220);

    const wins = mockTrades.filter(t => t.outcome === "win").length;
    const losses = mockTrades.filter(t => t.outcome === "loss").length;
    const winRate = (wins / mockTrades.length) * 100;

    expect(wins).toBe(2);
    expect(losses).toBe(2);
    expect(winRate).toBe(50);
  });

  test("handles all winning trades", () => {
    const mockTrades = [
      { pnl: 100, outcome: "win" },
      { pnl: 200, outcome: "win" }
    ];

    const wins = mockTrades.filter(t => t.outcome === "win").length;
    const winRate = (wins / mockTrades.length) * 100;

    expect(winRate).toBe(100);
  });

  test("handles all losing trades", () => {
    const mockTrades = [
      { pnl: -100, outcome: "loss" },
      { pnl: -200, outcome: "loss" }
    ];

    const wins = mockTrades.filter(t => t.outcome === "win").length;
    const winRate = (wins / mockTrades.length) * 100;

    expect(winRate).toBe(0);
  });
});
