/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

import { prisma } from "@/lib/database";
import { prismaAccountRepo } from "../index";

describe("PrismaAccountRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getByUserId", () => {
    it("should return accounts for a user", async () => {
      const mockAccounts = [
        {
          id: "acc-1",
          user_id: "user-123",
          name: "Main Account",
          currency: "USD",
          initial_balance: 1000,
          current_balance: 1000,
          leverage: "1:100",
          max_drawdown: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockPrisma.accounts.findMany.mockResolvedValue(mockAccounts as any);

      const result = await prismaAccountRepo.getByUserId("user-123");

      expect(mockPrisma.accounts.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        orderBy: { created_at: "desc" },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe("acc-1");
    });
  });

  describe("getById", () => {
    it("should return account if owned by user", async () => {
      const mockAccount = {
        id: "acc-1",
        user_id: "user-123",
        name: "Main Account",
        initial_balance: 1000,
        current_balance: 1000,
        leverage: "1:100",
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockPrisma.accounts.findFirst.mockResolvedValue(mockAccount as any);

      const result = await prismaAccountRepo.getById("acc-1", "user-123");

      expect(mockPrisma.accounts.findFirst).toHaveBeenCalledWith({
        where: { id: "acc-1", user_id: "user-123" },
      });
      expect(result.data?.id).toBe("acc-1");
    });

    it("should return not found if not owned by user", async () => {
      mockPrisma.accounts.findFirst.mockResolvedValue(null);

      const result = await prismaAccountRepo.getById("acc-1", "other-user");

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("DB_NOT_FOUND");
    });
  });

  describe("create", () => {
    it("should create a new account", async () => {
      const mockCreated = {
        id: "acc-new",
        user_id: "user-123",
        name: "New Account",
        initial_balance: 500,
        current_balance: 500,
        leverage: "1:100",
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockPrisma.accounts.create.mockResolvedValue(mockCreated as any);

      const result = await prismaAccountRepo.create({
        userId: "user-123",
        name: "New Account",
        initialBalance: 500,
      });

      expect(mockPrisma.accounts.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          users: { connect: { id: "user-123" } },
          name: "New Account",
          initial_balance: 500,
          current_balance: 500,
        }),
      });
      expect(result.data?.id).toBe("acc-new");
    });
  });

  describe("updateBalance", () => {
    it("should update balance if owned by user", async () => {
      mockPrisma.accounts.findFirst.mockResolvedValue({ id: "acc-1" } as any); // auth check
      mockPrisma.accounts.update.mockResolvedValue({
        id: "acc-1",
        user_id: "user-123",
        current_balance: 750,
        initial_balance: 1000,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const result = await prismaAccountRepo.updateBalance("acc-1", "user-123", 750);

      expect(mockPrisma.accounts.findFirst).toHaveBeenCalledWith({
        where: { id: "acc-1", user_id: "user-123" },
        select: { id: true },
      });
      expect(mockPrisma.accounts.update).toHaveBeenCalledWith({
        where: { id: "acc-1" },
        data: {
          current_balance: 750,
          updated_at: expect.any(Date),
        },
      });
      expect(result.data?.currentBalance).toBe(750);
    });
  });
});
