import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { scrapeForexFactoryMonth } from "../src/services/core/forexScraper.service";
import { startOfYear, addMonths, isBefore, format } from "date-fns";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Erro: Variáveis de ambiente SUPABASE ausentes.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const today = new Date();

    // De: Inicio do ano atual
    let currentIterDate = startOfYear(today);

    // Até: Proximo mes (inclusive)
    const stopDate = addMonths(today, 1);

    const totalStats = {
      monthsProcessed: 0,
      totalEvents: 0,
      errors: 0,
    };

    console.log(
      `[Sync History] 🚀 Iniciando sync global de ${format(currentIterDate, "MMM/yyyy")} até ${format(stopDate, "MMM/yyyy")}`
    );

    while (
      isBefore(currentIterDate, stopDate) ||
      currentIterDate.getMonth() === stopDate.getMonth()
    ) {
      const monthStr = format(currentIterDate, "MMMM yyyy");
      console.log(`[Sync History] 📅 Processando: ${monthStr}...`);

      try {
        // 1. Scrape do Mês
        const events = await scrapeForexFactoryMonth(currentIterDate);

        if (events.length > 0) {
          // 2. Upsert no Banco
          const { error } = await supabase.from("economic_events").upsert(events, {
            onConflict: "date, time, currency, event_name",
            ignoreDuplicates: false,
          });

          if (error) {
            console.error(`[Sync History] ❌ Erro ao salvar ${monthStr}:`, error);
            totalStats.errors++;
          } else {
            console.log(`[Sync History] ✅ ${events.length} eventos salvos para ${monthStr}`);
            totalStats.totalEvents += events.length;
          }
        } else {
          console.warn(`[Sync History] ⚠️ Nenhum evento encontrado para ${monthStr}`);
        }

        totalStats.monthsProcessed++;
      } catch (err) {
        console.error(`[Sync History] 💥 Erro crítico no mês ${monthStr}:`, err);
        totalStats.errors++;
      }

      // Avançar para próximo mês
      currentIterDate = addMonths(currentIterDate, 1);

      // Delay gentil para não ser bloqueado (2 segundos entre meses)
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("\n===========================================");
    console.log("✅ Sincronização Histórica Concluída!");
    console.log(`📅 Meses Processados: ${totalStats.monthsProcessed}`);
    console.log(`📥 Total Eventos: ${totalStats.totalEvents}`);
    console.log(`❌ Erros Totais: ${totalStats.errors}`);
    console.log("===========================================\n");
  } catch (error) {
    console.error("[Sync History] 💀 Falha geral:", error);
    process.exit(1);
  }
}

main();
