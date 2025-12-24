import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ============================================
// RATE LIMITING (Upstash Redis)
// ============================================

/**
 * Redis client - only initialized if env vars are present
 * Falls back to null in development without Upstash
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

/**
 * Login rate limiter: 5 attempts per 15 minutes
 * Uses sliding window algorithm for smooth limiting
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "journal:login",
    })
  : null;

/**
 * Rate limit result structure
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check login rate limit for a given identifier (IP:email)
 * @param identifier - Unique identifier for the user (e.g., "192.168.1.1:user@email.com")
 * @returns Rate limit result with success status and metadata
 */
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  // Development mode without Redis - allow all requests
  if (!loginRateLimit) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Rate limiting disabled: Upstash Redis not configured");
    }
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 15 * 60 * 1000,
    };
  }

  const result = await loginRateLimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Build rate limit response headers
 * @param result - Rate limit result from checkLoginRateLimit
 * @returns Headers object with X-RateLimit-* and Retry-After
 */
export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  };

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);
    headers["Retry-After"] = Math.max(0, retryAfterSeconds).toString();
  }

  return headers;
}
