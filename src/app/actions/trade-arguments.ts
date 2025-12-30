"use server";

/**
 * Trade Arguments Server Actions
 *
 * Server-side actions for PDArray (Prós e Contras) feature.
 * Manages CRUD operations for trade arguments on journal entries.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/database/auth";
import { addArgumentSchema } from "@/schemas/tradeArgumentsSchema";
import { TradeArgument } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Transform database row to TradeArgument type
 */
function transformArgument(row: {
  id: string;
  journal_entry_id: string;
  type: string;
  argument: string;
  weight: number;
  created_at: string;
}): TradeArgument {
  return {
    id: row.id,
    journalEntryId: row.journal_entry_id,
    type: row.type as "pro" | "contra",
    argument: row.argument,
    weight: row.weight,
    createdAt: row.created_at,
  };
}

/**
 * Get all trade arguments for a journal entry.
 */
export async function getTradeArgumentsAction(journalEntryId: string): Promise<TradeArgument[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trade_arguments")
      .select("*")
      .eq("journal_entry_id", journalEntryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[getTradeArgumentsAction] Error:", error);
      return [];
    }

    return (data || []).map(transformArgument);
  } catch (error) {
    console.error("[getTradeArgumentsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Add a new trade argument to a journal entry.
 */
export async function addTradeArgumentAction(
  journalEntryId: string,
  type: "pro" | "contra",
  argument: string
): Promise<{ success: boolean; data?: TradeArgument; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Não autenticado" };
    }

    // Validate input with Zod
    const validation = addArgumentSchema.safeParse({
      journalEntryId,
      type,
      argument,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    const supabase = await createClient();

    // Verify journal entry ownership
    const { data: journal, error: journalError } = await supabase
      .from("journal_entries")
      .select("id, account_id")
      .eq("id", journalEntryId)
      .eq("user_id", userId)
      .single();

    if (journalError || !journal) {
      return { success: false, error: "Entrada de journal não encontrada" };
    }

    // Insert the argument
    const { data, error } = await supabase
      .from("trade_arguments")
      .insert({
        journal_entry_id: journalEntryId,
        type: validation.data.type,
        argument: validation.data.argument,
        weight: 1,
      })
      .select()
      .single();

    if (error) {
      console.error("[addTradeArgumentAction] Error:", error);
      return { success: false, error: "Erro ao adicionar argumento" };
    }

    // Revalidate dashboard cache
    revalidatePath("/dashboard", "page");

    return { success: true, data: transformArgument(data) };
  } catch (error) {
    console.error("[addTradeArgumentAction] Unexpected error:", error);
    return { success: false, error: "Erro inesperado" };
  }
}

/**
 * Remove a trade argument.
 */
export async function removeTradeArgumentAction(
  argumentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Não autenticado" };
    }

    const supabase = await createClient();

    // Delete the argument (RLS will ensure ownership)
    const { error } = await supabase.from("trade_arguments").delete().eq("id", argumentId);

    if (error) {
      console.error("[removeTradeArgumentAction] Error:", error);
      return { success: false, error: "Erro ao remover argumento" };
    }

    // Revalidate dashboard cache
    revalidatePath("/dashboard", "page");

    return { success: true };
  } catch (error) {
    console.error("[removeTradeArgumentAction] Unexpected error:", error);
    return { success: false, error: "Erro inesperado" };
  }
}
