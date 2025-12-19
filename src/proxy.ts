import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================
// RATE LIMITING
// ============================================

// In-memory rate limiter (resets on server restart)
// For production at scale, consider Redis/Upstash
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

function getClientIP(req: NextRequest): string {
  // Try various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback - in production this should be more robust
  return "unknown";
}

function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // No previous attempts
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Window expired - reset
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Still within window
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt);
    return { allowed: false, remainingAttempts: 0, retryAfterMs };
  }

  // Increment counter
  entry.count++;
  rateLimitMap.set(ip, entry);
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count };
}

function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(ip);
      }
    }
  },
  5 * 60 * 1000
);

// ============================================
// PROXY (formerly Middleware)
// ============================================

export default async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const pathname = req.nextUrl.pathname;
  const clientIP = getClientIP(req);

  // ============================================
  // RATE LIMITING (apenas para login POST)
  // ============================================

  // Check if this is a login attempt (form submission)
  if (pathname === "/login" && req.method === "POST") {
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil((rateLimit.retryAfterMs || 0) / 60000);
      const errorUrl = new URL("/login", req.url);
      errorUrl.searchParams.set("error", `rate_limited`);
      errorUrl.searchParams.set("retry_after", retryMinutes.toString());
      return NextResponse.redirect(errorUrl);
    }
  }

  // Public routes - no auth required
  const publicRoutes = [
    "/login",
    "/auth/callback",
    "/share",
    "/pending",
    "/termos",
    "/privacidade",
    "/comunidade",
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Admin routes - require admin role
  const isAdminRoute = pathname.startsWith("/admin");

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  if (session) {
    // Check if session is close to expiring (within 10 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresInMs = expiresAt * 1000 - Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;

      // Refresh session if it expires in less than 10 minutes
      if (expiresInMs < TEN_MINUTES && expiresInMs > 0) {
        await supabase.auth.refreshSession();
      }
    }

    // Reset rate limit on successful auth
    resetRateLimit(clientIP);
  }

  // Not authenticated - redirect to login (except public routes)
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated - check user status and role
  if (session) {
    // Redirect from login to home
    if (pathname === "/login") {
      const redirectUrl = new URL("/", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Check user extended profile for status/role
    const { data: userProfile } = await supabase
      .from("users_extended")
      .select("status, role")
      .eq("id", session.user.id)
      .maybeSingle();

    // If profile doesn't exist yet (race condition), allow through
    if (userProfile) {
      const { status, role } = userProfile;

      // Pending users can only access /pending page
      if (status === "pending" && !pathname.startsWith("/pending") && !isPublicRoute) {
        const redirectUrl = new URL("/pending", req.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Approved users shouldn't see /pending
      if (status === "approved" && pathname.startsWith("/pending")) {
        const redirectUrl = new URL("/", req.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Suspended/banned users - logout and show message
      if (status === "suspended" || status === "banned") {
        // Clear session and redirect to login with error
        const redirectUrl = new URL("/login?error=account_suspended", req.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Admin routes - require admin role
      if (isAdminRoute && role !== "admin") {
        const redirectUrl = new URL("/", req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
