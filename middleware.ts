import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicRoute } from "@/config/route-config";

/**
 * Edge Middleware for Authentication Protection
 *
 * Runs BEFORE page rendering to ensure:
 * 1. Unauthenticated users can't access protected routes
 * 2. Auth cookies are properly refreshed
 * 3. Redirects happen server-side (no client-side race conditions)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static assets
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Create response that we can modify
  const response = NextResponse.next({ request });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          // Update response cookies (for token refresh)
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Verify authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Protected routes check
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mentor") ||
    pathname === "/";

  if (isProtectedRoute && !user) {
    // Log only critical auth failures (not every request)
    if (error) {
      console.warn("[Middleware] Auth error on protected route:", {
        path: pathname,
        error: error.message,
      });
    }

    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated - allow access
  return response;
}

/**
 * Matcher configuration - only run middleware on these routes
 * Static assets, API routes, and explicitly public routes are excluded
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
