import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  getJournalEntriesAction,
  getJournalEntryAction,
  saveJournalEntryAction,
  deleteJournalEntryAction,
  linkTradeToJournalAction,
  unlinkTradeFromJournalAction,
  addJournalImageAction,
  removeJournalImageAction,
} from "../../app/actions/journal";
import { prismaJournalRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

// Mocks
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("@/lib/supabase/server");
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // Mock unstable_cache as a simple pass-through function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => fn,
}));

describe("Journal Actions", () => {
  const mockUserId = "user-123";
  const mockAccountId = "account-123";
  const mockEntryId = "entry-123";

  const mockEntry = {
    id: mockEntryId,
    userId: mockUserId,
    accountId: mockAccountId,
    title: "Test Entry",
    content: "Content",
    date: "2023-01-01",
    images: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("getJournalEntriesAction", () => {
    it("should return filtered entries for authenticated user", async () => {
      // Mock repo returning mixed entries
      const entries = [mockEntry, { ...mockEntry, id: "other", userId: "other-user" }];

      (prismaJournalRepo.getByAccountId as Mock).mockResolvedValue({
        data: entries,
        error: null,
      });

      const result = await getJournalEntriesAction(mockAccountId);

      expect(prismaJournalRepo.getByAccountId).toHaveBeenCalledWith(mockAccountId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockEntryId);
    });

    it("should return empty array if not authenticated", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);

      const result = await getJournalEntriesAction(mockAccountId);

      expect(result).toEqual([]);
      expect(prismaJournalRepo.getByAccountId).not.toHaveBeenCalled();
    });

    it("should return empty array on repo error", async () => {
      (prismaJournalRepo.getByAccountId as Mock).mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });

      // Suppress console error
      vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await getJournalEntriesAction(mockAccountId);

      expect(result).toEqual([]);
    });
  });

  describe("getJournalEntryAction", () => {
    it("should return entry if found and authorized", async () => {
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: mockEntry,
        error: null,
      });

      const result = await getJournalEntryAction(mockEntryId);

      expect(result).toEqual(mockEntry);
    });

    it("should return null if repo returns error", async () => {
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: null,
        error: { message: "Not Found", code: "DB_NOT_FOUND" },
      });

      const result = await getJournalEntryAction(mockEntryId);

      expect(result).toBeNull();
    });
  });

  describe("saveJournalEntryAction", () => {
    it("should save entry and revalidate paths", async () => {
      (prismaJournalRepo.save as Mock).mockResolvedValue({
        data: mockEntry,
        error: null,
      });

      const result = await saveJournalEntryAction(mockEntry);

      expect(prismaJournalRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockEntry,
          userId: mockUserId,
        })
      );
      expect(revalidateTag).toHaveBeenCalledWith(`journal:${mockAccountId}`, "max");
      expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/${mockAccountId}`, "page");
      expect(result.success).toBe(true);
      expect(result.entry).toEqual(mockEntry);
    });

    it("should fail if not authenticated", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);

      const result = await saveJournalEntryAction(mockEntry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });
  });

  describe("deleteJournalEntryAction", () => {
    it("should delete entry and images", async () => {
      // Mock existing entry with images
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: { ...mockEntry, images: [{ path: "img1.jpg" }] },
        error: null,
      });

      // Mock storage removal
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockStorage = { from: vi.fn(() => ({ remove: mockRemove })) };
      (createClient as Mock).mockImplementation(() => ({ storage: mockStorage }));

      // Mock DB deletion
      (prismaJournalRepo.delete as Mock).mockResolvedValue({ data: true, error: null });

      const result = await deleteJournalEntryAction(mockEntryId);

      expect(mockRemove).toHaveBeenCalledWith(["img1.jpg"]);
      expect(prismaJournalRepo.delete).toHaveBeenCalledWith(mockEntryId, mockUserId);
      expect(result.success).toBe(true);
    });
  });

  describe("linkTradeToJournalAction", () => {
    it("should link trade if authorized", async () => {
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: mockEntry,
        error: null,
      });
      (prismaJournalRepo.linkTrade as Mock).mockResolvedValue({ data: true, error: null });

      const result = await linkTradeToJournalAction(mockEntryId, "trade-123");

      expect(result.success).toBe(true);
    });
  });

  describe("unlinkTradeFromJournalAction", () => {
    it("should unlink trade if authorized", async () => {
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: mockEntry,
        error: null,
      });
      (prismaJournalRepo.unlinkTrade as Mock).mockResolvedValue({ data: true, error: null });

      const result = await unlinkTradeFromJournalAction(mockEntryId, "trade-123");

      expect(result.success).toBe(true);
    });
  });

  describe("addJournalImageAction", () => {
    it("should add image metadata", async () => {
      (prismaJournalRepo.getById as Mock).mockResolvedValue({
        data: mockEntry,
        error: null,
      });
      (prismaJournalRepo.addImage as Mock).mockResolvedValue({
        data: { id: "img-1", url: "url" },
        error: null,
      });

      const result = await addJournalImageAction(mockEntryId, {
        url: "url",
        path: "path",
        timeframe: "1h",
      });

      expect(prismaJournalRepo.addImage).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("removeJournalImageAction", () => {
    it("should remove image metadata", async () => {
      (prismaJournalRepo.removeImage as Mock).mockResolvedValue({ data: true, error: null });

      const result = await removeJournalImageAction("img-1");

      expect(prismaJournalRepo.removeImage).toHaveBeenCalledWith("img-1");
      expect(result.success).toBe(true);
    });
  });
});
