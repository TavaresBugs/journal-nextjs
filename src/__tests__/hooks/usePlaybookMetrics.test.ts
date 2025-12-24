import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlaybookMetrics } from "@/hooks/usePlaybookMetrics";
import { Trade } from "@/types";

describe("usePlaybookMetrics", () => {
  const mockTrades: Trade[] = [
    {
      id: "1",
      accountId: "acc1",
      userId: "user1",
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      lot: 1,
      pnl: 100,
      outcome: "win",
      entryDate: "2023-01-01",
      tfAnalise: "1H",
      tfEntrada: "5m",
      pdArray: "Fvg",
      market_condition_v2: "Trending",
      session: "London",
      tags: "TagA",
      rMultiple: 2,
    } as unknown as Trade,
    {
      id: "2",
      accountId: "acc1",
      userId: "user1",
      symbol: "GBPUSD",
      type: "Short",
      entryPrice: 1.2,
      lot: 1,
      pnl: -50,
      outcome: "loss",
      entryDate: "2023-01-02",
      tfAnalise: "1H",
      tfEntrada: "1m",
      pdArray: "OrderBlock",
      market_condition_v2: "Ranging",
      session: "New York",
      tags: "TagB",
      rMultiple: -1,
    } as unknown as Trade,
  ];

  it("should calculate nested metrics correctly", () => {
    const { result } = renderHook(() => usePlaybookMetrics(mockTrades));
    const metrics = result.current.nestedMetrics;

    expect(metrics).toBeDefined();
    expect(metrics.length).toBeGreaterThan(0);

    const htf1H = metrics.find((m) => m.htf === "1H");
    expect(htf1H).toBeDefined();
    expect(htf1H?.totalTrades).toBe(2);
    expect(htf1H?.winRate).toBe(50);
    expect(htf1H?.pnl).toBe(50);
  });

  it("should calculate hierarchical metrics correctly", () => {
    const { result } = renderHook(() => usePlaybookMetrics(mockTrades));
    const metrics = result.current.hierarchicalMetrics;

    expect(metrics).toBeDefined();
    const htf1H = metrics.find((m) => m.htf === "1H");
    expect(htf1H).toBeDefined();

    // Check drill-down
    const trending = htf1H?.conditionBreakdown.find((c) => c.condition === "Trending");
    expect(trending).toBeDefined();
    expect(trending?.totalTrades).toBe(1);
    expect(trending?.wins).toBe(1);
  });

  it("should handle empty trades", () => {
    const { result } = renderHook(() => usePlaybookMetrics([]));
    expect(result.current.nestedMetrics).toEqual([]);
    expect(result.current.hierarchicalMetrics).toEqual([]);
  });
});
