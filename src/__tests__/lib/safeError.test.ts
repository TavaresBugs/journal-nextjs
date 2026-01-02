/**
 * Tests for lib/logging/safeError.ts
 */
import { describe, it, expect } from "vitest";
import { safeError, sanitizeMeta } from "@/lib/logging/safeError";

describe("safeError", () => {
  describe("safeError()", () => {
    it("should extract safe info from Error objects", () => {
      const error = new Error("Test error message");
      error.name = "TestError";
      const result = safeError(error);

      expect(result.message).toBe("Test error message");
      expect(result.name).toBe("TestError");
      expect(result).not.toHaveProperty("stack");
    });

    it("should handle TypeError", () => {
      const error = new TypeError("Type mismatch");
      const result = safeError(error);

      expect(result.message).toBe("Type mismatch");
      expect(result.name).toBe("TypeError");
    });

    it("should handle error-like objects", () => {
      const errorLike = {
        message: "Something went wrong",
        code: "ERR_001",
        name: "CustomError",
        internalData: "should not be exposed",
      };
      const result = safeError(errorLike);

      expect(result.message).toBe("Something went wrong");
      expect(result.code).toBe("ERR_001");
      expect(result.name).toBe("CustomError");
      expect(result).not.toHaveProperty("internalData");
    });

    it("should handle objects with error property", () => {
      const errorObj = { error: "Connection failed" };
      const result = safeError(errorObj);

      expect(result.message).toBe("Connection failed");
    });

    it("should handle string errors", () => {
      const result = safeError("Simple string error");

      expect(result.message).toBe("Simple string error");
    });

    it("should handle unknown types", () => {
      expect(safeError(123).message).toBe("Unknown error occurred");
      expect(safeError(null).message).toBe("Unknown error occurred");
      expect(safeError(undefined).message).toBe("Unknown error occurred");
    });
  });

  describe("sanitizeMeta()", () => {
    it("should redact sensitive keys", () => {
      const meta = {
        userId: "user-123",
        email: "test@example.com",
        password: "secret123",
        token: "abc-token",
        message: "Safe message",
      };
      const result = sanitizeMeta(meta);

      expect(result.userId).toBe("[REDACTED]");
      expect(result.email).toBe("[REDACTED]");
      expect(result.password).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
      expect(result.message).toBe("Safe message");
    });

    it("should handle nested objects", () => {
      const meta = {
        user: {
          name: "John",
          email: "john@test.com",
        },
        action: "login",
      };
      const result = sanitizeMeta(meta);

      expect(result.user).toEqual({
        name: "John",
        email: "[REDACTED]",
      });
      expect(result.action).toBe("login");
    });

    it("should handle arrays with objects", () => {
      const meta = {
        users: [
          { name: "User1", apiKey: "key1" },
          { name: "User2", apiKey: "key2" },
        ],
      };
      const result = sanitizeMeta(meta);

      expect(result.users).toEqual([
        { name: "User1", apiKey: "[REDACTED]" },
        { name: "User2", apiKey: "[REDACTED]" },
      ]);
    });

    it("should preserve primitive array values", () => {
      const meta = { tags: ["tag1", "tag2", 123] };
      const result = sanitizeMeta(meta);

      expect(result.tags).toEqual(["tag1", "tag2", 123]);
    });

    it("should truncate deeply nested objects", () => {
      const meta = {
        level1: {
          level2: {
            level3: {
              level4: {
                deep: "value",
              },
            },
          },
        },
      };
      const result = sanitizeMeta(meta, 3);

      expect(result.level1.level2.level3).toEqual({ _truncated: true });
    });

    it("should handle case-insensitive sensitive keys", () => {
      const meta = {
        EMAIL: "test@test.com",
        Password: "secret",
        API_KEY: "key123",
      };
      const result = sanitizeMeta(meta);

      expect(result.EMAIL).toBe("[REDACTED]");
      expect(result.Password).toBe("[REDACTED]");
      expect(result.API_KEY).toBe("[REDACTED]");
    });

    it("should redact keys containing sensitive substrings", () => {
      const meta = {
        userEmail: "test@example.com",
        accessToken: "token123",
        refreshTokenData: "data",
      };
      const result = sanitizeMeta(meta);

      expect(result.userEmail).toBe("[REDACTED]");
      expect(result.accessToken).toBe("[REDACTED]");
      expect(result.refreshTokenData).toBe("[REDACTED]");
    });
  });
});
