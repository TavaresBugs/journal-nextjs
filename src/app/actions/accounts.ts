"use server";

/**
 * Account Server Actions
 *
 * Server-side actions for account operations using Prisma ORM.
 * These actions run exclusively on the server and can be called from client components.
 *
 * @example
 * // In a client component
 * import { getAccountsAction, saveAccountAction } from "@/app/actions/accounts";
 *
 * const accounts = await getAccountsAction();
 * const success = await saveAccountAction(accountData);
 */

import {
  prismaAccountRepo,
  prismaSettingsRepo,
  prismaTradeRepo,
} from "@/lib/database/repositories";
import { prisma } from "@/lib/database";
import { getCurrentUserId } from "@/lib/database/auth";
import { Account, Settings, UserSettings } from "@/types";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { withAuthRead } from "./_helpers/actionHelpers";

/**
 * User profile data from users_extended table.
 */
export interface UserProfile {
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Get user's custom profile (display name, avatar) from profiles table.
 * This is used to prioritize user-provided data over OAuth data.
 * The profiles table stores custom data set by the user in ProfileSettingsModal.
 * @returns UserProfile or null if not found.
 */
export async function getUserProfileAction(): Promise<UserProfile | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        display_name: true,
        avatar_url: true,
      },
    });

    if (!profile) return null;

    return {
      name: profile.display_name,
      avatarUrl: profile.avatar_url,
    };
  } catch (error) {
    console.error("[getUserProfileAction] Error:", error);
    return null;
  }
}

/**
 * Get all accounts for the current user.
 * CACHED: 5 minutes TTL, invalidated when accounts change.
 * @returns List of accounts or empty array if not authenticated.
 */
