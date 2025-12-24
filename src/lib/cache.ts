import { cache } from "react";

/**
 * Cache wrapper for data fetching functions
 * Automatically deduplicates requests during a single render
 *
 * Usage:
 * const getCachedUser = cached(async (userId: string) => {
 *   return await getUserFromDB(userId);
 * });
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
  return cache(fn) as T;
}

/**
 * Helper to create cached Supabase queries
 * Prevents duplicate database calls during server rendering
 */
export const createCachedQuery = <T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
) => {
  return cache(queryFn);
};
