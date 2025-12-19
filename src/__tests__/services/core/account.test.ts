/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCurrentUserId,
  mapAccountFromDB,
  mapAccountToDB,
  mapSettingsFromDB,
  mapSettingsToDB,
  getAccounts,
  getAccount,
  saveAccount,
  deleteAccount,
  getSettings,
  saveSettings,
  getUserSettings,
  saveUserSettings,
} from "@/services/core/account";
import { supabase } from "@/lib/supabase";
import { handleServiceError } from "@/lib/errorHandler";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/errorHandler", () => ({
  handleServiceError: vi.fn(),
}));

describe("Account Service", () => {
  const mockUserId = "user-123";
  const mockDate = "2023-01-01T00:00:00.000Z";

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful auth by default
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUserId", () => {
    it("should return userId when authenticated", async () => {
      const userId = await getCurrentUserId();
      expect(userId).toBe(mockUserId);
    });

    it("should return null on auth error", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      });
      const userId = await getCurrentUserId();
      expect(userId).toBeNull();
    });

    it("should return null and handle error on exception", async () => {
      (supabase.auth.getUser as any).mockRejectedValue(new Error("Crash"));
      const userId = await getCurrentUserId();
      expect(userId).toBeNull();
      expect(handleServiceError).toHaveBeenCalled();
    });
  });

  describe("Mappers", () => {
    const dbAccount: any = {
      id: "acc-1",
      user_id: "u-1",
      name: "Test Acc",
      currency: "USD",
      initial_balance: 1000,
      current_balance: 1500,
      leverage: 100,
      max_drawdown: 10,
      created_at: mockDate,
      updated_at: mockDate,
    };

    const appAccount: any = {
      id: "acc-1",
      userId: "u-1",
      name: "Test Acc",
      currency: "USD",
      initialBalance: 1000,
      currentBalance: 1500,
      leverage: 100,
      maxDrawdown: 10,
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    it("should map account FROM DB correctly", () => {
      const result = mapAccountFromDB(dbAccount);
      expect(result).toEqual(expect.objectContaining(appAccount));
    });

    it("should map account TO DB correctly", () => {
      const result = mapAccountToDB(appAccount);
      expect(result).toEqual(
        expect.objectContaining({
          id: dbAccount.id,
          user_id: dbAccount.user_id,
          name: dbAccount.name,
          initial_balance: dbAccount.initial_balance,
          // updated_at will be new date
        })
      );
    });

    const dbSettings: any = {
      id: "set-1",
      user_id: "u-1",
      account_id: "acc-1",
      currencies: ["USD"],
      leverages: ["1:100"],
      assets: ["EURUSD"],
      strategies: ["Strat A"],
      setups: ["Setup A"],
      created_at: mockDate,
      updated_at: mockDate,
    };

    const appSettings: any = {
      id: "set-1",
      userId: "u-1",
      accountId: "acc-1",
      currencies: ["USD"],
      leverages: ["1:100"],
      assets: ["EURUSD"],
      strategies: ["Strat A"],
      setups: ["Setup A"],
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    it("should map settings FROM DB correctly", () => {
      const result = mapSettingsFromDB(dbSettings);
      expect(result).toEqual(appSettings);
    });

    it("should map settings TO DB correctly", () => {
      const result = mapSettingsToDB(appSettings);
      expect(result).toEqual(
        expect.objectContaining({
          id: dbSettings.id,
          user_id: dbSettings.user_id,
          // updated_at generated
        })
      );
    });
  });

  describe("getAccounts", () => {
    it("should return accounts list", async () => {
      const mockData = [{ id: "1", user_id: mockUserId, initial_balance: 100 }];
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe("1");
    });

    it("should return empty array if not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
      const accounts = await getAccounts();
      expect(accounts).toEqual([]);
    });

    it("should handle DB error", async () => {
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const accounts = await getAccounts();
      expect(accounts).toEqual([]);
      expect(handleServiceError).toHaveBeenCalled();
    });
  });

  describe("getAccount", () => {
    it("should return account if found", async () => {
      const mockData = { id: "1", user_id: mockUserId, initial_balance: 100 };
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const account = await getAccount("1");
      expect(account?.id).toBe("1");
    });

    it("should return null if not found", async () => {
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const account = await getAccount("1");
      expect(account).toBeNull();
    });
  });

  describe("saveAccount", () => {
    it("should return true on success", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });
      const result = await saveAccount({ id: "1", userId: mockUserId } as any);
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: "Err" } }),
      });
      const result = await saveAccount({ id: "1" } as any);
      expect(result).toBe(false);
      expect(handleServiceError).toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("should return true on success", async () => {
      // We can just reuse a recursive mock strategy or simplified chain
      const eqMock = vi.fn().mockReturnThis();
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: eqMock, then: (cb: any) => cb({ error: null }) }),
      });

      // Actually supabase promises are thenables.
      // Let's refine the mock
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(), // id
      });
      (supabase.from as any).mockReturnValue({ delete: mockDelete });

      // Wait, the chain is delete().eq().eq() and it must resolve.
      // The last eq should return a Promise-like with { error }
      const finalEq = vi.fn().mockResolvedValue({ error: null });
      const firstEq = vi.fn().mockReturnValue({ eq: finalEq });
      mockDelete.mockReturnValue({ eq: firstEq });

      const result = await deleteAccount("1");
      expect(result).toBe(true);
    });
  });

  describe("getSettings", () => {
    it("should return settings", async () => {
      const mockData = { id: "s1", user_id: mockUserId, account_id: "a1" };
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const settings = await getSettings("a1");
      expect(settings?.id).toBe("s1");
    });
  });

  describe("saveSettings", () => {
    it("should return true on success", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });
      const result = await saveSettings({ id: "s1", userId: mockUserId } as any);
      expect(result).toBe(true);
    });
  });

  describe("getUserSettings", () => {
    it("should return user settings", async () => {
      const mockData = { id: "s1", user_id: mockUserId, account_id: null, currencies: [] };
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) });

      const settings = await getUserSettings();
      expect(settings?.user_id).toBe(mockUserId);
    });
  });

  describe("saveUserSettings", () => {
    it("should return true on success", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });
      const result = await saveUserSettings({ currencies: [] } as any);
      expect(result).toBe(true);
    });
  });
});
