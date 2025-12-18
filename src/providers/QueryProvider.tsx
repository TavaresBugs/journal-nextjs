"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * React Query Provider for client-side data caching
 * Configured with sensible defaults for a trading application
 *
 * Memory optimization notes:
 * - gcTime reduced from 30min to 10min to prevent memory accumulation
 * - staleTime set to 3min (adequate for trading data freshness)
 * - refetchOnWindowFocus disabled for trading data stability
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 3 minutes
            staleTime: 3 * 60 * 1000,
            // Cache garbage collected after 10 minutes (reduced from 30)
            gcTime: 10 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus for trading data
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
