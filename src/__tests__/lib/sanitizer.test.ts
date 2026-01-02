/**
 * Tests for lib/security/sanitizer.ts
 */
import { describe, it, expect } from "vitest";
import {
  stripHtml,
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  sanitizeEmail,
  sanitizeNumber,
} from "@/lib/security/sanitizer";

describe("Sanitizer", () => {
  describe("stripHtml", () => {
    it("should remove HTML tags from string", () => {
      expect(stripHtml("<script>alert('xss')</script>")).toBe("alert('xss')");
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
      expect(stripHtml("<div class='test'>Content</div>")).toBe("Content");
    });

    it("should return empty string for empty input", () => {
      expect(stripHtml("")).toBe("");
    });

    it("should return string unchanged if no HTML", () => {
      expect(stripHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
      expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
      expect(escapeHtml("'test'")).toBe("&#x27;test&#x27;");
      expect(escapeHtml("a/b")).toBe("a&#x2F;b");
      expect(escapeHtml("a&b")).toBe("a&amp;b");
    });

    it("should return empty string for empty input", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should keep normal text unchanged", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("sanitizeInput", () => {
    it("should remove null bytes", () => {
      expect(sanitizeInput("hello\0world")).toBe("helloworld");
    });

    it("should remove control characters", () => {
      expect(sanitizeInput("hello\x00\x01\x02world")).toBe("helloworld");
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello world  ")).toBe("hello world");
    });

    it("should return empty string for empty input", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("should preserve normal text", () => {
      expect(sanitizeInput("Hello, World! 123")).toBe("Hello, World! 123");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize string values in object", () => {
      const input = { name: "  John\0  ", age: 25 };
      const result = sanitizeObject(input);
      expect(result.name).toBe("John");
      expect(result.age).toBe(25);
    });

    it("should handle nested objects", () => {
      const input = {
        user: {
          name: "  Jane\0  ",
          email: "test@example.com",
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe("Jane");
      expect(result.user.email).toBe("test@example.com");
    });

    it("should handle arrays with strings", () => {
      const input = { tags: ["  tag1  ", "tag2\0"] };
      const result = sanitizeObject(input);
      expect(result.tags).toEqual(["tag1", "tag2"]);
    });

    it("should preserve non-string values in arrays", () => {
      const input = { numbers: [1, 2, 3] };
      const result = sanitizeObject(input);
      expect(result.numbers).toEqual([1, 2, 3]);
    });
  });

  describe("sanitizeEmail", () => {
    it("should return normalized valid email", () => {
      expect(sanitizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
      expect(sanitizeEmail("  user@domain.org  ")).toBe("user@domain.org");
    });

    it("should return null for invalid email", () => {
      expect(sanitizeEmail("not-an-email")).toBeNull();
      expect(sanitizeEmail("missing@domain")).toBeNull();
      expect(sanitizeEmail("@domain.com")).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(sanitizeEmail("")).toBeNull();
    });
  });

  describe("sanitizeNumber", () => {
    it("should return number for valid numeric input", () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber("123")).toBe(123);
      expect(sanitizeNumber(3.14)).toBe(3.14);
      expect(sanitizeNumber("2.5")).toBe(2.5);
    });

    it("should return null for invalid numeric input", () => {
      expect(sanitizeNumber("not-a-number")).toBeNull();
      expect(sanitizeNumber(NaN)).toBeNull();
      expect(sanitizeNumber(Infinity)).toBeNull();
      expect(sanitizeNumber(-Infinity)).toBeNull();
    });

    it("should return null for null/undefined", () => {
      expect(sanitizeNumber(null)).toBeNull();
      expect(sanitizeNumber(undefined)).toBeNull();
    });
  });
});
