import { NextRequest } from "next/server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { checkLoginRateLimit, buildRateLimitHeaders } from "@/lib/ratelimit";
import { isPublicRoute, hasRouteAccess } from "@/config/route-config";

export interface RateLimitResult {
  success: boolean;
  headers?: Headers;
  redirectUrl?: URL;
}

export interface UserContext {
  id: string;
  role: string;
  status: string;
}

/**
 * Get client IP from request headers with robust fallback.
 */
export function getClientIP(req: NextRequest): string | null {
  const headers = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip", "true-client-ip"];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // Handle x-forwarded-for multiple IPs
      return value.split(",")[0].trim();
    }
  }

  return null;
}

/**
 * Handle rate limiting for login attempts.
 * Returns either success or a redirect response details.
 */
export async function handleLoginRateLimit(
  req: NextRequest,
  ip: string | null
): Promise<RateLimitResult> {
  if (!ip) {
    // Fail-open logging would happen in middleware main loop if needed
    return { success: true };
  }

  const result = await checkLoginRateLimit(ip);
  if (!result.success) {
    const headers = new Headers(buildRateLimitHeaders(result));
    const retryMinutes = Math.ceil((result.reset - Date.now()) / 60000);
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", "rate_limited");
    errorUrl.searchParams.set("retry_after", retryMinutes.toString());

    return { success: false, headers, redirectUrl: errorUrl };
  }

  return { success: true };
}

/**
 * Fetches user role and status from Supabase.
 * Checks 'users_extended' table.
 */
export async function checkUserStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext | null> {
  const { data: profile } = await supabase
    .from("users_extended")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: userId,
    role: profile.role || "user",
    status: profile.status || "pending",
  };
}

/**
 * Centralized logic to resolve where a user should be redirected.
 * Returns null if no redirect is needed (allow access).
 */
export function resolveRedirect(path: string, user: UserContext | null): string | null {
  // 1. Unauthenticated users
  if (!user) {
    if (isPublicRoute(path)) return null;
    return "/login";
  }

  // 2. Suspended/Banned users
  if (user.status === "suspended" || user.status === "banned") {
    // Prevent infinite loop if they are already on login or error page
    if (path.startsWith("/login")) return null;
    return "/login?error=account_suspended";
  }

  // 3. Pending users
  if (user.status === "pending") {
    if (path === "/pending") return null;
    // Allow public routes even for pending users? Usually yes (e.g. terms, logout)
    if (isPublicRoute(path) && path !== "/login") return null;
    return "/pending";
  }

  // 4. Approved users should not see /pending
  if (user.status === "approved" && path === "/pending") {
    return "/";
  }

  // 5. Role-based Access Control
  if (!hasRouteAccess(path, user.role)) {
    // If user tries to access admin but isn't admin, go to dashboard
    return "/dashboard";
  }

  return null; // Access granted
}

/**
 * Structured logging for access events.
 */
export function logAccessEvent(event: {
  path: string;
  method: string;
  ip?: string | null;
  userId?: string;
  role?: string;
  action: "allowed" | "redirected" | "blocked";
  reason?: string;
  redirectTo?: string;
}) {
  // In production, you might want to send this to an external logging service
  // For now, console.log with JSON structure is good for CloudWatch/Vercel logs
  if (process.env.NODE_ENV === "development") {
    // Pretty print in dev
    console.log(`🛡️ [Auth] ${event.action.toUpperCase()}: ${event.path} (${event.reason || ""})`);
  } else {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        type: "access_control",
        ...event,
      })
    );
  }
}
