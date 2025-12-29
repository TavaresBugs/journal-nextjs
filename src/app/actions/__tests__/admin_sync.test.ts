import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triggerGithubSyncAction, deleteWeeklyEventsAction } from "../admin";
import { getCurrentUserId } from "@/lib/database/auth";
import { prismaAdminRepo } from "@/lib/database/repositories/AdminRepository";
import { deleteCurrentWeekEvents } from "@/lib/repositories/economicEvents.repository";

// Mock dependencies
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/database/repositories/AdminRepository", () => ({
  prismaAdminRepo: {
    isAdmin: vi.fn(),
    logAction: vi.fn(),
  },
}));

vi.mock("@/lib/repositories/economicEvents.repository", () => ({
  deleteCurrentWeekEvents: vi.fn(),
}));

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("Admin Sync Actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GITHUB_TOKEN = "test-token";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("triggerGithubSyncAction", () => {
    it("should return error if not authenticated", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue(null);

      const result = await triggerGithubSyncAction("calendar");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("should return error if not admin", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue("user-123");
      vi.mocked(prismaAdminRepo.isAdmin).mockResolvedValue({ data: false, error: null });

      const result = await triggerGithubSyncAction("calendar");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authorized");
    });

    it("should trigger calendar workflow successfully", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue("admin-user");
      vi.mocked(prismaAdminRepo.isAdmin).mockResolvedValue({ data: true, error: null });
      globalFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await triggerGithubSyncAction("calendar");

      expect(result.success).toBe(true);
      expect(globalFetch).toHaveBeenCalledWith(
        expect.stringContaining("sync-calendar.yml"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("should trigger history workflow successfully", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue("admin-user");
      vi.mocked(prismaAdminRepo.isAdmin).mockResolvedValue({ data: true, error: null });
      globalFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await triggerGithubSyncAction("history");

      expect(result.success).toBe(true);
      expect(globalFetch).toHaveBeenCalledWith(
        expect.stringContaining("sync-history.yml"),
        expect.any(Object)
      );
    });

    it("should handle GitHub API errors", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue("admin-user");
      vi.mocked(prismaAdminRepo.isAdmin).mockResolvedValue({ data: true, error: null });
      globalFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      } as Response);

      const result = await triggerGithubSyncAction("monthly");

      expect(result.success).toBe(false);
      expect(result.error).toContain("GitHub API Error: 404");
    });
  });

  describe("deleteWeeklyEventsAction", () => {
    it("should return error if not authenticated", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue(null);
      const result = await deleteWeeklyEventsAction();
      expect(result.success).toBe(false);
    });

    it("should delete events successfully", async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue("admin-user");
      vi.mocked(prismaAdminRepo.isAdmin).mockResolvedValue({ data: true, error: null });
      vi.mocked(deleteCurrentWeekEvents).mockResolvedValue(10); // deleted 10 events

      const result = await deleteWeeklyEventsAction();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(10);
      expect(deleteCurrentWeekEvents).toHaveBeenCalled();
    });
  });
});
