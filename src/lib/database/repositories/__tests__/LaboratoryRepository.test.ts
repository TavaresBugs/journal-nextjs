/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaLaboratoryRepo } from "../index";

describe("PrismaLaboratoryRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("EXPERIMENTS", () => {
    describe("getExperiments", () => {
      it("should return experiments for user", async () => {
        const mockExperiments = [
          createMockData.experiment({ id: "exp-1", title: "Strategy A" }),
          createMockData.experiment({ id: "exp-2", title: "Strategy B" }),
        ];

        mockPrisma.laboratory_experiments.findMany.mockResolvedValue(mockExperiments);

        const result = await prismaLaboratoryRepo.getExperiments("user-123");

        expect(mockPrisma.laboratory_experiments.findMany).toHaveBeenCalledWith({
          where: { user_id: "user-123" },
          include: { laboratory_images: true },
          orderBy: { created_at: "desc" },
        });
        expect(result.data).toHaveLength(2);
        expect(result.data![0].title).toBe("Strategy A");
        expect(result.error).toBeNull();
      });

      it("should return empty array for user with no experiments", async () => {
        mockPrisma.laboratory_experiments.findMany.mockResolvedValue([]);

        const result = await prismaLaboratoryRepo.getExperiments("user-empty");

        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
      });
    });

    describe("getExperimentById", () => {
      it("should return experiment by ID", async () => {
        const mockExperiment = createMockData.experiment({ id: "exp-123" });
        mockPrisma.laboratory_experiments.findFirst.mockResolvedValue(mockExperiment);

        const result = await prismaLaboratoryRepo.getExperimentById("exp-123", "user-123");

        expect(mockPrisma.laboratory_experiments.findFirst).toHaveBeenCalledWith({
          where: { id: "exp-123", user_id: "user-123" },
          include: { laboratory_images: true },
        });
        expect(result.data?.id).toBe("exp-123");
        expect(result.error).toBeNull();
      });

      it("should return error if experiment not found", async () => {
        mockPrisma.laboratory_experiments.findFirst.mockResolvedValue(null);

        const result = await prismaLaboratoryRepo.getExperimentById("invalid", "user-123");

        expect(result.error).not.toBeNull();
        expect(result.data).toBeNull();
      });
    });

    describe("createExperiment", () => {
      it("should create a new experiment", async () => {
        const mockCreated = createMockData.experiment({ title: "New Strategy" });
        mockPrisma.laboratory_experiments.create.mockResolvedValue(mockCreated);

        const result = await prismaLaboratoryRepo.createExperiment("user-123", {
          title: "New Strategy",
          description: "Test description",
          status: "em_aberto",
          category: "momentum",
        });

        expect(mockPrisma.laboratory_experiments.create).toHaveBeenCalled();
        expect(result.data?.title).toBe("New Strategy");
        expect(result.error).toBeNull();
      });
    });

    describe("updateExperiment", () => {
      it("should update an experiment", async () => {
        const mockUpdated = createMockData.experiment({ title: "Updated Title" });
        mockPrisma.laboratory_experiments.update.mockResolvedValue(mockUpdated);

        const result = await prismaLaboratoryRepo.updateExperiment("exp-123", "user-123", {
          title: "Updated Title",
        });

        expect(mockPrisma.laboratory_experiments.update).toHaveBeenCalledWith({
          where: { id: "exp-123", user_id: "user-123" },
          data: expect.objectContaining({ title: "Updated Title" }),
          include: { laboratory_images: true },
        });
        expect(result.data?.title).toBe("Updated Title");
        expect(result.error).toBeNull();
      });
    });

    describe("deleteExperiment", () => {
      it("should delete an experiment", async () => {
        mockPrisma.laboratory_experiments.delete.mockResolvedValue({ id: "exp-123" });

        const result = await prismaLaboratoryRepo.deleteExperiment("exp-123", "user-123");

        expect(mockPrisma.laboratory_experiments.delete).toHaveBeenCalledWith({
          where: { id: "exp-123", user_id: "user-123" },
        });
        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    describe("addExperimentImages", () => {
      it("should add images to an experiment", async () => {
        const mockImages = [
          {
            id: "img-1",
            experiment_id: "exp-123",
            image_url: "http://...",
            description: null,
            uploaded_at: new Date(),
          },
        ];
        mockPrisma.laboratory_images.createManyAndReturn.mockResolvedValue(mockImages);

        const result = await prismaLaboratoryRepo.addExperimentImages("exp-123", [
          { imageUrl: "http://...", description: "Chart screenshot" },
        ]);

        expect(mockPrisma.laboratory_images.createManyAndReturn).toHaveBeenCalled();
        expect(result.data).toHaveLength(1);
        expect(result.error).toBeNull();
      });
    });
  });

  describe("RECAPS", () => {
    describe("getRecaps", () => {
      it("should return recaps for user", async () => {
        const mockRecaps = [
          createMockData.recap({ id: "recap-1", title: "Weekly Review 1" }),
          createMockData.recap({ id: "recap-2", title: "Weekly Review 2" }),
        ];

        mockPrisma.laboratory_recaps.findMany.mockResolvedValue(mockRecaps);

        const result = await prismaLaboratoryRepo.getRecaps("user-123");

        expect(mockPrisma.laboratory_recaps.findMany).toHaveBeenCalledWith({
          where: { user_id: "user-123" },
          include: {
            laboratory_recap_trades: { include: { trades: true } },
            trades: true,
          },
          orderBy: { created_at: "desc" },
        });
        expect(result.data).toHaveLength(2);
        expect(result.error).toBeNull();
      });
    });

    describe("createRecap", () => {
      it("should create a new recap", async () => {
        const mockCreated = createMockData.recap({ title: "New Recap" });

        mockPrisma.$transaction.mockImplementation(async (fn: any) => {
          const mockTx = {
            laboratory_recaps: {
              create: vi.fn().mockResolvedValue(mockCreated),
              findUnique: vi.fn().mockResolvedValue(mockCreated),
            },
            laboratory_recap_trades: {
              createMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
          };
          return fn(mockTx);
        });

        const result = await prismaLaboratoryRepo.createRecap("user-123", {
          title: "New Recap",
          whatWorked: "Patience",
          whatFailed: "Overtrading",
          reviewType: "weekly",
        });

        expect(result.data?.title).toBe("New Recap");
        expect(result.error).toBeNull();
      });
    });

    describe("deleteRecap", () => {
      it("should delete a recap", async () => {
        mockPrisma.laboratory_recaps.delete.mockResolvedValue({ id: "recap-123" });

        const result = await prismaLaboratoryRepo.deleteRecap("recap-123", "user-123");

        expect(mockPrisma.laboratory_recaps.delete).toHaveBeenCalledWith({
          where: { id: "recap-123", user_id: "user-123" },
        });
        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.laboratory_experiments.findMany.mockRejectedValue(new Error("Connection failed"));

      const result = await prismaLaboratoryRepo.getExperiments("user-123");

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });
});
