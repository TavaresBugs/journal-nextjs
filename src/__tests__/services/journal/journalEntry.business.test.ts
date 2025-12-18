import { describe, it, expect, beforeEach, vi } from "vitest";
import { mapJournalEntryFromDB } from "@/services/journal/journal";
import { mockUserId, mockAccountId } from "../../fixtures/journalEntry.fixtures";

// Mock do errorHandler
vi.mock("@/lib/errorHandler", () => ({
  handleServiceError: vi.fn(),
}));

describe("Journal Entry - Business Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Trade Statistics Calculation", () => {
    it("deve mapear entrada com múltiplos trades", () => {
      const dbEntry = {
        id: "entry-1",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: "Dia com trades",
        asset: "EURUSD",
        trade_id: undefined,
        emotion: "confident",
        analysis: "Boa análise",
        notes: "Notas do dia",
        created_at: "2025-12-11T10:00:00.000Z",
        updated_at: "2025-12-11T10:00:00.000Z",
        journal_images: [],
        journal_entry_trades: [
          { trade_id: "trade-1" },
          { trade_id: "trade-2" },
          { trade_id: "trade-3" },
        ],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.tradeIds).toHaveLength(3);
      expect(result.tradeIds).toContain("trade-1");
      expect(result.tradeIds).toContain("trade-2");
      expect(result.tradeIds).toContain("trade-3");
    });

    it("deve retornar array vazio quando não há trades", () => {
      const dbEntry = {
        id: "entry-1",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: "",
        asset: undefined,
        trade_id: undefined,
        emotion: undefined,
        analysis: undefined,
        notes: undefined,
        created_at: "2025-12-11T10:00:00.000Z",
        updated_at: "2025-12-11T10:00:00.000Z",
        journal_images: [],
        journal_entry_trades: [],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.tradeIds).toEqual([]);
    });
  });

  describe("Image Statistics", () => {
    it("deve mapear múltiplas imagens corretamente", () => {
      const dbEntry = {
        id: "entry-1",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: "Com imagens",
        asset: "EURUSD",
        trade_id: undefined,
        emotion: "neutral",
        analysis: undefined,
        notes: undefined,
        created_at: "2025-12-11T10:00:00.000Z",
        updated_at: "2025-12-11T10:00:00.000Z",
        journal_images: [
          {
            id: "img-1",
            user_id: mockUserId,
            journal_entry_id: "entry-1",
            url: "https://example.com/h1.png",
            path: "user/h1.png",
            timeframe: "H1",
            display_order: 0,
            created_at: "2025-12-11T10:00:00.000Z",
          },
          {
            id: "img-2",
            user_id: mockUserId,
            journal_entry_id: "entry-1",
            url: "https://example.com/h4.png",
            path: "user/h4.png",
            timeframe: "H4",
            display_order: 1,
            created_at: "2025-12-11T10:00:00.000Z",
          },
          {
            id: "img-3",
            user_id: mockUserId,
            journal_entry_id: "entry-1",
            url: "https://example.com/d1.png",
            path: "user/d1.png",
            timeframe: "D1",
            display_order: 2,
            created_at: "2025-12-11T10:00:00.000Z",
          },
        ],
        journal_entry_trades: [],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.images).toHaveLength(3);
      expect(result.images[0].timeframe).toBe("H1");
      expect(result.images[1].timeframe).toBe("H4");
      expect(result.images[2].timeframe).toBe("D1");
    });

    it("deve preservar display_order das imagens", () => {
      const dbEntry = {
        id: "entry-1",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: "",
        asset: undefined,
        trade_id: undefined,
        emotion: undefined,
        analysis: undefined,
        notes: undefined,
        created_at: "2025-12-11T10:00:00.000Z",
        updated_at: "2025-12-11T10:00:00.000Z",
        journal_images: [
          {
            id: "img-1",
            user_id: mockUserId,
            journal_entry_id: "entry-1",
            url: "https://example.com/1.png",
            path: "user/1.png",
            timeframe: "H1",
            display_order: 5,
            created_at: "2025-12-11T10:00:00.000Z",
          },
        ],
        journal_entry_trades: [],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.images[0].displayOrder).toBe(5);
    });
  });

  describe("Data Consistency", () => {
    it("deve preservar todos os campos ao mapear", () => {
      const dbEntry = {
        id: "entry-complete",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: "Título Completo",
        asset: "BTCUSD",
        trade_id: undefined,
        emotion: "euphoric",
        analysis: "Análise detalhada do mercado",
        notes: "Anotações importantes",
        created_at: "2025-12-11T08:00:00.000Z",
        updated_at: "2025-12-11T18:00:00.000Z",
        journal_images: [],
        journal_entry_trades: [],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.id).toBe("entry-complete");
      expect(result.userId).toBe(mockUserId);
      expect(result.accountId).toBe(mockAccountId);
      expect(result.date).toBe("2025-12-11");
      expect(result.title).toBe("Título Completo");
      expect(result.asset).toBe("BTCUSD");
      expect(result.emotion).toBe("euphoric");
      expect(result.analysis).toBe("Análise detalhada do mercado");
      expect(result.notes).toBe("Anotações importantes");
      expect(result.createdAt).toBe("2025-12-11T08:00:00.000Z");
      expect(result.updatedAt).toBe("2025-12-11T18:00:00.000Z");
    });

    it("deve lidar com campos null como empty string para title", () => {
      const dbEntry = {
        id: "entry-1",
        user_id: mockUserId,
        account_id: mockAccountId,
        date: "2025-12-11",
        title: null,
        asset: undefined,
        trade_id: undefined,
        emotion: undefined,
        analysis: undefined,
        notes: undefined,
        created_at: "2025-12-11T10:00:00.000Z",
        updated_at: "2025-12-11T10:00:00.000Z",
        journal_images: [],
        journal_entry_trades: [],
      };

      const result = mapJournalEntryFromDB(dbEntry);

      expect(result.title).toBe("");
    });
  });

  describe("Emotion Tracking", () => {
    const emotions = ["euphoric", "confident", "neutral", "anxious", "frustrated", "fearful"];

    emotions.forEach((emotion) => {
      it(`deve mapear emotion "${emotion}" corretamente`, () => {
        const dbEntry = {
          id: "entry-1",
          user_id: mockUserId,
          account_id: mockAccountId,
          date: "2025-12-11",
          title: "",
          asset: undefined,
          trade_id: undefined,
          emotion: emotion,
          analysis: undefined,
          notes: undefined,
          created_at: "2025-12-11T10:00:00.000Z",
          updated_at: "2025-12-11T10:00:00.000Z",
          journal_images: [],
          journal_entry_trades: [],
        };

        const result = mapJournalEntryFromDB(dbEntry);

        expect(result.emotion).toBe(emotion);
      });
    });
  });
});
