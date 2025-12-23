"use server";

import { prismaPlaybookRepo } from "@/lib/repositories/prisma";
import { createClient } from "@/lib/supabase/server";
import { Playbook } from "@/types";

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

export async function fetchPlaybooks(accountId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // If specific account, fetch by account, otherwise fetch all user's playbooks
  if (accountId) {
    const result = await prismaPlaybookRepo.getByAccountId(accountId);
    return result.data || [];
  } else {
    const result = await prismaPlaybookRepo.getByUserId(userId);
    return result.data || [];
  }
}

export async function createPlaybook(playbook: Partial<Playbook>): Promise<Playbook | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaPlaybookRepo.create({ ...playbook, userId });
  if (result.error) throw new Error(result.error.message);

  return result.data;
}

export async function updatePlaybook(playbook: Playbook): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaPlaybookRepo.update(playbook.id, userId, playbook);
  if (result.error) throw new Error(result.error.message);
}

export async function deletePlaybook(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const result = await prismaPlaybookRepo.delete(id, userId);
  if (result.error) throw new Error(result.error.message);
}

// Helper to handle rule updates within the playbook JSON structure
// Granular rule updates are handled by the client via updatePlaybook for now.

import { SharedPlaybook } from "@/types";

export async function clonePlaybook(sharedPlaybook: SharedPlaybook): Promise<Playbook | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  // Ensure we have the full playbook data
  const sourcePlaybook = sharedPlaybook.playbook;
  if (!sourcePlaybook) throw new Error("Source playbook data invalid");

  const newPlaybookData: Partial<Playbook> = {
    name: sourcePlaybook.name,
    description: sourcePlaybook.description || sharedPlaybook.description,
    icon: sourcePlaybook.icon,
    color: sourcePlaybook.color,
    ruleGroups: sourcePlaybook.ruleGroups,
    userId: userId,
    // accountId: null // Explicitly explicitly not linked to an account initially, or let user decide later
  };

  const result = await prismaPlaybookRepo.create(newPlaybookData);
  if (result.error) throw new Error(result.error.message);

  return result.data;
}