export async function getAccountsAction(): Promise<Account[]> {
  try {
    const userId = await getCurrentUserId();

    // Better logging for production debugging
    if (!userId) {
      console.error("[getAccountsAction] No userId - user not authenticated");
      console.error("[getAccountsAction] Environment check:", {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      return [];
    }

    // Use unstable_cache for time-based caching
    const getCachedAccounts = unstable_cache(
      async (uId: string) => {
        console.log("[getAccountsAction] Loading accounts for userId:", uId);
        const result = await prismaAccountRepo.getByUserId(uId);
        if (result.error) {
          console.error("[getAccountsAction] Error from repo:", {
            code: result.error.code,
            message: result.error.message,
            userId: uId,
          });
          return [];
        }
        console.log("[getAccountsAction] Successfully loaded accounts:", result.data?.length || 0);
        return result.data || [];
      },
      [`accounts-${userId}`],
      {
        revalidate: 300, // 5 minutes TTL
        tags: [`accounts:${userId}`],
      }
    );

    return await getCachedAccounts(userId);
  } catch (error) {
    console.error("[getAccountsAction] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

/**
 * Get a single account by ID.
 * @param accountId - The account ID.
 * @returns The account or null if not found/unauthorized.
 */
export async function getAccountAction(accountId: string): Promise<Account | null> {
  return withAuthRead("getAccountAction", async (userId) => {
    const result = await prismaAccountRepo.getById(accountId, userId);
    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getAccountAction] Error:", result.error);
      }
      return null;
    }
    return result.data;
  });
}

/**
 * Save (create or update) an account.
 * @param account - The account data to save.
 * @returns Object with success status and optional error message.
 */
export async function saveAccountAction(
  account: Partial<Account>
): Promise<{ success: boolean; data?: Account; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const accountWithUser = { ...account, userId };

    // Check if account exists to decide between create and update
    let result;
    if (account.id) {
      const existing = await prismaAccountRepo.getById(account.id, userId);
      if (existing.data) {
        result = await prismaAccountRepo.update(account.id, userId, accountWithUser);
      } else {
        result = await prismaAccountRepo.create(accountWithUser);
      }
    } else {
      result = await prismaAccountRepo.create(accountWithUser);
    }

    if (result.error) {
      console.error("[saveAccountAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Invalidate accounts cache and revalidate dashboard
    revalidateTag(`accounts:${userId}`, "max");
    revalidatePath("/dashboard/[accountId]", "page");

    return { success: true, data: result.data as Account };
  } catch (error) {
    console.error("[saveAccountAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Delete an account.
 * @param accountId - The account ID to delete.
 * @returns Object with success status and optional error message.
 */
export async function deleteAccountAction(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaAccountRepo.delete(accountId, userId);

    if (result.error) {
      console.error("[deleteAccountAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Invalidate accounts cache and revalidate
    revalidateTag(`accounts:${userId}`, "max");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("[deleteAccountAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update account balance.
 * @param accountId - The account ID.
 * @param newBalance - The new balance value.
 * @returns Object with success status and optional error message.
 */
export async function updateAccountBalanceAction(
  accountId: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // First verify ownership
    const existing = await prismaAccountRepo.getById(accountId, userId);
    if (existing.error || !existing.data) {
      return { success: false, error: "Account not found or unauthorized" };
    }

    const result = await prismaAccountRepo.updateBalance(accountId, userId, newBalance);

    if (result.error) {
      console.error("[updateAccountBalanceAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    // Revalidate dashboard to reflect changes
    revalidatePath(`/dashboard/${accountId}`, "page");

    return { success: true };
  } catch (error) {
    console.error("[updateAccountBalanceAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get settings for a specific account or user's default settings.
 * @param accountId - Optional account ID.
 * @returns Settings or null.
 */
export async function getSettingsAction(accountId?: string): Promise<Settings | null> {
  return withAuthRead("getSettingsAction", async (userId) => {
    const result = await prismaSettingsRepo.getSettings(userId, accountId);
    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getSettingsAction] Error:", result.error);
      }
      return null;
    }
    return result.data;
  });
}

/**
 * Save account settings.
 * @param settings - The settings data.
 * @returns Success status and optional error.
 */
export async function saveSettingsAction(
  settings: Partial<Settings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const result = await prismaSettingsRepo.saveSettings({ ...settings, userId });

    if (result.error) {
      console.error("[saveSettingsAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[saveSettingsAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get global user settings.
 * @returns UserSettings or null.
 */
export async function getUserSettingsAction(): Promise<UserSettings | null> {
  return withAuthRead("getUserSettingsAction", async (userId) => {
    const result = await prismaSettingsRepo.getUserSettings(userId);
    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getUserSettingsAction] Error:", result.error);
      }
      return null;
    }
    return result.data;
  });
}

/**
 * Save global user settings.
 * @param settings - The user settings data.
 * @returns Success status and optional error.
 */
export async function saveUserSettingsAction(
  settings: Partial<UserSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const result = await prismaSettingsRepo.saveUserSettings(userId, settings);

    if (result.error) {
      console.error("[saveUserSettingsAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[saveUserSettingsAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Check if an account has any trades.
 * Used for UI locks (e.g. disabling currency change if trades exist).
 * @param accountId - The account ID.
 * @returns Boolean or false on error.
 */
export async function checkAccountHasTradesAction(accountId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const result = await prismaTradeRepo.countByAccountId(accountId, userId);

    if (result.error) {
      console.error("[checkAccountHasTradesAction] Error:", result.error);
      return false;
    }

    return (result.data || 0) > 0;
  } catch (error) {
    console.error("[checkAccountHasTradesAction] Unexpected error:", error);
    return false;
  }
}

/**
 * Sync balances for all user accounts.
 * Recalculates currentBalance from initialBalance + totalPnl.
 * @returns Object with success status and count of synced accounts.
 */
export async function syncAllAccountsBalancesAction(): Promise<{
  success: boolean;
  syncedCount: number;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, syncedCount: 0 };

    const accountsResult = await prismaAccountRepo.getByUserId(userId);
    if (accountsResult.error || !accountsResult.data) {
      return { success: false, syncedCount: 0 };
    }

    let syncedCount = 0;
    for (const account of accountsResult.data) {
      try {
        const metricsResult = await prismaTradeRepo.getDashboardMetrics(account.id, userId);
        const totalPnl = metricsResult.data?.totalPnl || 0;
        const newBalance = account.initialBalance + totalPnl;

        if (Math.abs(newBalance - account.currentBalance) > 0.01) {
          await prismaAccountRepo.updateBalance(account.id, userId, newBalance);
          syncedCount++;
        }
      } catch (error) {
        console.error(
          `[syncAllAccountsBalancesAction] Error syncing account ${account.id}:`,
          error
        );
      }
    }

    return { success: true, syncedCount };
  } catch (error) {
    console.error("[syncAllAccountsBalancesAction] Unexpected error:", error);
    return { success: false, syncedCount: 0 };
  }
}

/**
 * Get a single account by ID optimized for dashboard initialization.
 * Skips the repository layer for maximum performance (no extra checks/transforms).
 * @param accountId - The account ID.
 * @returns The account or null.
 */
export async function getAccountById(accountId: string): Promise<Account | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const account = await prisma.accounts.findFirst({
      where: {
        id: accountId,
        user_id: userId,
      },
      select: {
        id: true,
        user_id: true,
        name: true,
        initial_balance: true,
        current_balance: true,
        currency: true,
        leverage: true,
        max_drawdown: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!account) return null;

    // Direct mapping to Account interface
    return {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      broker: "N/A", // Field not in DB schema, using fallback
      initialBalance: Number(account.initial_balance),
      currentBalance: Number(account.current_balance),
      currency: account.currency,
      leverage: account.leverage,
      maxDrawdown: Number(account.max_drawdown),
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      isArchived: false,
    } as unknown as Account;
  } catch (error) {
    console.error("[getAccountById] Error:", error);
    return null;
  }
}
