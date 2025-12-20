import { vi, describe, it, expect, beforeEach } from "vitest";
import { TradeRepository } from "@/lib/repositories/TradeRepository";
import { AppError, ErrorCode } from "@/lib/errors";
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";
import { createMockTrade } from "@/lib/tests/utils/factories";
import { mockTrades } from "@/lib/tests/fixtures/tradeFixtures";
import { SupabaseClient } from "@supabase/supabase-js";
import { mapTradeToDB } from "@/services/trades/mappers";

describe("TradeRepository Unit Tests", () => {
  let repo: TradeRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createSupabaseMock();
    repo = new TradeRepository(mockSupabase as unknown as SupabaseClient);
  });

  describe("getByJournalId", () => {
    it("should return trades for valid journal ID", async () => {
      const dbTrade = mapTradeToDB(mockTrades.standard);
      // Mock response from join query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [dbTrade], error: null })),
        // Mock promise resolution if used with await directly
        [Symbol.toStringTag]: "Promise",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByJournalId("journal-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("trades");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe(mockTrades.standard.id);
      expect(result.error).toBeNull();
    });

    it("should return empty array if journal has no trades", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [], error: null })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByJournalId("journal-with-no-trades");
      expect(result.data).toEqual([]);
    });

    it("should respects offset and limit for pagination", async () => {
      const dbTrade = mapTradeToDB(mockTrades.standard);
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [dbTrade], error: null })),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(queryBuilder as any);

      await repo.getByJournalId("journal-123", { limit: 10, offset: 5 });

      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(queryBuilder.range).toHaveBeenCalledWith(5, 14); // 5 + 10 - 1
    });
  });

  describe("getByIdDomain", () => {
    it("should return trade by ID without auth check", async () => {
      const dbTrade = mapTradeToDB(mockTrades.standard);

      // Setup mock for BaseRepository.query -> supabase chain
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbTrade, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByIdDomain("trade-123");

      expect(result.data?.id).toBe(mockTrades.standard.id);
      expect(result.error).toBeNull();
    });

    it("should return error if userId does not match", async () => {
      const dbTrade = mapTradeToDB(mockTrades.standard); // user_id is user-123

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbTrade, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByIdDomain("trade-123", "wrong-user");

      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("getByIdWithAuth", () => {
    it("should return trade if userId is correct", async () => {
      const dbTrade = mapTradeToDB(createMockTrade({ userId: "user-abc" }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbTrade, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByIdWithAuth("trade-123", "user-abc");
      expect(result.data?.userId).toBe("user-abc");
    });

    it("should return error if userId is incorrect", async () => {
      const dbTrade = mapTradeToDB(createMockTrade({ userId: "user-abc" }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbTrade, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByIdWithAuth("trade-123", "wrong-user-id");
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });

    it("should return error if trade not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByIdWithAuth("non-existent-trade", "user-abc");
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("createWithJournal", () => {
    it("should create trade and associate with journal if authorized", async () => {
      const trade = createMockTrade({ id: undefined }); // New trade
      const journal = { id: "j1", user_id: "u1" };
      const createdDbTrade = { ...mapTradeToDB(mockTrades.standard), id: "new-trade-id" };

      // Mock Steps
      // 1. Verify Journal
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: journal, error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "trades") {
          // this.tableName
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdDbTrade, error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await repo.createWithJournal(trade, "j1", "u1");

      expect(result.data?.id).toBe("new-trade-id");
      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entry_trades");
    });

    it("should rollback trade creation if association fails", async () => {
      const trade = createMockTrade({ id: "t1" });
      const journal = { id: "j1", user_id: "u1" };
      const createdDbTrade = { ...mapTradeToDB(mockTrades.standard), id: "new-trade-id-RB" };

      const deleteMock = vi.fn().mockReturnThis();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: journal, error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "trades") {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createdDbTrade, error: null }),
            delete: deleteMock,
            eq: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            insert: vi.fn().mockResolvedValue({ error: { message: "Failed relation" } }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await repo.createWithJournal(trade, "j1", "u1");

      expect(deleteMock).toHaveBeenCalled(); // Should attempt rollback
      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe("getByAccountId", () => {
    it("should return trades for account ID", async () => {
      const dbTrade = mapTradeToDB(mockTrades.standard);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        returns: vi.fn().mockResolvedValue({ data: [dbTrade], error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByAccountId("account-xyz");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("Database Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi
          .fn()
          .mockImplementation((cb) =>
            cb({ data: null, error: { message: "Connection failed", code: "MakeItFail" } })
          ),
        // Needed if `await` calls `then`
        [Symbol.toStringTag]: "Promise",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await repo.getByJournalId("journal-123");
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_QUERY_FAILED);
    });
  });
});
