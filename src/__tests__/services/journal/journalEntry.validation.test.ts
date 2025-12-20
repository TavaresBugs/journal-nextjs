/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveJournalEntry } from "@/services/journal/journal";
import { supabase } from "@/lib/supabase";
import * as accountService from "@/services/core/account";
import { mockUserId, mockAccountId } from "../../fixtures/journalEntry.fixtures";

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

describe("Journal Entry - Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

    // Default mock for successful save
    vi.mocked(supabase.from).mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as any);
  });

  describe("Required Fields", () => {
    it("deve salvar entrada com todos os campos obrigatórios", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "",
        asset: undefined,
        tradeIds: [],
        images: [],
        emotion: undefined,
        analysis: undefined,
        notes: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve falhar se usuário não autenticado (userId missing)", async () => {
      vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

      const entry = {
        id: "entry-1",
        userId: "",
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(false);
    });
  });

  describe("Date Format", () => {
    it("deve aceitar data no formato YYYY-MM-DD", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve aceitar data no início do mês", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-01-01",
        title: "",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve aceitar data no final do mês", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-31",
        title: "",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });
  });

  describe("Special Characters", () => {
    it("deve aceitar notas com emojis", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "🚀 Grande dia!",
        notes: "Trade excelente! 💰📈🎯",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve aceitar notas com caracteres especiais", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "Análise técnica",
        notes: "Suporte em R$5.000,00 - resistência @ 5.500",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve aceitar notas com quebras de linha", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "Multi-linha",
        notes: "Linha 1\nLinha 2\nLinha 3",
        analysis: "Ponto 1\n\nPonto 2",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("deve aceitar notas muito longas", async () => {
      const longNotes = "A".repeat(5000);
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "Longo",
        notes: longNotes,
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry);
      expect(result).toBe(true);
    });

    it("deve aceitar título vazio", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: "",
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry as any);
      expect(result).toBe(true);
    });

    it("deve aceitar todos os campos opcionais como undefined", async () => {
      const entry = {
        id: "entry-1",
        userId: mockUserId,
        accountId: mockAccountId,
        date: "2025-12-11",
        title: undefined,
        asset: undefined,
        emotion: undefined,
        analysis: undefined,
        notes: undefined,
        tradeIds: [],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await saveJournalEntry(entry as any);
      expect(result).toBe(true);
    });
  });
});
