import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getAccountsAction,
  getAccountAction,
  saveAccountAction,
  deleteAccountAction,
  updateAccountBalanceAction,
  getSettingsAction,
  saveSettingsAction,
  getUserSettingsAction,
  saveUserSettingsAction,
  checkAccountHasTradesAction,
  syncAllAccountsBalancesAction,
  getAccountById,
} from "../../app/actions/accounts";
import {
  prismaAccountRepo,
  prismaSettingsRepo,
  prismaTradeRepo,
} from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { prisma } from "@/lib/database";
import { revalidateTag } from "next/cache";

// Mocks
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("@/lib/database", () => ({
  prisma: {
    accounts: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => fn,
}));

describe("App Account Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getAccountsAction", () => {
    it("should fetch accounts", async () => {
      (prismaAccountRepo.getByUserId as Mock).mockResolvedValue({
        data: [{ id: "acc-1" }],
        error: null,
      });

      const result = await getAccountsAction();

      expect(prismaAccountRepo.getByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(1);
    });

    it("should return empty if not authenticated", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getAccountsAction();
      expect(result).toEqual([]);
    });
  });

  describe("getAccountAction", () => {
    it("should return account", async () => {
      (prismaAccountRepo.getById as Mock).mockResolvedValue({ data: { id: "acc-1" }, error: null });
      const result = await getAccountAction("acc-1");
      expect(result).toEqual({ id: "acc-1" });
    });
  });

  describe("saveAccountAction", () => {
    it("should create account if id not present", async () => {
      (prismaAccountRepo.create as Mock).mockResolvedValue({
        data: { id: "new-acc" },
        error: null,
      });

      const result = await saveAccountAction({ name: "Testing" });

      expect(prismaAccountRepo.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("should update if id present", async () => {
      (prismaAccountRepo.getById as Mock).mockResolvedValue({ data: { id: "acc-1" }, error: null });
      (prismaAccountRepo.update as Mock).mockResolvedValue({ data: { id: "acc-1" }, error: null });

      const result = await saveAccountAction({ id: "acc-1", name: "Updated" });

      expect(prismaAccountRepo.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("deleteAccountAction", () => {
    it("should delete account", async () => {
      (prismaAccountRepo.delete as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deleteAccountAction("acc-1");
      expect(prismaAccountRepo.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("updateAccountBalanceAction", () => {
    it("should update balance", async () => {
      (prismaAccountRepo.getById as Mock).mockResolvedValue({ data: { id: "acc-1" }, error: null });
      (prismaAccountRepo.updateBalance as Mock).mockResolvedValue({ data: true, error: null });

      const result = await updateAccountBalanceAction("acc-1", 1000);

      expect(prismaAccountRepo.updateBalance).toHaveBeenCalledWith("acc-1", mockUserId, 1000);
      expect(result.success).toBe(true);
    });
  });

  describe("Settings Actions", () => {
    it("should get settings", async () => {
      (prismaSettingsRepo.getSettings as Mock).mockResolvedValue({ data: {}, error: null });
      const result = await getSettingsAction();
      expect(prismaSettingsRepo.getSettings).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it("should save settings", async () => {
      (prismaSettingsRepo.saveSettings as Mock).mockResolvedValue({ data: true, error: null });
      const result = await saveSettingsAction({ setups: ["A"] });
      expect(prismaSettingsRepo.saveSettings).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should get user settings", async () => {
      (prismaSettingsRepo.getUserSettings as Mock).mockResolvedValue({ data: {}, error: null });
      const result = await getUserSettingsAction();
      expect(prismaSettingsRepo.getUserSettings).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it("should save user settings", async () => {
      (prismaSettingsRepo.saveUserSettings as Mock).mockResolvedValue({ data: true, error: null });
      const result = await saveUserSettingsAction({ setups: ["A"] });
      expect(prismaSettingsRepo.saveUserSettings).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("checkAccountHasTradesAction", () => {
    it("should return true if count > 0", async () => {
      (prismaTradeRepo.countByAccountId as Mock).mockResolvedValue({ data: 5, error: null });
      const result = await checkAccountHasTradesAction("acc-1");
      expect(result).toBe(true);
    });

    it("should return false if count 0", async () => {
      (prismaTradeRepo.countByAccountId as Mock).mockResolvedValue({ data: 0, error: null });
      const result = await checkAccountHasTradesAction("acc-1");
      expect(result).toBe(false);
    });
  });

  describe("syncAllAccountsBalancesAction", () => {
    it("should sync balances", async () => {
      (prismaAccountRepo.getByUserId as Mock).mockResolvedValue({
        data: [{ id: "acc-1", initialBalance: 1000, currentBalance: 1000 }],
        error: null,
      });
      (prismaTradeRepo.getDashboardMetrics as Mock).mockResolvedValue({
        data: { totalPnl: 50 },
        error: null,
      });
      (prismaAccountRepo.updateBalance as Mock).mockResolvedValue({ data: true, error: null });

      const result = await syncAllAccountsBalancesAction();

      // 1000 + 50 = 1050 != 1000, so it should sync
      expect(prismaAccountRepo.updateBalance).toHaveBeenCalledWith("acc-1", mockUserId, 1050);
      expect(result.syncedCount).toBe(1);
    });
  });

  describe("getAccountById", () => {
    it("should return mapped account", async () => {
      (prisma.accounts.findFirst as Mock).mockResolvedValue({
        id: "acc-1",
        user_id: mockUserId,
        name: "Direct Account",
        initial_balance: 5000,
        current_balance: 5000,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await getAccountById("acc-1");
      expect(prisma.accounts.findFirst).toHaveBeenCalled();
      expect(result?.name).toBe("Direct Account");
    });

    it("should return null if not found", async () => {
      (prisma.accounts.findFirst as Mock).mockResolvedValue(null);
      const result = await getAccountById("acc-1");
      expect(result).toBeNull();
    });
  });
});
