/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPrismaMock, type PrismaMock } from "./prismaMock";
import type { settings as PrismaSettings } from "@/generated/prisma";

// Mock Prisma client
vi.mock("@/lib/database", () => ({
  prisma: createPrismaMock(),
}));

// Mock Logger
vi.mock("@/lib/logging/Logger", () => ({
  Logger: vi.fn().mockImplementation(function (this: any) {
    this.info = vi.fn();
    this.error = vi.fn();
    this.warn = vi.fn();
  }),
}));

// Import after mocking
import { prisma } from "@/lib/database";
import { PrismaSettingsRepository } from "../SettingsRepository";

describe("PrismaSettingsRepository Unit Tests", () => {
  let repository: PrismaSettingsRepository;
  let mockPrisma: PrismaMock;

  beforeEach(() => {
    repository = new PrismaSettingsRepository();
    mockPrisma = prisma as unknown as PrismaMock;
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return settings for a user", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-1",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD", "EUR"],
        leverages: ["1:100", "1:200"],
        assets: { EURUSD: 1.0, GBPUSD: 1.5 },
        strategies: ["Scalping", "Swing"],
        setups: ["Breakout", "Reversal"],
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      mockPrisma.settings.findFirst.mockResolvedValue(mockSettings);

      const result = await repository.getSettings("user-123");

      expect(result.data).toEqual({
        id: "settings-1",
        userId: "user-123",
        accountId: undefined,
        currencies: ["USD", "EUR"],
        leverages: ["1:100", "1:200"],
        assets: { EURUSD: 1.0, GBPUSD: 1.5 },
        strategies: ["Scalping", "Swing"],
        setups: ["Breakout", "Reversal"],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(result.error).toBeNull();
      expect(mockPrisma.settings.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: "user-123",
          account_id: null,
        },
      });
    });

    it("should return settings for a specific account", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-2",
        user_id: "user-123",
        account_id: "account-456",
        currencies: ["USD"],
        leverages: ["1:50"],
        assets: { EURUSD: 2.0 },
        strategies: ["Day Trading"],
        setups: ["Support"],
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      mockPrisma.settings.findFirst.mockResolvedValue(mockSettings);

      const result = await repository.getSettings("user-123", "account-456");

      expect(result.data?.accountId).toBe("account-456");
      expect(result.error).toBeNull();
      expect(mockPrisma.settings.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: "user-123",
          account_id: "account-456",
        },
      });
    });

    it("should return error when settings not found", async () => {
      mockPrisma.settings.findFirst.mockResolvedValue(null);

      const result = await repository.getSettings("user-123");

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Settings not found");
      expect(result.error?.statusCode).toBe(404);
    });

    it("should handle database errors", async () => {
      mockPrisma.settings.findFirst.mockRejectedValue(new Error("DB Error"));

      const result = await repository.getSettings("user-123");

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to fetch settings");
      expect(result.error?.statusCode).toBe(500);
    });
  });

  describe("getUserSettings", () => {
    it("should return user settings", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-1",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD", "EUR"],
        leverages: ["1:100"],
        assets: { EURUSD: 1.0, GBPUSD: 1.5 },
        strategies: ["Scalping"],
        setups: ["Breakout"],
        created_at: new Date("2024-01-01"),
        updated_at: new Date("2024-01-02"),
      };

      mockPrisma.settings.findFirst.mockResolvedValue(mockSettings);

      const result = await repository.getUserSettings("user-123");

      expect(result.data).toEqual({
        id: "settings-1",
        user_id: "user-123",
        currencies: ["USD", "EUR"],
        leverages: ["1:100"],
        assets: [
          { symbol: "EURUSD", multiplier: 1.0 },
          { symbol: "GBPUSD", multiplier: 1.5 },
        ],
        strategies: ["Scalping"],
        setups: ["Breakout"],
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result.error).toBeNull();
    });

    it("should return error when user settings not found", async () => {
      mockPrisma.settings.findFirst.mockResolvedValue(null);

      const result = await repository.getUserSettings("user-123");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("User settings not found");
      expect(result.error?.statusCode).toBe(404);
    });

    it("should handle database errors", async () => {
      mockPrisma.settings.findFirst.mockRejectedValue(new Error("DB Error"));

      const result = await repository.getUserSettings("user-123");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Failed to fetch user settings");
    });
  });

  describe("saveSettings", () => {
    it("should create new settings", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-new",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD"],
        leverages: ["1:100"],
        assets: { EURUSD: 1.0 },
        strategies: ["Scalping"],
        setups: ["Breakout"],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.settings.upsert.mockResolvedValue(mockSettings);

      const result = await repository.saveSettings({
        userId: "user-123",
        currencies: ["USD"],
        leverages: ["1:100"],
        assets: { EURUSD: 1.0 },
        strategies: ["Scalping"],
        setups: ["Breakout"],
      });

      expect(result.data?.userId).toBe("user-123");
      expect(result.error).toBeNull();
      expect(mockPrisma.settings.upsert).toHaveBeenCalled();
    });

    it("should update existing settings by id", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-1",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD", "EUR"],
        leverages: ["1:200"],
        assets: { EURUSD: 2.0 },
        strategies: ["Day Trading"],
        setups: ["Support"],
        created_at: new Date("2024-01-01"),
        updated_at: new Date(),
      };

      mockPrisma.settings.upsert.mockResolvedValue(mockSettings);

      const result = await repository.saveSettings({
        id: "settings-1",
        userId: "user-123",
        currencies: ["USD", "EUR"],
        leverages: ["1:200"],
      });

      expect(result.data?.id).toBe("settings-1");
      expect(result.data?.currencies).toEqual(["USD", "EUR"]);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      mockPrisma.settings.upsert.mockRejectedValue(new Error("DB Error"));

      const result = await repository.saveSettings({
        userId: "user-123",
        currencies: ["USD"],
      });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Failed to save settings");
      expect(result.error?.statusCode).toBe(500);
    });
  });

  describe("saveUserSettings", () => {
    it("should create new user settings", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-new",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD"],
        leverages: ["1:100"],
        assets: { EURUSD: 1.0, GBPUSD: 1.5 },
        strategies: ["Scalping"],
        setups: ["Breakout"],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.settings.upsert.mockResolvedValue(mockSettings);

      const result = await repository.saveUserSettings("user-123", {
        currencies: ["USD"],
        leverages: ["1:100"],
        assets: [
          { symbol: "EURUSD", multiplier: 1.0 },
          { symbol: "GBPUSD", multiplier: 1.5 },
        ],
        strategies: ["Scalping"],
        setups: ["Breakout"],
      });

      expect(result.data?.user_id).toBe("user-123");
      expect(result.data?.assets).toEqual([
        { symbol: "EURUSD", multiplier: 1.0 },
        { symbol: "GBPUSD", multiplier: 1.5 },
      ]);
      expect(result.error).toBeNull();
    });

    it("should update existing user settings", async () => {
      const mockSettings: PrismaSettings = {
        id: "settings-1",
        user_id: "user-123",
        account_id: null,
        currencies: ["USD", "EUR"],
        leverages: ["1:200"],
        assets: { EURUSD: 2.0 },
        strategies: ["Day Trading"],
        setups: ["Support"],
        created_at: new Date("2024-01-01"),
        updated_at: new Date(),
      };

      mockPrisma.settings.upsert.mockResolvedValue(mockSettings);

      const result = await repository.saveUserSettings("user-123", {
        currencies: ["USD", "EUR"],
        leverages: ["1:200"],
      });

      expect(result.data?.currencies).toEqual(["USD", "EUR"]);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      mockPrisma.settings.upsert.mockRejectedValue(new Error("DB Error"));

      const result = await repository.saveUserSettings("user-123", {
        currencies: ["USD"],
      });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Failed to save user settings");
      expect(result.error?.statusCode).toBe(500);
    });
  });
});
