import { supabase } from "@/lib/supabase";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import type { DBEvent } from "@/services/core/forexCalendar.service";

// Service role client for write operations (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Only create admin client if service key is available (server-side)
const getAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not available");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: "high" | "medium" | "low";
  event_name: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// READ OPERATIONS (use normal client - RLS allows public read)
// ============================================

/**
 * Buscar eventos por data
 */
export async function getEventsByDate(date: Date): Promise<EconomicEvent[]> {
  const dateStr = date.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("economic_events")
    .select("*")
    .eq("date", dateStr)
    .order("time", { ascending: true });

  if (error) throw error;
  return data as EconomicEvent[];
}

/**
 * Buscar eventos da semana
 */
export async function getEventsForWeek(startDate: Date): Promise<EconomicEvent[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("economic_events")
    .select("*")
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data as EconomicEvent[];
}

/**
 * Buscar eventos por período
 */
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<EconomicEvent[]> {
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("economic_events")
    .select("*")
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data as EconomicEvent[];
}

/**
 * Buscar eventos high impact da semana
 */
export async function getHighImpactEvents(startDate: Date): Promise<EconomicEvent[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("economic_events")
    .select("*")
    .gte("date", startStr)
    .lte("date", endStr)
    .eq("impact", "high")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) throw error;
  return data as EconomicEvent[];
}

// ============================================
// WRITE OPERATIONS (use admin client - requires service role)
// ============================================

/**
 * Inserir ou atualizar eventos (upsert) - SERVER SIDE ONLY
 * Uses service role key to bypass RLS
 */
export async function upsertEconomicEvents(
  events: DBEvent[]
): Promise<{ success: boolean; count: number }> {
  if (events.length === 0) {
    console.log("[Repository] Nenhum evento para salvar");
    return { success: true, count: 0 };
  }

  const adminClient = getAdminClient();

  const { error } = await adminClient.from("economic_events").upsert(events, {
    onConflict: "date,time,currency,event_name",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("[Repository] ❌ Erro ao salvar eventos:", error);
    throw error;
  }

  console.log(`[Repository] ✅ ${events.length} eventos salvos`);
  return { success: true, count: events.length };
}

/**
 * Deletar eventos antigos (mais de X dias) - SERVER SIDE ONLY
 */
export async function deleteOldEvents(daysToKeep: number = 30): Promise<number> {
  const adminClient = getAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  const { data, error } = await adminClient
    .from("economic_events")
    .delete()
    .lt("date", cutoffStr)
    .select("id");

  if (error) {
    console.error("[Repository] ❌ Erro ao deletar eventos antigos:", error);
    throw error;
  }

  const deletedCount = data?.length || 0;
  console.log(`[Repository] 🗑️ ${deletedCount} eventos antigos deletados`);
  return deletedCount;
}

/**
 * Deletar TODOS os eventos da semana atual - SERVER SIDE ONLY
 * Útil para re-sincronizar com formato de dados diferente
 */
export async function deleteCurrentWeekEvents(): Promise<number> {
  const adminClient = getAdminClient();

  // Calcular início e fim da semana atual
  // Calcular início e fim da semana atual com date-fns para consistência total
  const today = new Date();

  // startOfWeek com weekStartsOn: 0 (Domingo)
  const startDay = startOfWeek(today, { weekStartsOn: 0 });
  const endDay = endOfWeek(today, { weekStartsOn: 0 });

  const startStr = format(startDay, "yyyy-MM-dd");
  const endStr = format(endDay, "yyyy-MM-dd");

  console.log(`[Repository] Deletando eventos de ${startStr} até ${endStr}`);

  const { data, error } = await adminClient
    .from("economic_events")
    .delete()
    .gte("date", startStr)
    .lte("date", endStr)
    .select("id");

  if (error) {
    console.error("[Repository] ❌ Erro ao deletar eventos da semana:", error);
    throw error;
  }

  const deletedCount = data?.length || 0;
  console.log(`[Repository] 🗑️ ${deletedCount} eventos da semana deletados`);
  return deletedCount;
}
