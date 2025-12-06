'use client';

import { CookieConsent } from '@/components/ui/CookieConsent';

/**
 * Client-side providers wrapper for app-wide client components
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <CookieConsent />
        </>
    );
}
