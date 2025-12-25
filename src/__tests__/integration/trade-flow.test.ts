/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Setup Mock BEFORE imports that use it
import {
  createPrismaMock,
  type PrismaMock,
} from "@/lib/database/repositories/__tests__/prismaMock";

// Mock Prisma client singleton
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

import {
  saveTradeAction,
  getTradeDashboardMetricsAction,
  deleteTradeAction,
} from "@/app/actions/trades";
import { prisma } from "@/lib/database";
import { Prisma } from "@/generated/prisma";

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn, // Bypass cache
}));

// Mock Auth
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));

describe("Integration: Trade Lifecycle Flow", () => {
  const mockDate = new Date("2023-01-01");
  let prismaMock: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    // Cast mocked prisma to typed mock interface
    prismaMock = prisma as unknown as PrismaMock;
  });

  it("should complete the full create -> metrics -> delete flow", async () => {
    // 1. Create Trade
    const newTrade = {
      accountId: "acc-1",
      symbol: "EURUSD",
      type: "Long" as const,
      entryPrice: 1.05,
      lot: 1,
      entryDate: "2023-01-01",
      outcome: "win" as const,
      pnl: 100,
    };

    // Mock Prisma Create
    prismaMock.trades.create.mockResolvedValue({
      id: "trade-1",
      user_id: "user-123",
      account_id: "acc-1",
      symbol: "EURUSD",
      type: "Long",
      entry_price: new Prisma.Decimal(1.05),
      lot: new Prisma.Decimal(1),
      entry_date: mockDate,
      outcome: "win",
      pnl: new Prisma.Decimal(100),
      created_at: mockDate,
      updated_at: mockDate,
    } as any);

    const createResult = await saveTradeAction(newTrade);

    expect(createResult.success).toBe(true);
    expect(createResult.trade).toBeDefined();
    expect(prismaMock.trades.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          symbol: "EURUSD",
          pnl: 100,
          // user connection check
          users: { connect: { id: "user-123" } },
        }),
      })
    );

    // Verify Cache Invalidation
    const { revalidateTag, revalidatePath } = await import("next/cache");
    expect(revalidateTag).toHaveBeenCalledWith("trades:acc-1", "max");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/acc-1", "page");

    // 2. Refresh Metrics
    // Mock Raw Query for Dashboard Metrics (optimized query)
    prismaMock.$queryRaw.mockResolvedValue([
      {
        total_trades: BigInt(1),
        wins: BigInt(1),
        losses: BigInt(0),
        breakeven: BigInt(0),
        total_pnl: 100,
      },
    ] as any);

    const metrics = await getTradeDashboardMetricsAction("acc-1");

    expect(metrics).toBeDefined();
    expect(metrics?.totalTrades).toBe(1);
    expect(metrics?.totalPnl).toBe(100);
    expect(metrics?.wins).toBe(1);

    // 3. Delete Trade
    // Mock GetById (needed for accountId lookup in delete)
    prismaMock.trades.findFirst.mockResolvedValue({
      id: "trade-1",
      account_id: "acc-1",
      user_id: "user-123",
    } as any);

    prismaMock.trades.deleteMany.mockResolvedValue({ count: 1 } as any);

    const deleteResult = await deleteTradeAction("trade-1");

    expect(deleteResult.success).toBe(true);
    expect(prismaMock.trades.deleteMany).toHaveBeenCalledWith({
      where: { id: "trade-1", user_id: "user-123" },
    });

    // Should revalidate again
    expect(revalidateTag).toHaveBeenCalledTimes(2);
  });
});
