import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkLoginRateLimit, buildRateLimitHeaders } from "@/lib/ratelimit";

// ============================================
// MIDDLEWARE
// Authentication, rate limiting, and session management
// ============================================

/**
 * Get client IP from request headers
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export default async function middleware(req: NextRequest) {
  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔒 Middleware carregado:", {
      path: req.nextUrl.pathname,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

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
    // Identifier: IP + email (more secure than IP alone)
    const identifier = clientIP;
    const rateLimit = await checkLoginRateLimit(identifier);

    if (!rateLimit.success) {
      const headers = buildRateLimitHeaders(rateLimit);
      const retryMinutes = Math.ceil((rateLimit.reset - Date.now()) / 60000);
      const errorUrl = new URL("/login", req.url);
      errorUrl.searchParams.set("error", "rate_limited");
      errorUrl.searchParams.set("retry_after", retryMinutes.toString());

      // Log rate limit event
      console.warn("🚫 Rate limit exceeded:", {
        ip: clientIP,
        reset: new Date(rateLimit.reset).toISOString(),
      });

      return NextResponse.redirect(errorUrl, { headers });
    }
  }

  // Public routes - no auth required
  const publicRoutes = [
    "/login",
    "/auth/callback",
    "/auth/reset-password",
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
    // Note: With Upstash, we don't need to manually reset rate limit
    // The sliding window handles expiration automatically
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
