import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sharePlaybook,
  unsharePlaybook,
  getPublicPlaybooks,
  getMySharedPlaybooks,
  togglePlaybookStar,
  incrementPlaybookDownloads,
} from "@/services/community/playbook";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("Playbook Service", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sharePlaybook", () => {
    it("should return null if user not authenticated", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
      });
      const result = await sharePlaybook("playbook-1");
      expect(result).toBeNull();
    });

    it("should create new share if not exists", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
      });

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "share-1",
            playbook_id: "playbook-1",
            user_id: mockUser.id,
            is_public: true,
            stars: 0,
            downloads: 0,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "shared_playbooks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }), // Not existing
            insert: insertMock,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await sharePlaybook("playbook-1", "Description");
      expect(result?.playbookId).toBe("playbook-1");
      expect(insertMock).toHaveBeenCalled();
    });

    it("should update existing share if exists", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "share-1",
            playbook_id: "playbook-1",
            user_id: mockUser.id,
            is_public: true,
            stars: 0,
            downloads: 0,
          },
          error: null,
        }),
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "shared_playbooks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "share-1" } }), // Existing
            update: updateMock,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any;
      });

      const result = await sharePlaybook("playbook-1");
      expect(updateMock).toHaveBeenCalled();
      expect(result?.id).toBe("share-1");
    });
  });

  describe("unsharePlaybook", () => {
    it("should return true on success", async () => {
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await unsharePlaybook("playbook-1");
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: "Fail" } }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await unsharePlaybook("playbook-1");
      expect(result).toBe(false);
    });
  });

  describe("getPublicPlaybooks", () => {
    it("should return empty list on error", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: "Fail" } }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getPublicPlaybooks();
      expect(result).toEqual([]);
    });

    // We can add a more complex test for successful fetch with Author Stats later
    // For coverage, validating the error path and basic flow is crucial first.
  });

  describe("getMySharedPlaybooks", () => {
    it("should return empty list if not authenticated", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
      });
      const result = await getMySharedPlaybooks();
      expect(result).toEqual([]);
    });

    it("should return list of my playbooks", async () => {
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: "share-1", playbook_id: "p1", user_id: mockUser.id }],
          error: null,
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getMySharedPlaybooks();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("share-1");
    });
  });

  describe("togglePlaybookStar", () => {
    it("should return rpc result", async () => {
      (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await togglePlaybookStar("share-1");
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: "RPC Error" },
      });

      const result = await togglePlaybookStar("share-1");
      expect(result).toBe(false);
    });
  });

  describe("incrementPlaybookDownloads", () => {
    it("should call update with rpc increment", async () => {
      const updateMock = vi.fn().mockReturnThis();
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockResolvedValue({ error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await incrementPlaybookDownloads("share-1");
      expect(updateMock).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith("increment", expect.any(Object));
    });
  });
});
