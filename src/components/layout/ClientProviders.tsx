"use client";

import { CookieConsent } from "@/components/ui/CookieConsent";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Client-side providers wrapper for app-wide client components
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <CookieConsent />
    </QueryProvider>
  );
}
