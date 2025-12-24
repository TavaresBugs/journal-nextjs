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
import { getCurrentUserId } from "@/lib/database/auth";
import { Account, Settings, UserSettings } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Get all accounts for the current user.
 * @returns List of accounts or empty array if not authenticated.
 */
export async function getAccountsAction(): Promise<Account[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaAccountRepo.getByUserId(userId);

    if (result.error) {
      console.error("[getAccountsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getAccountsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get a single account by ID.
 * @param accountId - The account ID.
 * @returns The account or null if not found/unauthorized.
 */
export async function getAccountAction(accountId: string): Promise<Account | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaAccountRepo.getById(accountId, userId);

    if (result.error) {
      // Don't log NOT_FOUND as an error
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getAccountAction] Error:", result.error);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getAccountAction] Unexpected error:", error);
    return null;
  }
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

    // Revalidate dashboard to reflect changes
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

    // Revalidate to reflect changes
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
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaSettingsRepo.getSettings(userId, accountId);

    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getSettingsAction] Error:", result.error);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getSettingsAction] Unexpected error:", error);
    return null;
  }
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
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaSettingsRepo.getUserSettings(userId);

    if (result.error) {
      if (result.error.code !== "DB_NOT_FOUND") {
        console.error("[getUserSettingsAction] Error:", result.error);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getUserSettingsAction] Unexpected error:", error);
    return null;
  }
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
