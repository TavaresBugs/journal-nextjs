/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { JournalRepository } from "@/lib/repositories/JournalRepository";
import { AppError, ErrorCode } from "@/lib/errors";
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";
import { SupabaseClient } from "@supabase/supabase-js";

describe("JournalRepository Unit Tests", () => {
  let repo: JournalRepository;
  let mockSupabase: any;

  const mockDBJournalEntry = {
    id: "journal-123",
    user_id: "user-123",
    account_id: "account-123",
    date: "2024-12-20",
    title: "Test Journal",
    asset: "EURUSD",
    emotion: "confiante",
    analysis: "Market analysis",
    notes: "Trade notes",
    created_at: "2024-12-20T10:00:00Z",
    updated_at: "2024-12-20T10:00:00Z",
    journal_images: [
      {
        id: "img-1",
        user_id: "user-123",
        journal_entry_id: "journal-123",
        url: "https://example.com/img.jpg",
        path: "journals/img.jpg",
        timeframe: "H4",
        display_order: 0,
        created_at: "2024-12-20T10:00:00Z",
      },
    ],
    journal_entry_trades: [{ trade_id: "trade-1" }, { trade_id: "trade-2" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createSupabaseMock();
    repo = new JournalRepository(mockSupabase as unknown as SupabaseClient);
  });

  describe("getByAccountId", () => {
    it("should return journal entries for valid account ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [mockDBJournalEntry], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByAccountId("account-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entries");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe("journal-123");
      expect(result.data![0].images).toHaveLength(1);
      expect(result.data![0].tradeIds).toEqual(["trade-1", "trade-2"]);
      expect(result.error).toBeNull();
    });

    it("should return empty array if no entries found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByAccountId("account-empty");
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("getByIdDomain", () => {
    it("should return journal entry by ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBJournalEntry, error: null }),
      } as any);

      const result = await repo.getByIdDomain("journal-123");

      expect(result.data?.id).toBe("journal-123");
      expect(result.data?.title).toBe("Test Journal");
      expect(result.error).toBeNull();
    });

    it("should return error if entry not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      } as any);

      const result = await repo.getByIdDomain("non-existent");
      expect(result.error).toBeInstanceOf(AppError);
    });
  });

  describe("getByDateRange", () => {
    it("should return entries within date range", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockDBJournalEntry], error: null }),
      } as any);

      const result = await repo.getByDateRange("account-123", "2024-12-01", "2024-12-31");

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });
  });

  describe("search", () => {
    it("should search entries by query", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockDBJournalEntry], error: null }),
      } as any);

      const result = await repo.search("account-123", "EUR");

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });
  });

  describe("saveDomain", () => {
    it("should save journal entry", async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBJournalEntry, error: null }),
      } as any);

      const entry = {
        id: "journal-123",
        userId: "user-123",
        accountId: "account-123",
        date: "2024-12-20",
        title: "Test Journal",
        images: [],
        createdAt: "2024-12-20T10:00:00Z",
        updatedAt: "2024-12-20T10:00:00Z",
      };

      const result = await repo.saveDomain(entry);

      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entries");
      expect(result.data?.id).toBe("journal-123");
      expect(result.error).toBeNull();
    });
  });

  describe("deleteDomain", () => {
    it("should delete entry if user is authorized", async () => {
      // First call: verify ownership
      // Second call: delete
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "journal-123", user_id: "user-123" }, error: null }),
          } as any;
        }
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const result = await repo.deleteDomain("journal-123", "user-123");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should return error if user is not authorized", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "journal-123", user_id: "other-user" }, error: null }),
      } as any);

      const result = await repo.deleteDomain("journal-123", "user-123");

      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("linkTrade", () => {
    it("should link trade to journal entry", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await repo.linkTrade("journal-123", "trade-456");

      expect(mockSupabase.from).toHaveBeenCalledWith("journal_entry_trades");
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("Database Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi
          .fn()
          .mockImplementation((cb) => cb({ data: null, error: { message: "Connection failed" } })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByAccountId("account-123");

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_QUERY_FAILED);
    });
  });
});
