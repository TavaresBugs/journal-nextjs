import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveJournalEntry } from "@/services/journal/journal";
import { supabase } from "@/lib/supabase";
import * as accountService from "@/services/core/account";
import { mockUserId, journalEntryWithTrades } from "../../fixtures/journalEntry.fixtures";

// Mock do Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test-url.com" } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

// Mock do accountService
vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
}));

// Mock do errorHandler
vi.mock("@/lib/errorHandler", () => ({
  handleServiceError: vi.fn(),
}));

describe("Journal Entry - Trades Association", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);
  });

  describe("saveJournalEntry with trades", () => {
    it("deve salvar entrada com trades associados", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_images") {
          return {
            delete: mockDelete,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            delete: mockDelete,
            insert: mockInsert,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await saveJournalEntry(journalEntryWithTrades);

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("deve deletar trades antigos antes de inserir novos", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_images") {
          return {
            delete: mockDelete,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            delete: mockDelete,
            insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      await saveJournalEntry(journalEntryWithTrades);

      expect(mockDelete).toHaveBeenCalled();
    });

    it("deve limpar junction table quando não há trades", async () => {
      const entryWithoutTrades = {
        ...journalEntryWithTrades,
        tradeIds: [],
      };

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_images") {
          return {
            delete: mockDelete,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            delete: mockDelete,
            insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await saveJournalEntry(entryWithoutTrades);

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("deve criar links corretos de trade na junction table", async () => {
      let capturedTradeLinks: unknown[] = [];
      const mockInsert = vi.fn().mockImplementation((data) => {
        capturedTradeLinks = data;
        return Promise.resolve({ error: null });
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_images") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            insert: mockInsert,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      await saveJournalEntry(journalEntryWithTrades);

      expect(capturedTradeLinks).toHaveLength(3);
      expect(capturedTradeLinks[0]).toEqual({
        journal_entry_id: journalEntryWithTrades.id,
        trade_id: "trade-1",
      });
    });

    it("deve continuar salvando mesmo se delete de trades falhar", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "journal_entries") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_images") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        if (table === "journal_entry_trades") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: "Delete failed" },
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      // Não deve throw, apenas log o erro
      const result = await saveJournalEntry(journalEntryWithTrades);
      expect(result).toBe(true);
    });
  });
});
