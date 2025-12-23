/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchPlaybooks, createPlaybook, updatePlaybook, clonePlaybook } from "../playbook";

const { mockPlaybookRepo, mockSupabase } = vi.hoisted(() => ({
  mockPlaybookRepo: {
    getByAccountId: vi.fn(),
    getByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockSupabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/repositories/prisma", () => ({
  prismaPlaybookRepo: mockPlaybookRepo,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Playbook Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPlaybooks", () => {
    it("should fetch by account ID if provided", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockPlaybookRepo.getByAccountId.mockResolvedValue({ data: [{ id: "pb-1" }], error: null });

      const result = await fetchPlaybooks("acc-123");

      expect(mockPlaybookRepo.getByAccountId).toHaveBeenCalledWith("acc-123");
      expect(result).toHaveLength(1);
    });

    it("should fetch by user ID if no account provided", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockPlaybookRepo.getByUserId.mockResolvedValue({ data: [{ id: "pb-2" }], error: null });

      const result = await fetchPlaybooks();

      expect(mockPlaybookRepo.getByUserId).toHaveBeenCalledWith("user-123");
      expect(result).toHaveLength(1);
    });
  });

  describe("createPlaybook", () => {
    it("should create playbook", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockPlaybookRepo.create.mockResolvedValue({
        data: { id: "pb-1", name: "Strategy" },
        error: null,
      });

      const result = await createPlaybook({ name: "Strategy" });

      expect(mockPlaybookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Strategy",
          userId: "user-123",
        })
      );
      expect(result?.name).toBe("Strategy");
    });
  });

  describe("updatePlaybook", () => {
    it("should update playbook", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockPlaybookRepo.update.mockResolvedValue({ data: { id: "pb-1" }, error: null });

      await updatePlaybook({ id: "pb-1", name: "New Name" } as any);

      expect(mockPlaybookRepo.update).toHaveBeenCalledWith(
        "pb-1",
        "user-123",
        expect.objectContaining({
          name: "New Name",
        })
      );
    });
  });

  describe("clonePlaybook", () => {
    it("should clone shared playbook", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockPlaybookRepo.create.mockResolvedValue({ data: { id: "pb-new" }, error: null });

      const sharedPb = {
        id: "shared-1",
        playbook: { name: "Public Strat", ruleGroups: [] },
        description: "Desc",
        // include other required fields minimally
      };

      const result = await clonePlaybook(sharedPb as any);

      expect(mockPlaybookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Public Strat",
          description: "Desc",
          userId: "user-123",
        })
      );
      expect(result).toBeDefined();
    });
  });
});
