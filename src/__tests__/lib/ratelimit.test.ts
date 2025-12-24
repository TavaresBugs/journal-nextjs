import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("checkLoginRateLimit (without Redis)", () => {
    it("should handle missing Redis gracefully", async () => {
      // Clear env vars to simulate no Redis
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

      const { checkLoginRateLimit } = await import("@/lib/ratelimit");
      const result = await checkLoginRateLimit("192.168.1.1:anon");

      // Should return success when Redis is not configured
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should return proper structure for rate limit result", async () => {
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

      const { checkLoginRateLimit } = await import("@/lib/ratelimit");
      const result = await checkLoginRateLimit("test-identifier");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("reset");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.limit).toBe("number");
      expect(typeof result.remaining).toBe("number");
      expect(typeof result.reset).toBe("number");
    });
  });

  describe("buildRateLimitHeaders", () => {
    it("should build headers with rate limit info", async () => {
      const { buildRateLimitHeaders } = await import("@/lib/ratelimit");
      const result = {
        success: true,
        limit: 5,
        remaining: 3,
        reset: Date.now() + 60000,
      };

      const headers = buildRateLimitHeaders(result) as Record<string, string>;

      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("3");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("should include Retry-After when rate limited", async () => {
      const { buildRateLimitHeaders } = await import("@/lib/ratelimit");
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      };

      const headers = buildRateLimitHeaders(result) as Record<string, string>;

      expect(headers["Retry-After"]).toBeDefined();
      expect(parseInt(headers["Retry-After"])).toBeGreaterThan(0);
    });

    it("should not include Retry-After when allowed", async () => {
      const { buildRateLimitHeaders } = await import("@/lib/ratelimit");
      const result = {
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      };

      const headers = buildRateLimitHeaders(result) as Record<string, string>;

      expect(headers["Retry-After"]).toBeUndefined();
    });
  });
});
