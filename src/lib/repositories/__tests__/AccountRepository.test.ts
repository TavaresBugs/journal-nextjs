/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AccountRepository } from "@/lib/repositories/AccountRepository";
import { AppError, ErrorCode } from "@/lib/errors";
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";
import { SupabaseClient } from "@supabase/supabase-js";

describe("AccountRepository Unit Tests", () => {
  let repo: AccountRepository;
  let mockSupabase: any;

  const mockDBAccount = {
    id: "account-123",
    user_id: "user-123",
    name: "Main Account",
    currency: "USD",
    initial_balance: 10000,
    current_balance: 12500,
    leverage: "1:100",
    max_drawdown: 500,
    created_at: "2024-12-20T10:00:00Z",
    updated_at: "2024-12-20T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createSupabaseMock();
    repo = new AccountRepository(mockSupabase as unknown as SupabaseClient);
  });

  describe("getByUserId", () => {
    it("should return accounts for valid user ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [mockDBAccount], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("accounts");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe("account-123");
      expect(result.data![0].name).toBe("Main Account");
      expect(result.data![0].currentBalance).toBe(12500);
      expect(result.error).toBeNull();
    });

    it("should return empty array if no accounts found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-empty");
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("getByIdDomain", () => {
    it("should return account by ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
      } as any);

      const result = await repo.getByIdDomain("account-123");

      expect(result.data?.id).toBe("account-123");
      expect(result.data?.initialBalance).toBe(10000);
      expect(result.error).toBeNull();
    });

    it("should return error if account not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      } as any);

      const result = await repo.getByIdDomain("non-existent");
      expect(result.error).toBeInstanceOf(AppError);
    });
  });

  describe("getByIdWithAuth", () => {
    it("should return account if user is authorized", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
      } as any);

      const result = await repo.getByIdWithAuth("account-123", "user-123");

      expect(result.data?.id).toBe("account-123");
      expect(result.error).toBeNull();
    });

    it("should return error if user is not authorized", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await repo.getByIdWithAuth("account-123", "wrong-user");

      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("saveDomain", () => {
    it("should save account", async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
      } as any);

      const account = {
        id: "account-123",
        userId: "user-123",
        name: "Main Account",
        currency: "USD",
        initialBalance: 10000,
        currentBalance: 12500,
        leverage: "1:100",
        maxDrawdown: 500,
        createdAt: "2024-12-20T10:00:00Z",
        updatedAt: "2024-12-20T10:00:00Z",
      };

      const result = await repo.saveDomain(account);

      expect(mockSupabase.from).toHaveBeenCalledWith("accounts");
      expect(result.data?.id).toBe("account-123");
      expect(result.error).toBeNull();
    });
  });

  describe("createDomain", () => {
    it("should create new account", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
      } as any);

      const account = {
        userId: "user-123",
        name: "New Account",
        currency: "EUR",
        initialBalance: 5000,
        currentBalance: 5000,
        leverage: "1:50",
        maxDrawdown: 250,
      };

      const result = await repo.createDomain(account);

      expect(result.data?.id).toBe("account-123");
      expect(result.error).toBeNull();
    });
  });

  describe("deleteDomain", () => {
    it("should delete account if user is authorized", async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "account-123", user_id: "user-123" }, error: null }),
          } as any;
        }
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const result = await repo.deleteDomain("account-123", "user-123");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should return error if user is not authorized", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "account-123", user_id: "other-user" }, error: null }),
      } as any);

      const result = await repo.deleteDomain("account-123", "user-123");

      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("updateBalance", () => {
    it("should update current balance", async () => {
      const updatedAccount = { ...mockDBAccount, current_balance: 15000 };
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedAccount, error: null }),
      } as any);

      const result = await repo.updateBalance("account-123", 15000);

      expect(result.data?.currentBalance).toBe(15000);
      expect(result.error).toBeNull();
    });
  });

  describe("adjustBalance", () => {
    it("should add amount to balance", async () => {
      // First: getByIdDomain, Second: updateBalance
      let callCount = 0;
      const updatedAccount = { ...mockDBAccount, current_balance: 14500 };

      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: updatedAccount, error: null }),
        } as any;
      });

      const result = await repo.adjustBalance("account-123", 2000);

      expect(result.data?.currentBalance).toBe(14500);
      expect(result.error).toBeNull();
    });

    it("should subtract amount from balance", async () => {
      let callCount = 0;
      const updatedAccount = { ...mockDBAccount, current_balance: 11500 };

      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDBAccount, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: updatedAccount, error: null }),
        } as any;
      });

      const result = await repo.adjustBalance("account-123", -1000);

      expect(result.data?.currentBalance).toBe(11500);
      expect(result.error).toBeNull();
    });
  });

  describe("updateMaxDrawdown", () => {
    it("should update max drawdown", async () => {
      const updatedAccount = { ...mockDBAccount, max_drawdown: 750 };
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedAccount, error: null }),
      } as any);

      const result = await repo.updateMaxDrawdown("account-123", 750);

      expect(result.data?.maxDrawdown).toBe(750);
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
        then: vi
          .fn()
          .mockImplementation((cb) => cb({ data: null, error: { message: "Connection failed" } })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-123");

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_QUERY_FAILED);
    });
  });
});
