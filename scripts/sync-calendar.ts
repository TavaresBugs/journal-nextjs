#!/usr/bin/env node

/**
 * Script CLI para sincronizar calendário econômico do Forex Factory
 *
 * Usa JSON público oficial: https://nfs.faireconomy.media/ff_calendar_thisweek.json
 *
 * Uso:
 *   bun run sync-calendar           # Sincroniza semana atual
 *   bun run sync-calendar --cleanup # Sincroniza e limpa eventos antigos
 *
 * Configuração via variáveis de ambiente:
 *   NEXT_PUBLIC_SUPABASE_URL - URL do Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Chave de serviço do Supabase
 */

import { syncForexCalendar } from "../src/services/core/forexCalendar.service";
import {
  upsertEconomicEvents,
  deleteOldEvents,
} from "../src/lib/repositories/economicEvents.repository";

// Parse argumentos
const args = process.argv.slice(2);
const cleanupArg = args.includes("--cleanup");

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("📰 Forex Factory Calendar Sync");
  console.log("═══════════════════════════════════════════════════");
  console.log(`🌐 Fonte: nfs.faireconomy.media/ff_calendar_thisweek.json`);
  console.log(`🧹 Limpeza de eventos antigos: ${cleanupArg ? "Sim" : "Não"}`);
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
  console.log("───────────────────────────────────────────────────");

  // Verificar variáveis de ambiente
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL não configurada");
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY não configurada");
    process.exit(1);
  }

  try {
    // Limpeza de eventos antigos (opcional)
    if (cleanupArg) {
      console.log("\n🧹 Limpando eventos com mais de 30 dias...");
      const deleted = await deleteOldEvents(30);
      console.log(`   ${deleted} eventos antigos removidos`);
    }

    // Fetch JSON e transformar
    console.log("\n📊 Buscando eventos do Forex Factory...");
    const events = await syncForexCalendar();

    console.log(`\n📄 Total de eventos recebidos: ${events.length}`);

    if (events.length === 0) {
      console.log("ℹ️  Nenhum evento encontrado");
      process.exit(0);
    }

    // Resumo por impacto
    const highCount = events.filter((e) => e.impact === "high").length;
    const mediumCount = events.filter((e) => e.impact === "medium").length;
    const lowCount = events.filter((e) => e.impact === "low").length;

    console.log(`   🔴 Alto impacto: ${highCount}`);
    console.log(`   🟡 Médio impacto: ${mediumCount}`);
    console.log(`   🟠 Baixo impacto: ${lowCount}`);

    // Resumo por moeda
    const currencies = [...new Set(events.map((e) => e.currency))];
    console.log(`   💱 Moedas: ${currencies.join(", ")}`);

    // Salvar no banco
    console.log("\n💾 Salvando no Supabase...");
    const result = await upsertEconomicEvents(events);

    console.log("───────────────────────────────────────────────────");
    console.log(`✅ Sucesso! ${result.count} eventos salvos no Supabase`);
    console.log(`⏰ Finalizado em: ${new Date().toISOString()}`);
    console.log("═══════════════════════════════════════════════════");

    process.exit(0);
  } catch (error) {
    console.error("───────────────────────────────────────────────────");
    console.error("❌ Erro fatal:", error);
    console.error("═══════════════════════════════════════════════════");
    process.exit(1);
  }
}

main();
