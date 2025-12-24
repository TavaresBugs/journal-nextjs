import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getClientIP,
  handleLoginRateLimit,
  checkUserStatus,
  resolveRedirect,
  logAccessEvent,
} from "@/lib/auth/middleware-utils";

// ============================================
// MIDDLEWARE
// Authentication, rate limiting, and session management
// ============================================

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const ip = getClientIP(req);

  // 1. Rate Limiting (Login only)
  if (pathname === "/login" && req.method === "POST") {
    const rateLimit = await handleLoginRateLimit(req, ip);
    if (!rateLimit.success && rateLimit.redirectUrl) {
      logAccessEvent({
        path: pathname,
        method: req.method,
        ip,
        action: "blocked",
        reason: "rate_limit_exceeded",
        redirectTo: rateLimit.redirectUrl.toString(),
      });
      return NextResponse.redirect(rateLimit.redirectUrl, {
        headers: rateLimit.headers,
      });
    }
  }

  // 2. Setup Supabase Client
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
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 3. Auth & Session Refresh
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.expires_at) {
    // Refresh session if expiring in < 10 mins
    const expiresIn = session.expires_at * 1000 - Date.now();
    if (expiresIn < 10 * 60 * 1000 && expiresIn > 0) {
      await supabase.auth.refreshSession();
    }
  }

  // 4. User Status & Role
  let userContext = null;
  if (session?.user) {
    userContext = await checkUserStatus(supabase, session.user.id);
  }

  // 5. Access Decision
  const redirectPath = resolveRedirect(pathname, userContext);

  if (redirectPath) {
    const absoluteRedirectUrl = new URL(redirectPath, req.url);

    // Log meaningful redirects (exclude standard login redirects for unauth users to avoid noise)
    if (userContext || !redirectPath.includes("/login")) {
      logAccessEvent({
        path: pathname,
        method: req.method,
        ip,
        userId: session?.user?.id,
        role: userContext?.role,
        action: "redirected",
        reason: "access_policy",
        redirectTo: redirectPath,
      });
    }

    return NextResponse.redirect(absoluteRedirectUrl);
  }

  // 6. Allowed - Proceed
  return response;
}

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
