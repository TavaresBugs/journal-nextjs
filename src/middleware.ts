import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
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
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const pathname = req.nextUrl.pathname;

    // Public routes - no auth required
    const publicRoutes = ['/login', '/auth/callback', '/share', '/pending'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Admin routes - require admin role
    const isAdminRoute = pathname.startsWith('/admin');

    // Check auth status
    const { data: { session } } = await supabase.auth.getSession();

    // Not authenticated - redirect to login (except public routes)
    if (!session && !isPublicRoute) {
        const redirectUrl = new URL('/login', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Authenticated - check user status and role
    if (session) {
        // Redirect from login to home
        if (pathname === '/login') {
            const redirectUrl = new URL('/', req.url);
            return NextResponse.redirect(redirectUrl);
        }

        // Check user extended profile for status/role
        const { data: userProfile } = await supabase
            .from('users_extended')
            .select('status, role')
            .eq('id', session.user.id)
            .maybeSingle();

        // If profile doesn't exist yet (race condition), allow through
        if (userProfile) {
            const { status, role } = userProfile;

            // Pending users can only access /pending page
            if (status === 'pending' && !pathname.startsWith('/pending') && !isPublicRoute) {
                const redirectUrl = new URL('/pending', req.url);
                return NextResponse.redirect(redirectUrl);
            }

            // Approved users shouldn't see /pending
            if (status === 'approved' && pathname.startsWith('/pending')) {
                const redirectUrl = new URL('/', req.url);
                return NextResponse.redirect(redirectUrl);
            }

            // Suspended/banned users - logout and show message
            if (status === 'suspended' || status === 'banned') {
                // Clear session and redirect to login with error
                const redirectUrl = new URL('/login?error=account_suspended', req.url);
                return NextResponse.redirect(redirectUrl);
            }

            // Admin routes - require admin role
            if (isAdminRoute && role !== 'admin') {
                const redirectUrl = new URL('/', req.url);
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
