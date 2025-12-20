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

    it("should return playbooks with calculated author stats", async () => {
      // 1. Mock Auth
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockSharedPlaybooks = [
        {
          id: "share-1",
          playbook_id: "pb-1",
          user_id: "user-A", // Outro user
          is_public: true,
          playbook: { name: "Strategy A", rule_groups: [] },
          stars: 5,
          downloads: 10,
        },
      ];

      const mockTrades = [
        {
          user_id: "user-A",
          strategy: "Strategy A",
          outcome: "win",
          pnl: 100,
          entry_date: "2025-01-01",
          entry_time: "10:00:00",
          exit_date: "2025-01-01",
          exit_time: "11:00:00",
          entry_price: 1.05,
          exit_price: 1.055,
          stop_loss: 1.045,
          symbol: "EURUSD",
        },
        {
          user_id: "user-A",
          strategy: "Strategy A",
          outcome: "loss",
          pnl: -50,
          entry_date: "2025-01-02",
          entry_time: "09:00:00",
          exit_date: "2025-01-02",
          exit_time: "09:30:00",
          entry_price: 1.05,
          exit_price: 1.048,
          stop_loss: 1.048, // Was hit
          symbol: "EURUSD",
        },
      ];

      // Mock Implementation for dynamic table returns
      const fromMock = vi.fn((table: string) => {
        const basicChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
        };

        if (table === "shared_playbooks") {
          return {
            ...basicChain,
            range: vi.fn().mockResolvedValue({ data: mockSharedPlaybooks, error: null }),
          };
        }
        if (table === "playbook_stars") {
          return {
            ...basicChain,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [{ shared_playbook_id: "share-1" }] }),
            }),
          };
        }
        if (table === "users_extended") {
          return {
            ...basicChain,
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [{ id: "user-A", name: "Trader Pro" }] }),
            }),
          };
        }
        if (table === "trades") {
          return {
            ...basicChain,
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnThis(),
              // Mock the second .in() call which executes the query?
              // Actually in Supabase chaining, .in returns the builder. The await executes it.
              // We need to ensure the final chain returns data.
              // Since 'in' allows chaining, we need the last one to have a 'then' or behave like promise.
              // But here we are mocking the return of .select().in().in() chain.
              // Assuming simple mock implementation:
              // Chain: select -> in -> in -> await
            }),
          };
        }
        return basicChain;
      });

      // Refine trades mock because chaining is deeply nested: .select().in().in()
      // We can just spy on the chain.
      const tradesSelectMock = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockTrades, error: null }),
        }),
      });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === "trades") return { select: tradesSelectMock };
        return fromMock(table);
      });

      const result = await getPublicPlaybooks();

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe("Trader Pro");
      expect(result[0].hasUserStarred).toBe(true);

      // Stats check
      const stats = result[0].authorStats;
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalTrades).toBe(2);
        // expect(stats.wins).toBe(1); // 'wins' is not exposed in final object
        expect(stats.netPnl).toBe(50); // 100 - 50
        expect(stats.winRate).toBe(50);
        expect(stats.preferredSymbol).toBe("EURUSD");
      }
    });
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
