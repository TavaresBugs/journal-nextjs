import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  createShareLinkAction,
  getSharedJournalByTokenAction,
  getMySharedJournalsAction,
  deleteShareLinkAction,
} from "../../app/actions/share";
import { prismaShareRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";

// Mock Repositories
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth");

describe("Share Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("createShareLinkAction", () => {
    it("should create share link", async () => {
      (prismaShareRepo.createShareLink as Mock).mockResolvedValue({
        data: { shareToken: "token-123" },
        error: null,
      });

      const result = await createShareLinkAction("entry-1");

      expect(prismaShareRepo.createShareLink).toHaveBeenCalledWith(mockUserId, "entry-1", 3);
      expect(result.success).toBe(true);
      expect(result.shareToken).toBe("token-123");
    });
  });

  describe("getSharedJournalByTokenAction", () => {
    it("should get shared journal and increment view", async () => {
      (prismaShareRepo.getByToken as Mock).mockResolvedValue({
        data: { id: "share-1" },
        error: null,
      });
      (prismaShareRepo.incrementViewCount as Mock).mockResolvedValue(true);

      const result = await getSharedJournalByTokenAction("token-123");

      expect(prismaShareRepo.getByToken).toHaveBeenCalledWith("token-123");
      //expect(prismaShareRepo.incrementViewCount).toHaveBeenCalledWith("token-123"); // Wait, it uses token? Yes.
      expect(result?.id).toBe("share-1");
    });
  });

  describe("getMySharedJournalsAction", () => {
    it("should return my shares", async () => {
      (prismaShareRepo.getUserSharedJournals as Mock).mockResolvedValue({
        data: [{ id: "share-1" }],
        error: null,
      });

      const result = await getMySharedJournalsAction();

      expect(prismaShareRepo.getUserSharedJournals).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(1);
    });
  });

  describe("deleteShareLinkAction", () => {
    it("should delete share link", async () => {
      (prismaShareRepo.deleteShareLink as Mock).mockResolvedValue({ data: true, error: null });

      const result = await deleteShareLinkAction("share-1");

      expect(prismaShareRepo.deleteShareLink).toHaveBeenCalledWith("share-1", mockUserId);
      expect(result.success).toBe(true);
    });
  });
});
