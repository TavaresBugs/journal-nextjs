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

import { syncForexCalendar, DBEvent } from "../src/services/core/forexCalendar.service";
import {
  scrapeForexFactory,
  compareScrapedEvents,
} from "../src/services/core/forexScraper.service";
import {
  upsertEconomicEvents,
  deleteOldEvents,
  deleteCurrentWeekEvents,
} from "../src/lib/database/repositories/external/economicEvents.repository";

// Parse argumentos
const args = process.argv.slice(2);
const cleanupArg = args.includes("--cleanup");
const forceJsonArg = args.includes("--json");

// Helper para mapear impacto do scraper para o banco
function mapImpact(scrapeImpact: string): "high" | "medium" | "low" {
  switch (scrapeImpact) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "low";
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("📰 Forex Factory Calendar Sync (Scraper + Fallback)");
  console.log("═══════════════════════════════════════════════════");
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
    // 1. Limpeza de eventos antigos (opcional)
    if (cleanupArg) {
      console.log("\n🧹 Limpando eventos com mais de 30 dias...");
      const deleted = await deleteOldEvents(30);
      console.log(`   ${deleted} eventos antigos removidos`);
    }

    let finalEvents: DBEvent[] = [];
    let method = "";

    // 2. Tentar Scraper (a menos que force o JSON)
    if (!forceJsonArg) {
      try {
        console.log("\n🔄 Iniciando Scraper (Double-Check)...");

        console.log("   [1/2] Primeiro Scrape...");
        const scrape1 = await scrapeForexFactory();
        console.log(`   ✅ Recebidos ${scrape1.length} eventos`);

        console.log("   [2/2] Segundo Scrape (Aguardando 3s)...");
        await new Promise((r) => setTimeout(r, 3000));
        const scrape2 = await scrapeForexFactory();
        console.log(`   ✅ Recebidos ${scrape2.length} eventos`);

        const { match, diff } = compareScrapedEvents(scrape1, scrape2);

        if (match && scrape1.length > 0) {
          console.log("   ✅ Scrapes coincidem! (Dados consistentes)");
          method = "Scraper (Double-Check OK)";
          finalEvents = scrape1.map((e) => ({
            date: e.date,
            time: e.time,
            currency: e.currency,
            impact: mapImpact(e.impact),
            event_name: e.event_name,
            actual: e.actual,
            forecast: e.forecast,
            previous: e.previous,
          }));
        } else {
          console.warn("   ⚠️ Scrapes divergentes ou vazios.");
          if (diff.length > 0) {
            console.warn(`   Diferenças: ${diff.length} itens.`);
          }
          throw new Error("Divergência técnica no Scraper");
        }
      } catch (scraperError) {
        console.error(
          "   ❌ Falha no Scraper:",
          scraperError instanceof Error ? scraperError.message : scraperError
        );
        console.log("   🔄 Acionando FALLBACK: JSON oficial...");
      }
    }

    // 3. Fallback para JSON (se finalEvents ainda estiver vazio)
    if (finalEvents.length === 0) {
      console.log("\n📊 Buscando eventos via JSON oficial...");
      finalEvents = await syncForexCalendar();
      method = "JSON Oficial (Fallback)";
    }

    console.log(`\n📄 Total de eventos processados: ${finalEvents.length}`);
    console.log(`📡 Método utilizado: ${method}`);

    if (finalEvents.length === 0) {
      console.log("ℹ️  Nenhum evento encontrado em ambas as fontes.");
      process.exit(0);
    }

    // Resumo por impacto
    const highCount = finalEvents.filter((e) => e.impact === "high").length;
    const mediumCount = finalEvents.filter((e) => e.impact === "medium").length;
    const lowCount = finalEvents.filter((e) => e.impact === "low").length;

    console.log(`   🔴 Alto impacto: ${highCount}`);
    console.log(`   🟡 Médio impacto: ${mediumCount}`);
    console.log(`   🟠 Baixo impacto: ${lowCount}`);

    // Salvar no banco
    console.log("\n💾 Sincronizando com Supabase (Delete Week + Upsert)...");

    // Deleta os da semana atual antes (opcional, para garantir limpeza total)
    const deletedThisWeek = await deleteCurrentWeekEvents();
    console.log(`   🗑️ ${deletedThisWeek} eventos da semana atual removidos`);

    const result = await upsertEconomicEvents(finalEvents);

    console.log("───────────────────────────────────────────────────");
    console.log(`✅ Sucesso! ${result.count} eventos salvos via ${method}`);
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
