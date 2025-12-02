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

    // Check auth status
    const { data: { session } } = await supabase.auth.getSession();

    console.log('Middleware: Path:', req.nextUrl.pathname);
    console.log('Middleware: Session exists:', !!session);

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback'];
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    // If not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
        console.log('Middleware: Redirecting to /login');
        const redirectUrl = new URL('/login', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // If authenticated and trying to access login page, redirect to home
    if (session && req.nextUrl.pathname === '/login') {
        console.log('Middleware: Redirecting to /');
        const redirectUrl = new URL('/', req.url);
        return NextResponse.redirect(redirectUrl);
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
