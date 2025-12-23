"use server";

import { prismaAccountRepo, prismaTradeRepo } from "@/lib/repositories/prisma";
import { createClient } from "@/lib/supabase/server";
import { Account } from "@/types";

/**
 * Get current user ID from Supabase auth.
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function fetchAccounts() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const result = await prismaAccountRepo.getByUserId(userId);
  return result.data || [];
}

export async function createAccount(account: Partial<Account>): Promise<Account | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaAccountRepo.create({ ...account, userId });
  if (result.error) throw new Error(result.error.message);

  return result.data;
}

export async function updateAccount(account: Account): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaAccountRepo.update(account.id, userId, account);
  if (result.error) throw new Error(result.error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaAccountRepo.delete(id, userId);
  if (result.error) throw new Error(result.error.message);
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  // Check ownership by fetching first
  const accountResult = await prismaAccountRepo.getById(id, userId);
  if (!accountResult.data) throw new Error("Account not found");

  const result = await prismaAccountRepo.updateBalance(id, balance);
  if (result.error) throw new Error(result.error.message);
}

export async function checkAccountHasTrades(accountId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const result = await prismaTradeRepo.countByAccountId(accountId, userId);
  return (result.data || 0) > 0;
}
