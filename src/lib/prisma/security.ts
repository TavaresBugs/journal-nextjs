/**
 * Prisma Security Middleware
 *
 * Provides Row Level Security (RLS) equivalent for Prisma queries.
 * Since Prisma doesn't natively support Supabase RLS, we implement
 * security checks at the application level.
 *
 * @example
 * import { withUserContext, assertOwnership } from '@/lib/prisma/security';
 *
 * // Wrap queries with user context
 * const trades = await withUserContext(userId, async () => {
 *   return prisma.trades.findMany({ where: { user_id: userId } });
 * });
 */

import { prisma } from "@/lib/prisma";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

const logger = new Logger("PrismaSecurity");

/**
 * User context for RLS-like checks
 */
interface UserContext {
  userId: string;
  role?: "user" | "admin" | "mentor";
}

// AsyncLocalStorage for user context (Node.js native)
let currentUserContext: UserContext | null = null;

/**
 * Sets the current user context for RLS checks.
 * Use this at the start of a request/action.
 */
export function setUserContext(context: UserContext | null): void {
  currentUserContext = context;
}

/**
 * Gets the current user context.
 * Returns null if no context is set.
 */
export function getUserContext(): UserContext | null {
  return currentUserContext;
}

/**
 * Executes a function with a specific user context.
 * Context is automatically cleared after execution.
 */
export async function withUserContext<T>(
  userId: string,
  role: UserContext["role"] = "user",
  fn: () => Promise<T>
): Promise<T> {
  const previousContext = currentUserContext;

  try {
    setUserContext({ userId, role });
    return await fn();
  } finally {
    setUserContext(previousContext);
  }
}

/**
 * Asserts that the current user owns a resource.
 * Throws AUTH_FORBIDDEN if user doesn't have access.
 */
export function assertOwnership(
  resourceUserId: string | null | undefined,
  operation: string = "access"
): void {
  const context = getUserContext();

  if (!context) {
    logger.warn("No user context set for ownership check", { operation });
    throw new AppError("Authentication required", ErrorCode.AUTH_UNAUTHORIZED, 401);
  }

  // Admins can access anything
  if (context.role === "admin") {
    return;
  }

  if (resourceUserId !== context.userId) {
    logger.warn("Ownership check failed", {
      operation,
      resourceUserId,
      requestUserId: context.userId,
    });
    throw new AppError(
      `Not authorized to ${operation} this resource`,
      ErrorCode.AUTH_FORBIDDEN,
      403
    );
  }
}

/**
 * Creates a user_id filter for Prisma queries.
 * Automatically uses current user context.
 */
export function userFilter(): { user_id: string } {
  const context = getUserContext();

  if (!context) {
    throw new AppError("User context required for this query", ErrorCode.AUTH_UNAUTHORIZED, 401);
  }

  return { user_id: context.userId };
}

/**
 * Creates an account filter ensuring user ownership.
 * Checks that the account belongs to the current user.
 */
export async function accountFilter(accountId: string): Promise<{ account_id: string }> {
  const context = getUserContext();

  if (!context) {
    throw new AppError("User context required for this query", ErrorCode.AUTH_UNAUTHORIZED, 401);
  }

  // Verify account ownership
  const account = await prisma.accounts.findFirst({
    where: {
      id: accountId,
      user_id: context.userId,
    },
    select: { id: true },
  });

  if (!account) {
    logger.warn("Account access denied", { accountId, userId: context.userId });
    throw new AppError("Account not found or access denied", ErrorCode.AUTH_FORBIDDEN, 403);
  }

  return { account_id: accountId };
}

/**
 * Middleware that adds user_id filter to all queries for a table.
 * Use with extreme caution - modifies queries at runtime.
 */
export function createSecureClient(userId: string) {
  const context = { userId, role: "user" as const };

  return {
    /**
     * Execute a secure query with automatic user filtering.
     */
    query: async <T>(fn: (userId: string) => Promise<T>): Promise<T> => {
      setUserContext(context);
      try {
        return await fn(userId);
      } finally {
        setUserContext(null);
      }
    },

    /**
     * Get the user ID for manual filtering.
     */
    getUserId: () => userId,

    /**
     * Check if user owns a resource.
     */
    assertOwns: (resourceUserId: string | null | undefined) => {
      assertOwnership(resourceUserId, "access");
    },
  };
}

/**
 * Higher-order function to wrap repository methods with security checks.
 */
export function withSecurity<T extends object>(repository: T, userId: string): T {
  const handler: ProxyHandler<T> = {
    get(target, prop) {
      const value = target[prop as keyof T];

      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          return withUserContext(userId, "user", async () => {
            return (value as (...args: unknown[]) => Promise<unknown>).apply(target, args);
          });
        };
      }

      return value;
    },
  };

  return new Proxy(repository, handler);
}
