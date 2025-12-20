/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveJournalEntry, getJournalEntries, deleteJournalEntry } from "../journal";
import { createMockJournalEntry } from "@/lib/tests/utils/factories";
import { getCurrentUserId } from "@/services/core/account";

// Mocks
// Mocks
const mocks = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mocks.supabase,
}));

vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/errorHandler", () => ({
  handleServiceError: vi.fn(),
}));

vi.mock("@/lib/utils/imageCompression", () => ({
  compressToWebP: vi.fn().mockResolvedValue({
    webp: new Blob(["test"], { type: "image/webp" }),
    compressedSizeWebP: 100,
    originalSize: 200,
  }),
  base64ToFile: vi.fn().mockReturnValue(new File([""], "test.png", { type: "image/png" })),
}));

// Type helper for mocks
type MockType = any;

describe("Journal Service (New Architecture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default authenticated user
    vi.mocked(getCurrentUserId).mockResolvedValue("user-123");
  });

  describe("getJournalEntries", () => {
    it("should return entries with images and trades loaded", async () => {
      const dbData = [
        {
          id: "j1",
          user_id: "user-123",
          account_id: "acc-1",
          date: "2025-01-01",
          title: "Test Entry",
          journal_images: [{ id: "img1", url: "http://img.com/1.png" }],
          journal_entry_trades: [{ trade_id: "t1" }, { trade_id: "t2" }],
        },
      ];

      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: dbData, error: null }),
      } as MockType);

      const result = await getJournalEntries("acc-1");

      expect(result).toHaveLength(1);
      expect(result[0].tradeIds).toEqual(["t1", "t2"]);
      expect(result[0].images).toHaveLength(1);
      expect(result[0].images[0].url).toContain("http://img.com/1.png");
    });

    it("should handle error gracefully returning empty array", async () => {
      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Fail" } }),
      } as MockType);

      const result = await getJournalEntries("acc-1");
      expect(result).toEqual([]);
    });
  });

  describe("saveJournalEntry", () => {
    it("should save entry, images, and trade links", async () => {
      const entry = createMockJournalEntry({
        tradeIds: ["t1", "t2"],
        images: {
          H1: ["data:image/png;base64,fakecontent"],
        } as any,
      });

      // Mock Supabase Chain

      const fromMock = vi.mocked(mocks.supabase.from);
      fromMock.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }), // Journal
        delete: vi.fn().mockReturnThis(), // cleanup
        eq: vi.fn().mockResolvedValue({ error: null }), // cleanup
        insert: vi.fn().mockResolvedValue({ error: null }), // images/trades
        select: vi.fn().mockReturnThis(), // internal checks
      } as MockType);

      const storageMock = vi.mocked(mocks.supabase.storage.from);
      storageMock.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: "http://storage.com/img.webp" } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as MockType);

      const result = await saveJournalEntry(entry);

      expect(result).toBe(true);

      // Verifications
      expect(fromMock).toHaveBeenCalledWith("journal_entries");
      expect(fromMock).toHaveBeenCalledWith("journal_images");
      expect(fromMock).toHaveBeenCalledWith("journal_entry_trades");

      // Verify Upsert
      expect(fromMock().upsert).toHaveBeenCalled();

      // Verify Image Upload
      expect(storageMock).toHaveBeenCalledWith("journal-images");
      expect(storageMock().upload).toHaveBeenCalled();
      expect(storageMock().getPublicUrl).toHaveBeenCalled();

      // Verify Junction Table
      expect(fromMock().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ trade_id: "t1" }),
          expect.objectContaining({ trade_id: "t2" }),
        ])
      );
    });
  });

  describe("deleteJournalEntry", () => {
    it("should delete entry and associated images", async () => {
      // Mock fetching images
      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ path: "img1.webp" }],
            error: null,
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as MockType);

      // Mock Storage Remove
      const removeSpy = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(mocks.supabase.storage.from).mockReturnValue({
        remove: removeSpy,
      } as MockType);

      const result = await deleteJournalEntry("entry-1");

      expect(result).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith("journal_images");
      expect(removeSpy).toHaveBeenCalledWith(["img1.webp"]);
      expect(mocks.supabase.from).toHaveBeenCalledWith("journal_entries");
    });

    it("should handle error during deletion", async () => {
      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: "Failed" } }),
          }),
        }),
      } as MockType);

      const result = await deleteJournalEntry("entry-1");
      expect(result).toBe(false);
    });
  });
});
