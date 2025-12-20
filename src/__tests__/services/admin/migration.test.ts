/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { migrateLocalStorageToSupabase } from "@/services/admin/migration";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId, saveAccount } from "@/services/core/account";
import { saveTrade } from "@/services/trades/trade";
import { saveJournalEntry } from "@/services/journal/journal";

// Mocks
vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
  saveAccount: vi.fn(),
  saveSettings: vi.fn(),
}));

vi.mock("@/services/trades/trade", () => ({
  saveTrade: vi.fn(),
}));

vi.mock("@/services/journal/journal", () => ({
  saveJournalEntry: vi.fn(),
}));

vi.mock("@/services/journal/routine", () => ({
  saveDailyRoutine: vi.fn(),
}));

describe("Migration Service", () => {
  const mockUser = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear local storage
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
  });

  it("should fail gracefully if user is not authenticated", async () => {
    (getCurrentUserId as any).mockResolvedValue(null);
    const result = await migrateLocalStorageToSupabase();
    expect(result).toBe(false);
  });

  it("should migrate accounts correctly", async () => {
    (getCurrentUserId as any).mockResolvedValue(mockUser);

    const accounts = [{ id: "acc-1", name: "Test" }];
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "tj_accounts") return JSON.stringify(accounts);
      return null;
    });

    const result = await migrateLocalStorageToSupabase();

    expect(saveAccount).toHaveBeenCalledWith({ ...accounts[0], userId: mockUser });
    expect(result).toBe(true);
  });

  it("should migrate trades correctly", async () => {
    (getCurrentUserId as any).mockResolvedValue(mockUser);

    const trades = [{ id: "trade-1", symbol: "EURUSD" }];
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "tj_trades") return JSON.stringify(trades);
      return null;
    });

    const result = await migrateLocalStorageToSupabase();

    expect(saveTrade).toHaveBeenCalledWith({ ...trades[0], userId: mockUser });
    expect(result).toBe(true);
  });

  it("should migrate journal entries with images", async () => {
    (getCurrentUserId as any).mockResolvedValue(mockUser);

    const entries = [
      {
        id: "entry-1",
        date: "2025-12-19",
        accountId: "acc-1",
        asset: "EURUSD",
        images: {
          H1: "data:image/png;base64,aaaa",
        },
      },
    ];
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "tj_journal") return JSON.stringify(entries);
      return null;
    });

    // Mock Supabase storage
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi
      .fn()
      .mockReturnValue({ data: { publicUrl: "http://test.com/img.png" } });

    (supabase.storage.from as any).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const result = await migrateLocalStorageToSupabase();

    expect(uploadMock).toHaveBeenCalled();
    expect(saveJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser,
        images: expect.arrayContaining([
          expect.objectContaining({ url: "http://test.com/img.png" }),
        ]),
      })
    );
    expect(result).toBe(true);
  });

  it("should handle error during migration", async () => {
    (getCurrentUserId as any).mockRejectedValue(new Error("Fatal error"));
    const result = await migrateLocalStorageToSupabase();
    expect(result).toBe(false);
  });
});
