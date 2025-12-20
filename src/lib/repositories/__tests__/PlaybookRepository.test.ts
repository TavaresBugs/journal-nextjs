/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PlaybookRepository } from "@/lib/repositories/PlaybookRepository";
import { AppError, ErrorCode } from "@/lib/errors";
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";
import { SupabaseClient } from "@supabase/supabase-js";

describe("PlaybookRepository Unit Tests", () => {
  let repo: PlaybookRepository;
  let mockSupabase: any;

  const mockDBPlaybook = {
    id: "playbook-123",
    user_id: "user-123",
    account_id: "account-123",
    name: "Pullback Strategy",
    description: "Buy on pullbacks in uptrends",
    icon: "📈",
    color: "#00C853",
    rule_groups: [
      {
        id: "rg-1",
        name: "Entry Rules",
        rules: ["Wait for pullback to EMA", "Confirm with volume"],
      },
      {
        id: "rg-2",
        name: "Exit Rules",
        rules: ["Take profit at 2R", "Stop loss below swing low"],
      },
    ],
    created_at: "2024-12-20T10:00:00Z",
    updated_at: "2024-12-20T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createSupabaseMock();
    repo = new PlaybookRepository(mockSupabase as unknown as SupabaseClient);
  });

  describe("getByUserId", () => {
    it("should return playbooks for valid user ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [mockDBPlaybook], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("playbooks");
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe("playbook-123");
      expect(result.data![0].name).toBe("Pullback Strategy");
      expect(result.data![0].ruleGroups).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it("should return empty array if no playbooks found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((cb) => cb({ data: [], error: null })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-empty");
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("getByIdDomain", () => {
    it("should return playbook by ID", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
      } as any);

      const result = await repo.getByIdDomain("playbook-123");

      expect(result.data?.id).toBe("playbook-123");
      expect(result.data?.name).toBe("Pullback Strategy");
      expect(result.error).toBeNull();
    });

    it("should return error if playbook not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      } as any);

      const result = await repo.getByIdDomain("non-existent");
      expect(result.error).toBeInstanceOf(AppError);
    });
  });

  describe("getByName", () => {
    it("should return playbook by name", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
      } as any);

      const result = await repo.getByName("user-123", "Pullback Strategy");

      expect(result.data?.name).toBe("Pullback Strategy");
      expect(result.error).toBeNull();
    });

    it("should return null if playbook not found by name", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await repo.getByName("user-123", "Non-existent");
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe("saveDomain", () => {
    it("should save playbook", async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
      } as any);

      const playbook = {
        id: "playbook-123",
        userId: "user-123",
        name: "Pullback Strategy",
        icon: "📈",
        color: "#00C853",
        ruleGroups: [],
        createdAt: "2024-12-20T10:00:00Z",
        updatedAt: "2024-12-20T10:00:00Z",
      };

      const result = await repo.saveDomain(playbook);

      expect(mockSupabase.from).toHaveBeenCalledWith("playbooks");
      expect(result.data?.id).toBe("playbook-123");
      expect(result.error).toBeNull();
    });
  });

  describe("createDomain", () => {
    it("should create new playbook", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
      } as any);

      const playbook = {
        userId: "user-123",
        name: "New Strategy",
        icon: "🎯",
        color: "#FF5722",
        ruleGroups: [],
      };

      const result = await repo.createDomain(playbook);

      expect(result.data?.id).toBe("playbook-123");
      expect(result.error).toBeNull();
    });
  });

  describe("deleteDomain", () => {
    it("should delete playbook if user is authorized", async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "playbook-123", user_id: "user-123" },
              error: null,
            }),
          } as any;
        }
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const result = await repo.deleteDomain("playbook-123", "user-123");

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should return error if user is not authorized", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "playbook-123", user_id: "other-user" }, error: null }),
      } as any);

      const result = await repo.deleteDomain("playbook-123", "user-123");

      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
    });
  });

  describe("updateRuleGroups", () => {
    it("should update rule groups", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
      } as any);

      const newRuleGroups = [{ id: "rg-new", name: "New Rules", rules: ["Rule 1"] }];

      const result = await repo.updateRuleGroups("playbook-123", newRuleGroups);

      expect(result.data?.id).toBe("playbook-123");
      expect(result.error).toBeNull();
    });
  });

  describe("addRuleGroup", () => {
    it("should add rule group to playbook", async () => {
      // First: getByIdDomain, Second: updateRuleGroups
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockDBPlaybook, error: null }),
        } as any;
      });

      const newRuleGroup = { id: "rg-new", name: "New Group", rules: ["New Rule"] };
      const result = await repo.addRuleGroup("playbook-123", newRuleGroup);

      expect(result.data?.id).toBe("playbook-123");
      expect(result.error).toBeNull();
    });
  });

  describe("Database Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi
          .fn()
          .mockImplementation((cb) => cb({ data: null, error: { message: "Connection failed" } })),
        [Symbol.toStringTag]: "Promise",
      } as any);

      const result = await repo.getByUserId("user-123");

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_QUERY_FAILED);
    });
  });
});
