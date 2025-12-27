import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getExperimentsAction,
  getExperimentAction,
  createExperimentAction,
  updateExperimentAction,
  deleteExperimentAction,
  addExperimentImagesAction,
  deleteExperimentImagesAction,
  getRecapsAction,
  createRecapAction,
  updateRecapAction,
  deleteRecapAction,
} from "../laboratory";
import { prismaLaboratoryRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";

// Mock Repositories
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));

describe("Laboratory Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getExperimentsAction", () => {
    it("should return experiments", async () => {
      (prismaLaboratoryRepo.getExperiments as Mock).mockResolvedValue({
        data: [{ id: "exp-1" }],
        error: null,
      });
      const result = await getExperimentsAction();
      expect(result).toHaveLength(1);
    });

    it("should return empty if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getExperimentsAction();
      expect(result).toEqual([]);
    });
  });

  describe("getExperimentAction", () => {
    it("should return experiment", async () => {
      (prismaLaboratoryRepo.getExperimentById as Mock).mockResolvedValue({
        data: { id: "1" },
        error: null,
      });
      const result = await getExperimentAction("1");
      expect(result?.id).toBe("1");
    });

    it("should return null if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getExperimentAction("1");
      expect(result).toBeNull();
    });
  });

  describe("createExperimentAction", () => {
    it("should create experiment", async () => {
      (prismaLaboratoryRepo.createExperiment as Mock).mockResolvedValue({
        data: { id: "exp-1", title: "Test" },
        error: null,
      });

      const result = await createExperimentAction({ title: "Test" });
      expect(result.success).toBe(true);
    });

    it("should fail if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await createExperimentAction({ title: "Test" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateExperimentAction", () => {
    it("should update experiment", async () => {
      (prismaLaboratoryRepo.updateExperiment as Mock).mockResolvedValue({
        data: true,
        error: null,
      });
      const result = await updateExperimentAction("exp-1", { title: "Updated" });
      expect(result.success).toBe(true);
    });

    it("should fail if repo error", async () => {
      (prismaLaboratoryRepo.updateExperiment as Mock).mockResolvedValue({
        data: null,
        error: { message: "Err" },
      });
      const result = await updateExperimentAction("exp-1", { title: "Updated" });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteExperimentAction", () => {
    it("should delete experiment", async () => {
      (prismaLaboratoryRepo.deleteExperiment as Mock).mockResolvedValue({
        data: true,
        error: null,
      });
      const result = await deleteExperimentAction("exp-1");
      expect(result.success).toBe(true);
    });
  });

  describe("addExperimentImagesAction", () => {
    it("should add images after ownership check", async () => {
      (prismaLaboratoryRepo.getExperimentById as Mock).mockResolvedValue({
        data: { id: "exp-1" },
        error: null,
      });
      (prismaLaboratoryRepo.addExperimentImages as Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await addExperimentImagesAction("exp-1", [{ imageUrl: "url" }]);
      expect(result.success).toBe(true);
    });

    it("should fail if experiment not found", async () => {
      (prismaLaboratoryRepo.getExperimentById as Mock).mockResolvedValue({
        data: null,
        error: null,
      });
      const result = await addExperimentImagesAction("exp-1", [{ imageUrl: "url" }]);
      expect(result.success).toBe(false);
    });
  });

  describe("deleteExperimentImagesAction", () => {
    it("should delete images", async () => {
      (prismaLaboratoryRepo.deleteExperimentImages as Mock).mockResolvedValue({
        data: true,
        error: null,
      });
      const result = await deleteExperimentImagesAction(["img-1"]);
      expect(result.success).toBe(true);
    });
  });

  describe("Recap Actions", () => {
    it("should get recaps", async () => {
      (prismaLaboratoryRepo.getRecaps as Mock).mockResolvedValue({
        data: [{ id: "recap-1" }],
        error: null,
      });
      const result = await getRecapsAction();
      expect(result).toHaveLength(1);
    });

    it("should create recap", async () => {
      (prismaLaboratoryRepo.createRecap as Mock).mockResolvedValue({
        data: { id: "recap-1" },
        error: null,
      });
      const result = await createRecapAction({ title: "Recap" });
      expect(result.success).toBe(true);
    });

    it("should update recap", async () => {
      (prismaLaboratoryRepo.updateRecap as Mock).mockResolvedValue({ data: true, error: null });
      const result = await updateRecapAction("recap-1", { title: "New" });
      expect(result.success).toBe(true);
    });

    it("should delete recap", async () => {
      (prismaLaboratoryRepo.deleteRecap as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deleteRecapAction("recap-1");
      expect(result.success).toBe(true);
    });
  });
});
