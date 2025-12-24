import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateReport } from "@/services/analytics/report";
import * as tradeActions from "@/app/actions/trades";

// Mock getTrades with correct path
vi.mock("@/app/actions/trades", () => ({
  getTradesAction: vi.fn(),
}));

describe("reportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a report blob", async () => {
    const mockTrades = [
      {
        id: "1",
        accountId: "account-123",
        userId: "user-123",
        entryDate: "2024-01-15T10:00:00.000Z",
        outcome: "win",
        pnl: 100,
        entryPrice: 1.1,
        exitPrice: 1.101,
        type: "Long",
        symbol: "EURUSD",
        lot: 1,
        createdAt: "2024-01-15T10:00:00.000Z",
        updatedAt: "2024-01-15T11:00:00.000Z",
      },
      {
        id: "2",
        accountId: "account-123",
        userId: "user-123",
        entryDate: "2024-01-20T10:00:00.000Z",
        outcome: "loss",
        pnl: -50,
        entryPrice: 1.105,
        exitPrice: 1.1045,
        type: "Long",
        symbol: "EURUSD",
        lot: 1,
        createdAt: "2024-01-20T10:00:00.000Z",
        updatedAt: "2024-01-20T11:00:00.000Z",
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(tradeActions.getTradesAction).mockResolvedValue(mockTrades as any);

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    const blob = await generateReport("account-123", startDate, endDate);

    expect(blob).toBeDefined();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
