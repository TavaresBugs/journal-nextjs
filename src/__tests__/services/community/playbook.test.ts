/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sharePlaybook,
  unsharePlaybook,
  getPublicPlaybooks,
  getMySharedPlaybooks,
  togglePlaybookStar,
} from "@/services/community/playbook";

// Mock Supabase with hoisted structure
const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mocks.supabase,
}));

describe("Playbook Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sharePlaybook", () => {
    it("should return null if user is not authenticated", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await sharePlaybook("p1");
      expect(result).toBeNull();
    });

    it("should create new share if not existing", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      } as any);

      // existing check -> null
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      // insert
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "share1",
            playbook_id: "p1",
            user_id: "u1",
            is_public: true,
            stars: 0,
            downloads: 0,
            created_at: "2023-01-01",
            updated_at: "2023-01-01",
          },
          error: null,
        }),
      } as any);

      const result = await sharePlaybook("p1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("share1");
      expect(mocks.supabase.from).toHaveBeenCalledWith("shared_playbooks");
    });

    it("should update existing share to public", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      } as any);

      // existing check -> found
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { id: "share1", is_public: false }, error: null }),
      } as any);

      // update
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "share1",
            playbook_id: "p1",
            user_id: "u1",
            is_public: true,
            stars: 0,
            downloads: 0,
            created_at: "2023-01-01",
            updated_at: "2023-01-01",
          },
          error: null,
        }),
      } as any);

      const result = await sharePlaybook("p1");
      expect(result).not.toBeNull();
      expect(result?.isPublic).toBe(true);
    });
  });

  describe("unsharePlaybook", () => {
    it("should set is_public to false", async () => {
      vi.mocked(mocks.supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await unsharePlaybook("p1");
      expect(result).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith("shared_playbooks");
    });
  });

  describe("getPublicPlaybooks", () => {
    it("should return empty list on error", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({ data: { user: null } } as any);
      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: "Fail" } }),
      } as any);

      const result = await getPublicPlaybooks();
      expect(result).toEqual([]);
    });

    // Simple success case without complex joins/stats (mocking empty list to verify flow)
    it("should return list of playbooks", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "u1" } },
      } as any);

      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            {
              id: "share1",
              playbook_id: "p1",
              user_id: "u2",
              is_public: true,
              stars: 5,
              downloads: 10,
              created_at: "2023-01-01",
              updated_at: "2023-01-01",
              playbook: { name: "Strat A" },
            },
          ],
          error: null,
        }),
      } as any);

      // mock user stars
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // mock users extended
      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [{ id: "u2", name: "User 2" }], error: null }),
      } as any);

      // mock trades for stats - support chaining .in().in()
      const mockIn = vi.fn().mockReturnThis();
      // The last .in() should return the valid data promise
      mockIn.mockResolvedValueOnce({ data: [], error: null });

      // However, since it's chained: .in(...).in(...)
      // First .in() needs to return object with .in()
      // Simplify: just return an object that has .in which returns the promise or itself
      const mockSelectBuilder = {
        in: vi.fn(),
      };
      // First .in calls returns builder again
      mockSelectBuilder.in.mockReturnValue(mockSelectBuilder);
      // Second .in calls returns the data (or we can use mockImplementation to check args)
      mockSelectBuilder.in.mockImplementation((field) => {
        if (field === "strategy") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockSelectBuilder;
      });

      vi.mocked(mocks.supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue(mockSelectBuilder),
      } as any);

      const result = await getPublicPlaybooks();
      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe("User 2");
    });
  });

  describe("getMySharedPlaybooks", () => {
    it("should return list of shared playbooks", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      } as any);

      vi.mocked(mocks.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "share1",
              playbook_id: "p1",
              user_id: "u1",
              playbook: { name: "My Strat" },
            },
          ],
          error: null,
        }),
      } as any);

      const result = await getMySharedPlaybooks();
      expect(result).toHaveLength(1);
      expect(result[0].playbook?.name).toBe("My Strat");
    });

    it("should return empty list if not logged in", async () => {
      vi.mocked(mocks.supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      const result = await getMySharedPlaybooks();
      expect(result).toEqual([]);
    });
  });

  describe("togglePlaybookStar", () => {
    it("should call rpc", async () => {
      vi.mocked(mocks.supabase.rpc).mockResolvedValue({ data: true, error: null });

      const result = await togglePlaybookStar("share1");
      expect(result).toBe(true);
      expect(mocks.supabase.rpc).toHaveBeenCalledWith("toggle_playbook_star", {
        p_shared_playbook_id: "share1",
      });
    });
  });
});
