import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getDailyRoutinesAction,
  saveDailyRoutineAction,
  deleteDailyRoutineAction,
} from "../routines";
import { prismaRoutineRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { revalidatePath } from "next/cache";

// Mocks
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => fn,
}));

describe("Routine Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getDailyRoutinesAction", () => {
    it("should return filtered routines", async () => {
      (prismaRoutineRepo.getByAccountId as Mock).mockResolvedValue({
        data: [
          { id: "r-1", userId: mockUserId },
          { id: "r-2", userId: "other" },
        ],
        error: null,
      });

      const result = await getDailyRoutinesAction("acc-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r-1");
    });

    it("should return empty if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getDailyRoutinesAction("acc-1");
      expect(result).toEqual([]);
    });

    it("should return empty if repo error", async () => {
      (prismaRoutineRepo.getByAccountId as Mock).mockResolvedValue({
        data: null,
        error: { message: "Error" },
      });
      const result = await getDailyRoutinesAction("acc-1");
      expect(result).toEqual([]);
    });
  });

  describe("saveDailyRoutineAction", () => {
    it("should save routine and revalidate", async () => {
      (prismaRoutineRepo.save as Mock).mockResolvedValue({
        data: { id: "r-1" },
        error: null,
      });

      const result = await saveDailyRoutineAction({ accountId: "acc-1", aerobic: true });
      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/acc-1", "page");
    });

    it("should fail if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await saveDailyRoutineAction({});
      expect(result.success).toBe(false);
    });

    it("should fail if repo error", async () => {
      (prismaRoutineRepo.save as Mock).mockResolvedValue({
        data: null,
        error: { message: "Error" },
      });
      const result = await saveDailyRoutineAction({});
      expect(result.success).toBe(false);
    });
  });

  describe("deleteDailyRoutineAction", () => {
    it("should delete routine and revalidate", async () => {
      (prismaRoutineRepo.delete as Mock).mockResolvedValue({ data: true, error: null });

      const result = await deleteDailyRoutineAction("r-1", "acc-1");
      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard/acc-1", "page");
    });

    it("should fail if auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await deleteDailyRoutineAction("r-1");
      expect(result.success).toBe(false);
    });
  });
});
