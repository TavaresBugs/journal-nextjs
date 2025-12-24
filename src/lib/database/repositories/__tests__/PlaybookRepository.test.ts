/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

import { prisma } from "@/lib/database";
import { prismaPlaybookRepo } from "../index";

describe("PrismaPlaybookRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getByUserId", () => {
    it("should return playbooks for a user", async () => {
      const mockPlaybooks = [
        {
          id: "pb-1",
          user_id: "user-123",
          name: "My Strategy",
          rule_groups: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockPrisma.playbooks.findMany.mockResolvedValue(mockPlaybooks as any);

      const result = await prismaPlaybookRepo.getByUserId("user-123");

      expect(mockPrisma.playbooks.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        orderBy: { created_at: "desc" },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe("pb-1");
    });
  });

  describe("create", () => {
    it("should create a new playbook", async () => {
      const mockCreated = {
        id: "pb-new",
        user_id: "user-123",
        name: "New Strategy",
        rule_groups: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockPrisma.playbooks.create.mockResolvedValue(mockCreated as any);

      const result = await prismaPlaybookRepo.create({
        userId: "user-123",
        name: "New Strategy",
      });

      expect(mockPrisma.playbooks.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          users: { connect: { id: "user-123" } },
          name: "New Strategy",
        }),
      });
      expect(result.data?.id).toBe("pb-new");
    });
  });

  describe("getById", () => {
    it("should return playbook if owned by user", async () => {
      const mockPlaybook = { id: "pb-1", user_id: "user-123", name: "My Strategy" };
      mockPrisma.playbooks.findFirst.mockResolvedValue(mockPlaybook as any);

      const result = await prismaPlaybookRepo.getById("pb-1", "user-123");

      expect(mockPrisma.playbooks.findFirst).toHaveBeenCalledWith({
        where: { id: "pb-1", user_id: "user-123" },
      });
      expect(result.data?.id).toBe("pb-1");
    });
  });
});
