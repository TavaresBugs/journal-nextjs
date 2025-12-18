/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportAllData } from "@/services/trades/export";
import { supabase } from "@/lib/supabase";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock getCurrentUserId
vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
}));

import { getCurrentUserId } from "@/services/core/account";

describe("exportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportAllData", () => {
    it("should throw error if user is not authenticated", async () => {
      (getCurrentUserId as any).mockResolvedValue(null);

      await expect(exportAllData()).rejects.toThrow("User not authenticated");
    });

    it("should export all data correctly", async () => {
      const userId = "user-123";
      (getCurrentUserId as any).mockResolvedValue(userId);

      // Mock responses for each table
      const mockAccounts = [
        {
          id: "acc-1",
          user_id: userId,
          name: "Test Account",
          initial_balance: 1000,
          current_balance: 1000,
        },
      ];
      const mockTrades = [
        {
          id: "trade-1",
          user_id: userId,
          account_id: "acc-1",
          symbol: "EURUSD",
          entry_price: 1.1,
          exit_price: 1.2,
          pnl: 100,
        },
      ];
      const mockEntries = [
        { id: "entry-1", user_id: userId, trade_id: "trade-1", title: "My Trade" },
      ];
      const mockPlaybooks = [{ id: "pb-1", user_id: userId, name: "My Strategy" }];
      const mockRoutines = [{ id: "routine-1", user_id: userId, date: "2024-01-01" }];
      const mockSettings = { id: "set-1", user_id: userId, currencies: ["USD"] };
      const mockImages = [
        {
          id: "img-1",
          user_id: userId,
          journal_entry_id: "entry-1",
          url: "http://example.com/img.png",
        },
      ];

      // Generic mock implementation for supabase.from(table).select().eq().range() chain
      const createQueryMock = (data: any[]) => {
        const rangeMock = vi.fn().mockReturnValue({ data, error: null });
        const eqMock = vi
          .fn()
          .mockReturnValue({
            range: rangeMock,
            maybeSingle: vi.fn().mockReturnValue({ data: data[0] || null, error: null }),
          });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
        return { select: selectMock };
      };

      // Using logic of sequential calls in exportAllData
      // 1. accounts, 2. trades, 3. journal_entries, 4. playbooks, 5. daily_routines, 6. settings
      // AND ALSO fetchAll calls 'journal_images' separately inside

      // We can mock 'from' to return different mocks based on table name
      (supabase.from as any).mockImplementation((tableName: string) => {
        switch (tableName) {
          case "accounts":
            return createQueryMock(mockAccounts);
          case "trades":
            return createQueryMock(mockTrades);
          case "journal_entries":
            return createQueryMock(mockEntries);
          case "playbooks":
            return createQueryMock(mockPlaybooks);
          case "daily_routines":
            return createQueryMock(mockRoutines);
          case "settings":
            return createQueryMock([mockSettings]);
          case "journal_images":
            return createQueryMock(mockImages);
          default:
            return createQueryMock([]);
        }
      });

      const result = await exportAllData();

      expect(result).toBeDefined();
      expect(result.version).toBe("1.0");
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].name).toBe("Test Account");
      expect(result.trades).toHaveLength(1);
      expect(result.trades[0].symbol).toBe("EURUSD");
      expect(result.journalEntries).toHaveLength(1);
      expect(result.journalEntries[0].title).toBe("My Trade");
      // Check image association
      expect(result.journalEntries[0].images).toHaveLength(1);
      expect(result.journalEntries[0].images?.[0].url).toBe("http://example.com/img.png");
      expect(result.playbooks).toHaveLength(1);
      expect(result.routines).toHaveLength(1);
      expect(result.settings).toBeDefined();
      expect(result.settings?.currencies).toContain("USD");
    });

    it("should handle pagination in fetchAll", async () => {
      const userId = "user-123";
      (getCurrentUserId as any).mockResolvedValue(userId);

      // Generate 1500 accounts to test pagination (pageSize is 1000)
      const manyAccounts = Array.from({ length: 1500 }, (_, i) => ({
        id: `acc-${i}`,
        user_id: userId,
        name: `Account ${i}`,
        initial_balance: 1000,
        current_balance: 1000,
      }));

      // Mock implementation specifically for accounts to handle pages
      (supabase.from as any).mockImplementation((tableName: string) => {
        if (tableName === "accounts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                range: vi.fn().mockImplementation((start, end) => {
                  // Slice matches array indices
                  // start=0, end=999 => slice (0, 1000) - includes 999
                  const slice = manyAccounts.slice(start, end + 1);
                  return { data: slice, error: null };
                }),
              }),
            }),
          };
        }
        // Return empty for others to ignore
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockReturnValue({ data: null, error: null }),
            }),
          }),
        };
      });

      const result = await exportAllData();

      expect(result.accounts).toHaveLength(1500);
      expect(result.accounts[1499].id).toBe("acc-1499");
    });
  });
});
