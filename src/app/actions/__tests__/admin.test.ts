import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import {
  createUserProfileAction,
  getCurrentUserExtendedAction,
  isAdminAction,
  updateUserStatusAction,
} from "../admin";
import { prismaAdminRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { logUserStatusChange } from "@/lib/services/auditService";

// Mock Repositories
vi.mock("@/lib/database/repositories");
vi.mock("@/lib/database/auth", () => ({
  getCurrentUserId: vi.fn().mockResolvedValue("user-123"),
}));
vi.mock("@/lib/services/auditService");

// Mock Prisma calls used directly in some actions
const mockPrismaFunctions = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    users_extended: {
      findUnique: mockPrismaFunctions.findUnique,
      create: mockPrismaFunctions.create,
      delete: mockPrismaFunctions.delete,
    },
  },
}));

describe("Admin Actions", () => {
  const mockUserId = "user-123";
  const mockEmail = "test@test.com";

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  });

  describe("createUserProfileAction", () => {
    it("should create profile if not exists", async () => {
      mockPrismaFunctions.findUnique.mockResolvedValue(null);
      mockPrismaFunctions.create.mockResolvedValue({});

      const result = await createUserProfileAction(mockUserId, mockEmail);

      expect(mockPrismaFunctions.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(mockPrismaFunctions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: mockUserId,
          email: mockEmail,
          status: "pending",
          role: "user",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("should return success if profile already exists", async () => {
      mockPrismaFunctions.findUnique.mockResolvedValue({ id: mockUserId });

      const result = await createUserProfileAction(mockUserId, mockEmail);

      expect(mockPrismaFunctions.create).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe("getCurrentUserExtendedAction", () => {
    it("should return extended user profile", async () => {
      const mockProfile = { id: mockUserId, email: mockEmail };
      (prismaAdminRepo.getUserExtended as Mock).mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getCurrentUserExtendedAction();

      expect(prismaAdminRepo.getUserExtended).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockProfile);
    });

    it("should return null if not authenticated", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(null);

      const result = await getCurrentUserExtendedAction();

      expect(result).toBeNull();
    });
  });

  describe("isAdminAction", () => {
    it("should return true if admin", async () => {
      (prismaAdminRepo.isAdmin as Mock).mockResolvedValue({ data: true, error: null });

      const result = await isAdminAction();

      expect(result).toBe(true);
    });

    it("should return false if not admin", async () => {
      (prismaAdminRepo.isAdmin as Mock).mockResolvedValue({ data: false, error: null });

      const result = await isAdminAction();

      expect(result).toBe(false);
    });
  });

  describe("updateUserStatusAction", () => {
    it("should update status if admin", async () => {
      (prismaAdminRepo.isAdmin as Mock).mockResolvedValue({ data: true, error: null });
      (prismaAdminRepo.getUserExtended as Mock).mockResolvedValue({
        data: { id: "target-1", email: "target@test.com", status: "pending" },
        error: null,
      });
      (prismaAdminRepo.updateUserStatus as Mock).mockResolvedValue({
        data: true, // or whatever it returns
        error: null,
      });

      const result = await updateUserStatusAction("target-1", "approved", "notes");

      expect(prismaAdminRepo.updateUserStatus).toHaveBeenCalledWith(
        "target-1",
        "approved",
        mockUserId,
        "notes"
      );
      expect(logUserStatusChange).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should fail if not authorized", async () => {
      (prismaAdminRepo.isAdmin as Mock).mockResolvedValue({ data: false, error: null });

      const result = await updateUserStatusAction("target-1", "approved");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authorized");
      expect(prismaAdminRepo.updateUserStatus).not.toHaveBeenCalled();
    });
  });
});
