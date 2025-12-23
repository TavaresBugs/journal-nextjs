/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/prisma";
import { prismaRoutineRepo } from "../index";

describe("PrismaRoutineRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getByAccountId", () => {
    it("should return routines for an account", async () => {
      const mockRoutines = [createMockData.dailyRoutine()];
      mockPrisma.daily_routines.findMany.mockResolvedValue(mockRoutines);

      const result = await prismaRoutineRepo.getByAccountId("account-123");

      expect(mockPrisma.daily_routines.findMany).toHaveBeenCalledWith({
        where: { account_id: "account-123" },
        orderBy: { date: "desc" },
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getByDate", () => {
    it("should return routine by date", async () => {
      const mockRoutine = createMockData.dailyRoutine();
      mockPrisma.daily_routines.findUnique.mockResolvedValue(mockRoutine);

      const result = await prismaRoutineRepo.getByDate("account-123", "2024-12-20");

      expect(mockPrisma.daily_routines.findUnique).toHaveBeenCalledWith({
        where: {
          account_id_date: {
            account_id: "account-123",
            date: expect.any(Date), // repository converts string to Date
          },
        },
      });
      expect(result.data).toBeDefined();
    });
  });

  describe("save", () => {
    it("should upsert a routine", async () => {
      const mockRoutine = createMockData.dailyRoutine();
      mockPrisma.daily_routines.upsert.mockResolvedValue(mockRoutine);

      const input = {
        accountId: "account-123",
        userId: "user-123",
        date: "2024-12-20",
        preMarket: "Bullish",
      };

      const result = await prismaRoutineRepo.save(input as any);

      expect(mockPrisma.daily_routines.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            account_id_date: {
              account_id: "account-123",
              date: expect.any(Date),
            },
          },
          create: expect.objectContaining({
            pre_market: "Bullish",
          }),
          update: expect.objectContaining({
            pre_market: "Bullish",
          }),
        })
      );
      expect(result.data).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete a routine", async () => {
      mockPrisma.daily_routines.deleteMany.mockResolvedValue({ count: 1 });

      const result = await prismaRoutineRepo.delete("routine-123", "user-123");

      expect(mockPrisma.daily_routines.deleteMany).toHaveBeenCalledWith({
        where: { id: "routine-123", user_id: "user-123" },
      });
      expect(result.data).toBe(true);
    });
  });
});
