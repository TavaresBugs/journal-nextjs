/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaMentalRepo } from "../index";

describe("PrismaMentalRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getProfiles", () => {
    it("should return profiles for user", async () => {
      const mockProfiles = [
        createMockData.mentalProfile({ id: "profile-1", category: "fear" }),
        createMockData.mentalProfile({ id: "profile-2", category: "greed" }),
      ];

      mockPrisma.mental_profiles.findMany.mockResolvedValue(mockProfiles);

      const result = await prismaMentalRepo.getProfiles("user-123");

      expect(mockPrisma.mental_profiles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ user_id: "user-123" }),
              expect.objectContaining({ is_system: true }),
            ]),
          }),
          orderBy: [{ category: "asc" }, { severity: "desc" }],
        })
      );
      expect(result.data).toHaveLength(2);
      expect(result.data![0].category).toBe("fear");
      expect(result.error).toBeNull();
    });

    it("should return empty array for user with no profiles", async () => {
      mockPrisma.mental_profiles.findMany.mockResolvedValue([]);

      const result = await prismaMentalRepo.getProfiles("user-empty");

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.mental_profiles.findMany.mockRejectedValue(new Error("DB Error"));

      const result = await prismaMentalRepo.getProfiles("user-123");

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe("getEntries", () => {
    it("should return entries for user with limit", async () => {
      const mockEntries = [
        createMockData.mentalEntry({ id: "entry-1" }),
        createMockData.mentalEntry({ id: "entry-2" }),
      ];

      mockPrisma.mental_entries.findMany.mockResolvedValue(mockEntries);

      const result = await prismaMentalRepo.getEntries("user-123", 10);

      expect(mockPrisma.mental_entries.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        orderBy: { created_at: "desc" },
        take: 10,
      });
      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it("should use default limit of 50", async () => {
      mockPrisma.mental_entries.findMany.mockResolvedValue([]);

      await prismaMentalRepo.getEntries("user-123");

      expect(mockPrisma.mental_entries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe("createEntry", () => {
    it("should create a new entry", async () => {
      const newEntry = createMockData.mentalEntry();
      mockPrisma.mental_entries.create.mockResolvedValue(newEntry);

      const result = await prismaMentalRepo.createEntry("user-123", {
        triggerEvent: "Missed entry",
        emotion: "frustrated",
        behavior: "revenge trading",
        mistake: "Ignored rules",
        correction: "Wait for next setup",
        zoneDetected: "danger",
        source: "grid",
      });

      expect(mockPrisma.mental_entries.create).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("should handle creation errors", async () => {
      mockPrisma.mental_entries.create.mockRejectedValue(new Error("Creation failed"));

      const result = await prismaMentalRepo.createEntry("user-123", {
        triggerEvent: "Test",
      });

      expect(result.error).not.toBeNull();
    });
  });

  describe("deleteEntry", () => {
    it("should delete an entry", async () => {
      mockPrisma.mental_entries.delete.mockResolvedValue({ id: "entry-123" });

      const result = await prismaMentalRepo.deleteEntry("entry-123", "user-123");

      expect(mockPrisma.mental_entries.delete).toHaveBeenCalledWith({
        where: { id: "entry-123", user_id: "user-123" },
      });
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should handle deletion errors", async () => {
      mockPrisma.mental_entries.delete.mockRejectedValue(new Error("Not found"));

      const result = await prismaMentalRepo.deleteEntry("invalid", "user-123");

      expect(result.error).not.toBeNull();
    });
  });

  describe("createProfiles", () => {
    it("should insert profiles for a user", async () => {
      const mockProfiles = [createMockData.mentalProfile()];
      mockPrisma.mental_profiles.createManyAndReturn.mockResolvedValue(mockProfiles);

      const result = await prismaMentalRepo.createProfiles("user-123", [
        { category: "fear", description: "Fear of missing out", zone: "danger", severity: 3 },
      ]);

      expect(mockPrisma.mental_profiles.createManyAndReturn).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });
  });

  describe("hasUserProfiles", () => {
    it("should return true if user has profiles", async () => {
      mockPrisma.mental_profiles.count.mockResolvedValue(5);

      const result = await prismaMentalRepo.hasUserProfiles("user-123");

      expect(mockPrisma.mental_profiles.count).toHaveBeenCalledWith({
        where: { user_id: "user-123", is_system: false },
      });
      expect(result.data).toBe(true);
    });

    it("should return false if user has no profiles", async () => {
      mockPrisma.mental_profiles.count.mockResolvedValue(0);

      const result = await prismaMentalRepo.hasUserProfiles("user-empty");

      expect(result.data).toBe(false);
    });
  });

  describe("createLog", () => {
    it("should create a mental log entry", async () => {
      const mockLog = {
        id: "log-123",
        user_id: "user-123",
        mood_tag: "green",
        step_1_problem: "Test problem",
        step_2_validation: null,
        step_3_flaw: null,
        step_4_correction: null,
        step_5_logic: null,
        created_at: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const mockTx = {
          mental_logs: {
            create: vi.fn().mockResolvedValue(mockLog),
          },
          mental_entries: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(mockTx);
      });

      const result = await prismaMentalRepo.createLog("user-123", {
        moodTag: "green",
        step1Problem: "Test problem",
      });

      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe("getLogs", () => {
    it("should return logs for user", async () => {
      const mockLogs = [
        {
          id: "log-1",
          user_id: "user-123",
          mood_tag: "green",
          step_1_problem: "Test",
          step_2_validation: null,
          step_3_flaw: null,
          step_4_correction: null,
          step_5_logic: null,
          created_at: new Date(),
        },
      ];
      mockPrisma.mental_logs.findMany.mockResolvedValue(mockLogs);

      const result = await prismaMentalRepo.getLogs("user-123", 10);

      expect(mockPrisma.mental_logs.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        orderBy: { created_at: "desc" },
        take: 10,
      });
      expect(result.data).toHaveLength(1);
    });
  });
});
