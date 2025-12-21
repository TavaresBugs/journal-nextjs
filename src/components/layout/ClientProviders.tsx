"use client";

import { CookieConsent } from "@/components/ui/CookieConsent";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Client-side providers wrapper for app-wide client components
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <CookieConsent />
    </QueryProvider>
  );
}
