import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getErrorMessage,
  base64ToBlob,
  getSupabaseStorageUrl,
  getCachedImageUrl,
  ensureFreshImageUrl,
} from "@/lib/utils/general";

describe("general utils", () => {
  describe("getErrorMessage", () => {
    it("should return message from Error object", () => {
      expect(getErrorMessage(new Error("Foo"))).toBe("Foo");
    });

    it("should return string as-is", () => {
      expect(getErrorMessage("Bar")).toBe("Bar");
    });

    it("should return message from object", () => {
      expect(getErrorMessage({ message: "Baz" })).toBe("Baz");
    });

    it("should return fallback for unknown", () => {
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });
  });

  describe("base64ToBlob", () => {
    it("should convert valid base64", () => {
      const b64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const blob = base64ToBlob(b64);
      expect(blob.type).toBe("image/png");
      expect(blob.size).toBeGreaterThan(0);
    });

    it("should handle invalid base64 gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const blob = base64ToBlob("not a base64");
      // It actually might fail in atob or split.
      // The function has try/catch mostly for atob failure.
      expect(blob.type).toBe("image/png");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getSupabaseStorageUrl", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it("should build url correctly", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.com";
      const url = getSupabaseStorageUrl("path/to/img.png");
      expect(url).toBe(
        "https://example.com/storage/v1/object/public/journal-images/path/to/img.png"
      );
    });

    it("should handle missing env var", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const url = getSupabaseStorageUrl("path");
      expect(url).toBe("path");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getCachedImageUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.com";
    });

    it("should append version param", () => {
      const url = "https://example.com/img.png";
      const res = getCachedImageUrl(url);
      expect(res).toContain("v=");
    });

    it("should use storage url if path given", () => {
      const res = getCachedImageUrl("path/img.png");
      expect(res).toContain(
        "https://example.com/storage/v1/object/public/journal-images/path/img.png"
      );
      expect(res).toContain("v=");
    });

    it("should handle null", () => {
      // @ts-expect-error Testing null input
      expect(getCachedImageUrl(null)).toBe(null);
    });

    it("should remove existing t param", () => {
      const url = "https://example.com/img.png?t=123";
      const res = getCachedImageUrl(url);
      expect(res).not.toContain("t=123");
      expect(res).toContain("v=");
    });

    it("should handle malformed urls", () => {
      // "http://[::1]" might be valid or not depending on parser, but let's try something clearly broken if URL constructor is strict
      // Actually JS URL constructor is quite robust.
      // Let's force it to go to catch block if we can, or just verify regular behavior.
      // If we pass a relative path that looks like a URL but isn't?

      // The implementation uses `new URL(fullUrl)`. If fullUrl is just "path", it throws "Invalid URL" in Node environment (and browser) if no base is provided.
      // But `getSupabaseStorageUrl` prepends default base if not http.

      // If getSupabaseStorageUrl fails (missing env) and returns just "path", then `new URL("path")` throws.
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      // suppress error log from getSupabaseStorageUrl
      vi.spyOn(console, "error").mockImplementation(() => {});

      const res = getCachedImageUrl("path-only");
      expect(res).toContain("path-only?v=");
    });
  });

  describe("ensureFreshImageUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.com";
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should append timestamp", () => {
      const now = 123456789;
      vi.setSystemTime(now);

      const res = ensureFreshImageUrl("https://example.com/img.png");
      expect(res).toBe(`https://example.com/img.png?v=${now}`);
    });

    it("should handle storage path", () => {
      const res = ensureFreshImageUrl("path/img.png");
      expect(res).toContain("https://example.com");
    });

    it("should handle catch block", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = ensureFreshImageUrl("path");
      expect(res).toContain("path?v=");
    });

    it("should return empty string as-is", () => {
      const res = ensureFreshImageUrl("");
      expect(res).toBe("");
    });
  });
});
