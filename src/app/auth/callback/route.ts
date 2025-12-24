import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // Check for recovery type
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("Auth Callback: Session exchanged successfully, type:", type);

      // If this is a password recovery, redirect to reset-password page
      if (type === "recovery") {
        console.log("Auth Callback: Redirecting to reset-password");
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth Callback: Error exchanging code:", error);
    }
  }

  console.error("Auth Callback: No code or error occurred");
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
