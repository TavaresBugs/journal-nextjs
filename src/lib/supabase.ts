import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Diagnostic logging for deployment debugging (only in dev or if needed)
if (process.env.NODE_ENV === "development") {
  console.log("[Supabase Init] URL configured:", supabaseUrl ? "✓ URL is set" : "✗ URL is missing");
  console.log(
    "[Supabase Init] Anon Key configured:",
    supabaseAnonKey ? "✓ Key is set" : "✗ Key is missing"
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence for browser
    persistSession: true,
    // Automatically refresh tokens to keep session alive
    autoRefreshToken: true,
    // Detect OAuth redirects in URL
    detectSessionInUrl: true,
    // Use localStorage for session storage
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  // Add global fetch wrapper with timeout to prevent infinite hangs
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("[Supabase Fetch] Request timeout after 10s:", url);
        controller.abort();
      }, 10000); // 10 second timeout

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});
