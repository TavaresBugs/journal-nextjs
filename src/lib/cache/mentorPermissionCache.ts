/**
 * Mentor Permission Cache
 *
 * Server-side in-memory cache for mentor permissions.
 * Eliminates redundant database queries for permissions.
 *
 * TTL: 5 minutes (configurable)
 */

interface CachedAccount {
  id: string;
  name: string;
  currency: string;
}

interface MenteePermissions {
  menteeId: string;
  accounts: CachedAccount[];
}

interface CacheEntry {
  permissions: Map<string, MenteePermissions>; // menteeId -> permissions
  expiresAt: number;
}

// In-memory cache: mentorId -> CacheEntry
const permissionCache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached permissions for a mentor.
 * Returns null if cache miss or expired.
 */
export function getCachedPermissions(mentorId: string, menteeId?: string): CachedAccount[] | null {
  const entry = permissionCache.get(mentorId);

  if (!entry) {
    console.log(`[PermissionCache] Miss for mentor ${mentorId.slice(0, 8)}...`);
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    console.log(`[PermissionCache] Expired for mentor ${mentorId.slice(0, 8)}...`);
    permissionCache.delete(mentorId);
    return null;
  }

  // If menteeId specified, return that mentee's permissions
  if (menteeId) {
    const menteePerms = entry.permissions.get(menteeId);
    if (menteePerms) {
      console.log(
        `[PermissionCache] Hit! ${menteePerms.accounts.length} accounts for mentee ${menteeId.slice(0, 8)}...`
      );
      return menteePerms.accounts;
    }
    return null;
  }

  // Return all mentee permissions as flat list
  const allAccounts: CachedAccount[] = [];
  entry.permissions.forEach((perms) => {
    allAccounts.push(...perms.accounts);
  });

  console.log(`[PermissionCache] Hit! ${allAccounts.length} total accounts for mentor`);
  return allAccounts;
}

/**
 * Set cached permissions for a mentor.
 */
export function setCachedPermissions(
  mentorId: string,
  menteeId: string,
  accounts: CachedAccount[]
): void {
  let entry = permissionCache.get(mentorId);

  if (!entry || Date.now() > entry.expiresAt) {
    // Create new entry
    entry = {
      permissions: new Map(),
      expiresAt: Date.now() + CACHE_TTL,
    };
    permissionCache.set(mentorId, entry);
  }

  entry.permissions.set(menteeId, { menteeId, accounts });

  console.log(
    `[PermissionCache] Cached ${accounts.length} accounts for mentee ${menteeId.slice(0, 8)}... (TTL: 5min)`
  );
}

/**
 * Invalidate cache for a specific mentor.
 * Call this when permissions change.
 */
export function invalidatePermissionCache(mentorId: string): void {
  if (permissionCache.has(mentorId)) {
    permissionCache.delete(mentorId);
    console.log(`[PermissionCache] Invalidated cache for mentor ${mentorId.slice(0, 8)}...`);
  }
}

/**
 * Invalidate all caches.
 * Call this on permission changes that affect multiple mentors.
 */
export function invalidateAllPermissionCaches(): void {
  const size = permissionCache.size;
  permissionCache.clear();
  console.log(`[PermissionCache] Cleared all caches (${size} entries)`);
}

/**
 * Get cache statistics (for debugging).
 */
export function getPermissionCacheStats(): {
  totalMentors: number;
  totalMentees: number;
  totalAccounts: number;
} {
  let totalMentees = 0;
  let totalAccounts = 0;

  permissionCache.forEach((entry) => {
    totalMentees += entry.permissions.size;
    entry.permissions.forEach((perms) => {
      totalAccounts += perms.accounts.length;
    });
  });

  return {
    totalMentors: permissionCache.size,
    totalMentees,
    totalAccounts,
  };
}
