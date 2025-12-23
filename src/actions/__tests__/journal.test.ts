import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchJournalEntries, createJournalEntry, deleteJournalEntry } from "../journal";

const { mockJournalRepo, mockRoutineRepo, mockSupabase } = vi.hoisted(() => ({
  mockJournalRepo: {
    getByAccountId: vi.fn(),
    save: vi.fn(),
    getById: vi.fn(),
    delete: vi.fn(),
    linkTrade: vi.fn(),
    unlinkTrade: vi.fn(),
  },
  mockRoutineRepo: {
    getByAccountId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
  mockSupabase: {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
}));

vi.mock("@/lib/repositories/prisma", () => ({
  prismaJournalRepo: mockJournalRepo,
  prismaRoutineRepo: mockRoutineRepo,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Journal Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchJournalEntries", () => {
    it("should return entries when authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockJournalRepo.getByAccountId.mockResolvedValue({ data: [{ id: "j-1" }], error: null });

      const result = await fetchJournalEntries("acc-123");

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockJournalRepo.getByAccountId).toHaveBeenCalledWith("acc-123");
      expect(result).toHaveLength(1);
    });

    it("should return empty array if unauthenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await fetchJournalEntries("acc-123");

      expect(mockJournalRepo.getByAccountId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("createJournalEntry", () => {
    it("should create entry and return ID", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockJournalRepo.save.mockResolvedValue({ data: { id: "new-id" }, error: null });

      const result = await createJournalEntry({ title: "New Entry" });

      expect(mockJournalRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Entry",
          userId: "user-123",
        })
      );
      expect(result).toBe("new-id");
    });
  });

  describe("deleteJournalEntry", () => {
    it("should delete entry and images", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

      // Mock existing entry with images
      mockJournalRepo.getById.mockResolvedValue({
        data: {
          id: "j-1",
          userId: "user-123",
          images: [{ path: "img1.png" }],
        },
        error: null,
      });

      mockJournalRepo.delete.mockResolvedValue({ data: true, error: null });

      await deleteJournalEntry("j-1");

      // Verify image deletion
      expect(mockSupabase.storage.from).toHaveBeenCalledWith("journal-images");
      // expect(remove).toHaveBeenCalledWith(["img1.png"]); // Hard to expect chained mock directly

      expect(mockJournalRepo.delete).toHaveBeenCalledWith("j-1", "user-123");
    });

    it("should throw if unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockJournalRepo.getById.mockResolvedValue({
        data: { id: "j-1", userId: "other-user" },
        error: null,
      });

      await expect(deleteJournalEntry("j-1")).rejects.toThrow("Unauthorized");
    });
  });
});
