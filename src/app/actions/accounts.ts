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

import { prismaAccountRepo } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { Account } from "@/types";
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const accountWithUser = { ...account, userId };

    // Check if account exists to decide between create and update
    let result;
    if (account.id) {
      const existing = await prismaAccountRepo.getById(account.id);
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

    return { success: true };
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

    const result = await prismaAccountRepo.updateBalance(accountId, newBalance);

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
