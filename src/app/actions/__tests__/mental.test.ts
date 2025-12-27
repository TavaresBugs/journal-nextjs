import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getMentalProfilesAction,
  searchMentalProfilesAction,
  getMentalEntriesAction,
  saveMentalEntryAction,
  updateMentalEntryAction,
  deleteMentalEntryAction,
  seedMentalProfilesAction,
  getMentalLogsAction,
  saveMentalLogAction,
  deleteMentalLogAction,
  getZoneAverageAction,
  getZoneStatsAction,
} from "../mental";
import { prismaMentalRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
// import { revalidatePath } from "next/cache";

// Mock Repositories
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

describe("Mental Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  // --- getMentalProfilesAction ---
  describe("getMentalProfilesAction", () => {
    it("should return profiles", async () => {
      (prismaMentalRepo.getProfiles as Mock).mockResolvedValue({
        data: [{ id: "prof-1" }],
        error: null,
      });
      const result = await getMentalProfilesAction();
      expect(result).toHaveLength(1);
    });

    it("should return empty on auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getMentalProfilesAction();
      expect(result).toEqual([]);
    });

    it("should return empty on repo error", async () => {
      (prismaMentalRepo.getProfiles as Mock).mockResolvedValue({
        data: null,
        error: { message: "Err" },
      });
      const result = await getMentalProfilesAction();
      expect(result).toEqual([]);
    });
  });

  // --- searchMentalProfilesAction ---
  describe("searchMentalProfilesAction", () => {
    it("should return searched profiles", async () => {
      (prismaMentalRepo.searchProfiles as Mock).mockResolvedValue({
        data: [{ id: "s-1" }],
        error: null,
      });
      const result = await searchMentalProfilesAction("query");
      expect(prismaMentalRepo.searchProfiles).toHaveBeenCalledWith("query", undefined);
      expect(result).toHaveLength(1);
    });

    it("should return empty on auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      await searchMentalProfilesAction("q");
      expect(prismaMentalRepo.searchProfiles).not.toHaveBeenCalled();
    });
  });

  // --- getMentalEntriesAction ---
  describe("getMentalEntriesAction", () => {
    it("should return entries", async () => {
      (prismaMentalRepo.getEntries as Mock).mockResolvedValue({ data: [], error: null });
      await getMentalEntriesAction();
      expect(prismaMentalRepo.getEntries).toHaveBeenCalled();
    });
  });

  // --- saveMentalEntryAction ---
  describe("saveMentalEntryAction", () => {
    it("should save entry and revalidate", async () => {
      (prismaMentalRepo.createEntry as Mock).mockResolvedValue({
        data: { id: "entry-1" },
        error: null,
      });

      const result = await saveMentalEntryAction({ emotion: "Fear" });
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await saveMentalEntryAction({});
      expect(result.success).toBe(false);
    });

    it("should fail on repo error", async () => {
      (prismaMentalRepo.createEntry as Mock).mockResolvedValue({
        data: null,
        error: { message: "Err" },
      });
      const result = await saveMentalEntryAction({});
      expect(result.success).toBe(false);
    });
  });

  // --- updateMentalEntryAction ---
  describe("updateMentalEntryAction", () => {
    it("should update entry", async () => {
      (prismaMentalRepo.updateEntry as Mock).mockResolvedValue({ data: { id: "1" }, error: null });
      const result = await updateMentalEntryAction("1", { emotion: "Happy" });
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await updateMentalEntryAction("1", {});
      expect(result.success).toBe(false);
    });
  });

  // --- deleteMentalEntryAction ---
  describe("deleteMentalEntryAction", () => {
    it("should delete entry", async () => {
      (prismaMentalRepo.deleteEntry as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deleteMentalEntryAction("1");
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await deleteMentalEntryAction("1");
      expect(result.success).toBe(false);
    });
  });

  // --- seedMentalProfilesAction ---
  describe("seedMentalProfilesAction", () => {
    it("should seed profiles", async () => {
      (prismaMentalRepo.createProfiles as Mock).mockResolvedValue({ data: true, error: null });
      const result = await seedMentalProfilesAction("fear");
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await seedMentalProfilesAction("all");
      expect(result.success).toBe(false);
    });
  });

  // --- getMentalLogsAction ---
  describe("getMentalLogsAction", () => {
    it("should return logs", async () => {
      (prismaMentalRepo.getLogs as Mock).mockResolvedValue({ data: [], error: null });
      await getMentalLogsAction();
      expect(prismaMentalRepo.getLogs).toHaveBeenCalled();
    });
  });

  // --- saveMentalLogAction ---
  describe("saveMentalLogAction", () => {
    it("should create log", async () => {
      (prismaMentalRepo.createLog as Mock).mockResolvedValue({
        data: { id: "log-1" },
        error: null,
      });
      const result = await saveMentalLogAction({ moodTag: "Good", step1Problem: "None" });
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await saveMentalLogAction({ moodTag: "Bad", step1Problem: "X" });
      expect(result.success).toBe(false);
    });
  });

  // --- deleteMentalLogAction ---
  describe("deleteMentalLogAction", () => {
    it("should delete log", async () => {
      (prismaMentalRepo.deleteLog as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deleteMentalLogAction("1");
      expect(result.success).toBe(true);
    });

    it("should fail on auth", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await deleteMentalLogAction("1");
      expect(result.success).toBe(false);
    });
  });

  // --- getZoneStatsAction ---
  describe("getZoneStatsAction", () => {
    it("should return zone stats", async () => {
      (prismaMentalRepo.getZoneStats as Mock).mockResolvedValue({
        data: { aGame: 10, bGame: 5, cGame: 2 },
        error: null,
      });
      const result = await getZoneStatsAction();
      expect(result.aGame).toBe(10);
    });

    it("should return defaults on auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getZoneStatsAction();
      expect(result).toEqual({ aGame: 0, bGame: 0, cGame: 0 });
    });
  });

  // --- getZoneAverageAction ---
  describe("getZoneAverageAction", () => {
    it("should return average", async () => {
      (prismaMentalRepo.getZoneAverage as Mock).mockResolvedValue({ data: 3.5, error: null });
      const result = await getZoneAverageAction();
      expect(result).toBe(3.5);
    });

    it("should return 0 on auth fail", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);
      const result = await getZoneAverageAction();
      expect(result).toBe(0);
    });
  });
});
