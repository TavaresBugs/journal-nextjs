/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getPlaybooksAction,
  getPlaybookStatsAction,
  createPlaybookAction,
  updatePlaybookAction,
  deletePlaybookAction,
  clonePlaybookAction,
} from "../../app/actions/playbooks";
import { prismaPlaybookRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { revalidateTag } from "next/cache";

// Mocks
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),

  unstable_cache: (fn: any) => fn,
}));

describe("Playbook Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getPlaybooksAction", () => {
    it("should get playbooks by user", async () => {
      (prismaPlaybookRepo.getByUserId as Mock).mockResolvedValue({
        data: [{ id: "pb-1" }],
        error: null,
      });

      const result = await getPlaybooksAction();

      expect(prismaPlaybookRepo.getByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(1);
    });

    it("should get playbooks by account", async () => {
      (prismaPlaybookRepo.getByAccountId as Mock).mockResolvedValue({
        data: [{ id: "pb-1" }],
        error: null,
      });

      const result = await getPlaybooksAction("acc-1");

      expect(prismaPlaybookRepo.getByAccountId).toHaveBeenCalledWith("acc-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getPlaybookStatsAction", () => {
    it("should get stats", async () => {
      (prismaPlaybookRepo.getPlaybookStats as Mock).mockResolvedValue({
        data: [{ playbookId: "pb-1", winRate: 50 }],
        error: null,
      });
      const result = await getPlaybookStatsAction();
      expect(result).toHaveLength(1);
    });
  });

  describe("createPlaybookAction", () => {
    it("should create playbook and revalidate", async () => {
      (prismaPlaybookRepo.create as Mock).mockResolvedValue({
        data: { id: "pb-1" },
        error: null,
      });

      const result = await createPlaybookAction({ name: "New Strat" });

      expect(prismaPlaybookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Strat", userId: mockUserId })
      );
      expect(revalidateTag).toHaveBeenCalledWith(`playbooks:${mockUserId}`, "max");
      expect(result.success).toBe(true);
    });
  });

  describe("updatePlaybookAction", () => {
    it("should update playbook", async () => {
      (prismaPlaybookRepo.update as Mock).mockResolvedValue({ data: true, error: null });

      const result = await updatePlaybookAction({ id: "pb-1", name: "Updated" } as any);

      expect(prismaPlaybookRepo.update).toHaveBeenCalledWith(
        "pb-1",
        mockUserId,
        expect.objectContaining({ name: "Updated" })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("deletePlaybookAction", () => {
    it("should delete playbook", async () => {
      (prismaPlaybookRepo.delete as Mock).mockResolvedValue({ data: true, error: null });
      const result = await deletePlaybookAction("pb-1");
      expect(prismaPlaybookRepo.delete).toHaveBeenCalledWith("pb-1", mockUserId);
      expect(result.success).toBe(true);
    });
  });

  describe("clonePlaybookAction", () => {
    it("should clone shared playbook", async () => {
      (prismaPlaybookRepo.create as Mock).mockResolvedValue({
        data: { id: "pb-new" },
        error: null,
      });

      const result = await clonePlaybookAction({
        playbook: { name: "Shared Strat", ruleGroups: [] } as any,
        description: "Shared Desc",
      } as unknown as any);

      expect(prismaPlaybookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Shared Strat", userId: mockUserId })
      );
      expect(result.success).toBe(true);
    });
  });
});
