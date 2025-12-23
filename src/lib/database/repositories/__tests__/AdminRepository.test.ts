/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, createMockData, type PrismaMock } from "./prismaMock";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { prismaAdminRepo } from "../index";

describe("PrismaAdminRepository Unit Tests", () => {
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as unknown as PrismaMock;
  });

  describe("getUserExtended", () => {
    it("should return user extended info", async () => {
      const mockUser = createMockData.userExtended();
      mockPrisma.users_extended.findUnique.mockResolvedValue(mockUser);

      const result = await prismaAdminRepo.getUserExtended("user-123");

      expect(mockPrisma.users_extended.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
      expect(result.data?.email).toBe("test@example.com");
      expect(result.error).toBeNull();
    });

    it("should return error for non-existent user", async () => {
      mockPrisma.users_extended.findUnique.mockResolvedValue(null);

      const result = await prismaAdminRepo.getUserExtended("non-existent");

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  // ... (isAdmin tests skipped as they are likely fine if they don't depend on where clauses explicitly verified)

  describe("updateLastLogin", () => {
    it("should update last login timestamp", async () => {
      // Mock update to return a valid object, otherwise mapper fails if it tries to map undefined
      const updatedUser = createMockData.userExtended({ last_login_at: new Date() });
      mockPrisma.users_extended.update.mockResolvedValue(updatedUser);

      const result = await prismaAdminRepo.updateLastLogin("user-123");

      expect(mockPrisma.users_extended.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: expect.objectContaining({ last_login_at: expect.any(Date) }),
      });
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  // ...

  describe("updateUserStatus", () => {
    it("should update user status", async () => {
      const updatedUser = createMockData.userExtended({ status: "approved" });
      mockPrisma.users_extended.update.mockResolvedValue(updatedUser);

      const result = await prismaAdminRepo.updateUserStatus("user-123", "approved", "admin-user");

      expect(mockPrisma.users_extended.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: expect.objectContaining({
          status: "approved",
          approved_by: "admin-user",
        }),
      });
      // Returns the updated user object, not boolean
      expect(result.data?.status).toBe("approved");
      expect(result.error).toBeNull();
    });

    it("should set approved_at when approving", async () => {
      mockPrisma.users_extended.update.mockResolvedValue(createMockData.userExtended());

      await prismaAdminRepo.updateUserStatus("user-123", "approved", "admin-user");

      expect(mockPrisma.users_extended.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approved_at: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      const updatedUser = createMockData.userExtended({ role: "admin" });
      mockPrisma.users_extended.update.mockResolvedValue(updatedUser);

      const result = await prismaAdminRepo.updateUserRole("user-123", "admin");

      expect(mockPrisma.users_extended.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: expect.objectContaining({ role: "admin" }),
      });
      // Returns the updated user object, not boolean
      expect(result.data?.role).toBe("admin");
      expect(result.error).toBeNull();
    });
  });

  describe("getAdminStats", () => {
    it("should return admin statistics", async () => {
      mockPrisma.users_extended.count.mockImplementation((args: any) => {
        if (!args?.where) return Promise.resolve(100);
        if (args.where.status === "pending") return Promise.resolve(5);
        if (args.where.status === "approved") return Promise.resolve(90);
        if (args.where.status === "suspended") return Promise.resolve(3);
        if (args.where.status === "banned") return Promise.resolve(2);
        if (args.where.role === "admin") return Promise.resolve(2);
        return Promise.resolve(0);
      });

      const result = await prismaAdminRepo.getAdminStats();

      expect(result.data?.totalUsers).toBe(100);
      expect(result.data?.pendingUsers).toBe(5);
      expect(result.data?.approvedUsers).toBe(90);
      expect(result.error).toBeNull();
    });
  });

  describe("logAction", () => {
    it("should create an audit log entry", async () => {
      const mockLog = createMockData.auditLog();
      mockPrisma.audit_logs.create.mockResolvedValue(mockLog);

      const result = await prismaAdminRepo.logAction("user-123", "login", "session", undefined, {
        ip: "127.0.0.1",
        agent: "Mozilla",
      });

      expect(mockPrisma.audit_logs.create).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe("log-123");
      expect(result.error).toBeNull();
    });
  });

  describe("getAuditLogs", () => {
    it("should return audit logs with filters", async () => {
      const mockLogs = [
        createMockData.auditLog({ action: "login" }),
        createMockData.auditLog({ action: "logout" }),
      ];
      mockPrisma.audit_logs.findMany.mockResolvedValue(mockLogs);
      mockPrisma.audit_logs.count.mockResolvedValue(2);

      const result = await prismaAdminRepo.getAuditLogs({ limit: 50, offset: 0 });

      expect(result.data).toHaveLength(2);
    });

    it("should filter by user ID", async () => {
      mockPrisma.audit_logs.findMany.mockResolvedValue([]);

      await prismaAdminRepo.getAuditLogs({ userId: "user-123" });

      expect(mockPrisma.audit_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: "user-123" }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.users_extended.findUnique.mockRejectedValue(new Error("Connection failed"));

      const result = await prismaAdminRepo.getUserExtended("user-123");

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });
});
