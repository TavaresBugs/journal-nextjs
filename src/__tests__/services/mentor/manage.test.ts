import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  acceptInvite,
  rejectInvite,
  revokeInvite,
  getAccountPermissions,
  setAccountPermission,
  removeAccountPermission,
} from "@/services/mentor/invites/manage";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from "@/lib/supabase";

describe("Mentor Invites - Manage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("acceptInvite", () => {
    it("should return false if user is not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await acceptInvite("test-token");

      expect(result).toBe(false);
    });

    it("should accept invite successfully when user is authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as ReturnType<typeof supabase.auth.getUser> extends Promise<infer T> ? T : never);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await acceptInvite("test-token");

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("mentor_invites");
    });

    it("should return false when update fails", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as ReturnType<typeof supabase.auth.getUser> extends Promise<infer T> ? T : never);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await acceptInvite("test-token");

      expect(result).toBe(false);
    });
  });

  describe("rejectInvite", () => {
    it("should reject invite successfully", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await rejectInvite("invite-123");

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("mentor_invites");
    });

    it("should return false when reject fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await rejectInvite("invite-123");

      expect(result).toBe(false);
    });
  });

  describe("revokeInvite", () => {
    it("should revoke invite successfully", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await revokeInvite("invite-123");

      expect(result).toBe(true);
    });

    it("should return false when revoke fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as ReturnType<typeof supabase.from>);

      const result = await revokeInvite("invite-123");

      expect(result).toBe(false);
    });
  });

  describe("getAccountPermissions", () => {
    it("should return permissions on success", async () => {
      const mockData = [
        {
          id: "perm-1",
          invite_id: "invite-123",
          account_id: "account-1",
          accounts: { name: "Main Account" },
          can_view_trades: true,
          can_view_journal: true,
          can_view_routines: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof supabase.from>);

      const result = await getAccountPermissions("invite-123");

      expect(result).toHaveLength(1);
      expect(result[0].accountName).toBe("Main Account");
      expect(result[0].canViewTrades).toBe(true);
    });

    it("should return empty array on error", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as ReturnType<typeof supabase.from>);

      const result = await getAccountPermissions("invite-123");

      expect(result).toEqual([]);
    });
  });

  describe("setAccountPermission", () => {
    it("should set permission successfully", async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as ReturnType<typeof supabase.from>);

      const result = await setAccountPermission("invite-123", "account-1", {
        canViewTrades: true,
        canViewJournal: false,
      });

      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it("should return false on error", async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: { message: "DB error" } });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as ReturnType<typeof supabase.from>);

      const result = await setAccountPermission("invite-123", "account-1", {});

      expect(result).toBe(false);
    });
  });

  describe("removeAccountPermission", () => {
    it("should remove permission successfully", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as ReturnType<typeof supabase.from>);

      const result = await removeAccountPermission("invite-123", "account-1");

      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as ReturnType<typeof supabase.from>);

      const result = await removeAccountPermission("invite-123", "account-1");

      expect(result).toBe(false);
    });
  });
});
