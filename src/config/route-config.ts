export type UserRole = "user" | "admin" | "super_admin" | "mentor";

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/admin": ["admin", "super_admin"],
  "/admin/mentores": ["admin", "super_admin"],
  "/admin/audit-logs": ["super_admin"],
  "/mentor/dashboard": ["mentor", "admin"],
  "/dashboard": ["user", "mentor", "admin", "super_admin"],
  "/trades": ["user", "mentor", "admin", "super_admin"],
  "/journal": ["user", "mentor", "admin", "super_admin"],
  "/playbook": ["user", "mentor", "admin", "super_admin"],
} as const;

export const PUBLIC_PATTERNS = [
  /^\/login$/,
  /^\/auth\/.*$/, // Covers /auth/callback, /auth/reset-password, etc.
  /^\/share$/,
  /^\/share\/.*$/,
  /^\/pending$/,
  /^\/termos$/,
  /^\/privacidade$/,
  /^\/comunidade$/,
  /^\/api\/public\/.*$/,
  /^\/_next\/.*$/,
  /^\/favicon\.ico$/,
  /^\/.*\.(svg|png|jpg|jpeg|gif|webp)$/, // Static images
];

/**
 * Checks if a path matches any public pattern.
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * Checks if a user role has access to a specific path.
 * If the path is not explicitly defined, it defaults to allowing 'user' role (standard protected route).
 * You can adjust this default behavior as needed.
 */
export function hasRouteAccess(path: string, userRole: string): boolean {
  // If exact match
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path].includes(userRole as UserRole);
  }

  // Check for nested routes (e.g. /admin/users -> matches /admin if not more specific)
  // This is a simple prefix match strategy.
  // For stricter control, we might want to require exact matches or explicit wildcards.
  // For now, let's look for the most specific parent match or default allow.

  // Find the longest matching prefix key
  const sortedKeys = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (path.startsWith(key)) {
      return ROUTE_PERMISSIONS[key].includes(userRole as UserRole);
    }
  }

  // Default fallback for any other protected route not explicitly listed above
  // Assuming if it's not public (checked before this) and not restricted, it's a standard user route.
  return true;
}
