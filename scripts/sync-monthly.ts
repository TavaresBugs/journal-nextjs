/**
 * Script para Sincronização Mensal do Calendário Econômico
 * Este script busca eventos para o mês atual e o próximo mês.
 *
 * Uso: npx tsx scripts/sync-monthly.ts
 */

import { createClient } from "@supabase/supabase-js";
import { scrapeForexFactoryMonth } from "../src/services/core/forexScraper.service";
import { format, addMonths, startOfMonth } from "date-fns";

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("📅 Forex Factory Monthly Sync");
  console.log("═══════════════════════════════════════════════════");
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERRO: Variáveis de ambiente do Supabase não configuradas.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();

  // Meses para sincronizar: Atual e Próximo
  const monthsToSync = [startOfMonth(today), startOfMonth(addMonths(today, 1))];

  let totalSaved = 0;

  for (const monthDate of monthsToSync) {
    const monthStr = format(monthDate, "MMMM yyyy");
    console.log(`\n🔍 Processando: ${monthStr}...`);

    try {
      const events = await scrapeForexFactoryMonth(monthDate);

      if (events.length > 0) {
        console.log(`   ✅ Extraído ${events.length} eventos.`);

        // Mapear impacto do scraper para o banco
        const dbEvents = events.map((e) => ({
          date: e.date,
          time: e.time,
          currency: e.currency,
          impact: e.impact === "none" ? "low" : e.impact,
          event_name: e.event_name,
          actual: e.actual,
          forecast: e.forecast,
          previous: e.previous,
        }));

        const { error } = await supabase.from("economic_events").upsert(dbEvents, {
          onConflict: "date, time, currency, event_name",
          ignoreDuplicates: false,
        });

        if (error) {
          console.error(`   ❌ Erro ao salvar no Supabase:`, error.message);
        } else {
          console.log(`   💾 ${events.length} eventos sincronizados.`);
          totalSaved += events.length;
        }
      } else {
        console.warn(`   ⚠️ Nenhum evento encontrado para ${monthStr}`);
      }
    } catch (err) {
      console.error(`   ❌ Erro crítico ao processar ${monthStr}:`, err);
    }

    // Esperar um pouco entre os meses para evitar rate limit
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n───────────────────────────────────────────────────");
  console.log(`✅ Sucesso! Total de ${totalSaved} eventos processados.`);
  console.log(`⏰ Finalizado em: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════");

  process.exit(0);
}

main();
