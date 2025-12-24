import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token"); // PKCE token for email verification
  const type = searchParams.get("type"); // signup, recovery, etc.
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";
  const redirectTo = searchParams.get("redirect_to");

  console.log("[Auth Callback] Params:", {
    code,
    token: token?.slice(0, 20) + "...",
    type,
    next,
    redirectTo,
  });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("[Auth Callback] OAuth session exchanged successfully");

      // If this is a password recovery, redirect to reset-password page
      if (type === "recovery") {
        console.log("[Auth Callback] Redirecting to reset-password");
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("[Auth Callback] Error exchanging code:", error);
    }
  }

  // Handle PKCE token verification (email confirmation)
  if (token && type === "signup") {
    console.log("[Auth Callback] Processing signup email verification");
    // Token verification happens automatically when the link is clicked
    // Supabase verifies the token on their end before redirecting
    // The user now needs to log in manually
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  // Handle recovery token
  if (token && type === "recovery") {
    console.log("[Auth Callback] Processing password recovery");
    return NextResponse.redirect(`${origin}/auth/reset-password?token=${token}`);
  }

  console.error("[Auth Callback] No code or token provided");
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
