import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  fetchAccounts,
  createAccount,
  updateAccountBalance,
  checkAccountHasTrades,
} from "../accounts";

const { mockAccountRepo, mockTradeRepo, mockSupabase } = vi.hoisted(() => ({
  mockAccountRepo: {
    getByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    updateBalance: vi.fn(),
  },
  mockTradeRepo: {
    countByAccountId: vi.fn(),
  },
  mockSupabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/database/repositories", () => ({
  prismaAccountRepo: mockAccountRepo,
  prismaTradeRepo: mockTradeRepo,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Account Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAccounts", () => {
    it("should fetch accounts for user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockAccountRepo.getByUserId.mockResolvedValue({ data: [{ id: "acc-1" }], error: null });

      const result = await fetchAccounts();

      expect(mockAccountRepo.getByUserId).toHaveBeenCalledWith("user-123");
      expect(result).toHaveLength(1);
    });
  });

  describe("createAccount", () => {
    it("should create account", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockAccountRepo.create.mockResolvedValue({
        data: { id: "acc-1", name: "Main" },
        error: null,
      });

      const result = await createAccount({ name: "Main" });

      expect(mockAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Main",
          userId: "user-123",
        })
      );
      expect(result?.name).toBe("Main");
    });
  });

  describe("updateAccountBalance", () => {
    it("should update balance after ownership check", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

      // Ownership check returns account
      mockAccountRepo.getById.mockResolvedValue({ data: { id: "acc-1" }, error: null });
      mockAccountRepo.updateBalance.mockResolvedValue({
        data: { id: "acc-1", balance: 500 },
        error: null,
      });

      await updateAccountBalance("acc-1", 500);

      expect(mockAccountRepo.getById).toHaveBeenCalledWith("acc-1", "user-123");
      expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith("acc-1", 500);
    });

    it("should throw if account not found (ownership fail)", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockAccountRepo.getById.mockResolvedValue({ data: null, error: null });

      await expect(updateAccountBalance("acc-1", 500)).rejects.toThrow("Account not found");
      expect(mockAccountRepo.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe("checkAccountHasTrades", () => {
    it("should return true if count > 0", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockTradeRepo.countByAccountId.mockResolvedValue({ data: 5, error: null });

      const result = await checkAccountHasTrades("acc-1");

      expect(mockTradeRepo.countByAccountId).toHaveBeenCalledWith("acc-1", "user-123");
      expect(result).toBe(true);
    });
  });
});
