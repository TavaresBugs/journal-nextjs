import { NextRequest, NextResponse } from "next/server";
import {
  scrapeForexFactory,
  compareScrapedEvents,
  type ScrapedEvent,
} from "@/lib/services/forexScraper.service";
import { syncForexCalendar } from "@/lib/services/forexCalendar.service";
import {
  upsertEconomicEvents,
  deleteCurrentWeekEvents,
} from "@/lib/repositories/economicEvents.repository";
import type { DBEvent } from "@/lib/services/forexCalendar.service";

// Rate limit simples em memória (use Redis em produção para multi-instance)
const lastSyncTime = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit por IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const lastTime = lastSyncTime.get(clientIp) || 0;
    const now = Date.now();

    if (now - lastTime < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000 / 60);
      return NextResponse.json(
        {
          error: `Rate limit excedido. Aguarde ${waitTime} minuto(s) para tentar novamente.`,
          retryAfter: waitTime,
        },
        { status: 429 }
      );
    }

    console.log(`[API] Sincronizando calendário para IP: ${clientIp}`);

    // ========================================
    // DOUBLE-CHECK: Fazer 2 scrapes e comparar
    // ========================================

    let scrape1: ScrapedEvent[] = [];
    let scrape2: ScrapedEvent[] = [];

    try {
      // 1. Primeiro Scrape
      console.log("[API] 🔄 Scrape #1 iniciando...");
      scrape1 = await scrapeForexFactory();
      console.log(`[API] ✅ Scrape #1: ${scrape1.length} eventos`);

      if (scrape1.length === 0) {
        throw new Error("Scrape #1 retornou 0 eventos");
      }

      // 2. Aguarda 3 segundos para evitar cache/rate-limit
      console.log("[API] ⏳ Aguardando 3s antes do Scrape #2...");
      await new Promise((r) => setTimeout(r, 3000));

      // 3. Segundo Scrape
      console.log("[API] 🔄 Scrape #2 iniciando...");
      scrape2 = await scrapeForexFactory();
      console.log(`[API] ✅ Scrape #2: ${scrape2.length} eventos`);

      if (scrape2.length === 0) {
        throw new Error("Scrape #2 retornou 0 eventos");
      }
    } catch (scraperError) {
      console.warn(
        "[API] ⚠️ Falha no Scraper (possível 403/Timeout). Usando fallback JSON...",
        scraperError
      );

      // Fallback: JSON oficial (sem double-check, pois é API oficial)
      const jsonEvents = await syncForexCalendar();

      if (jsonEvents.length === 0) {
        return NextResponse.json({
          success: true,
          synced: 0,
          message: "Nenhum evento encontrado (Falha no Scraper e JSON vazio)",
        });
      }

      // JSON é confiável - salvar direto (delete + insert)
      console.log(`[API] 📥 JSON Fallback: ${jsonEvents.length} eventos. Salvando...`);
      await deleteCurrentWeekEvents();
      await upsertEconomicEvents(jsonEvents);

      lastSyncTime.set(clientIp, now);

      return NextResponse.json({
        success: true,
        synced: jsonEvents.length,
        message: `${jsonEvents.length} eventos via JSON (fallback)`,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Comparar os 2 scrapes
    console.log("[API] 🔍 Comparando Scrape #1 vs Scrape #2...");
    const { match, diff, stats } = compareScrapedEvents(scrape1, scrape2);

    if (!match) {
      // ❌ Scrapes divergentes - NÃO SALVAR
      console.error("[API] ❌ DIVERGÊNCIA DETECTADA! Scrapes não correspondem.");
      console.error(`[API] Scrape1: ${stats.scrape1Count}, Scrape2: ${stats.scrape2Count}`);
      console.error("[API] Diferenças:", diff.slice(0, 10)); // Mostrar até 10 diferenças

      // TODO: Aqui poderia enviar email/webhook para admin

      return NextResponse.json(
        {
          success: false,
          error: "Scrapes divergentes - sincronização abortada",
          message: "Os dois scrapes retornaram dados diferentes. Admin notificado.",
          stats,
          divergences: diff.slice(0, 20), // Limitar resposta
        },
        { status: 409 }
      ); // Conflict
    }

    // ✅ Scrapes iguais - SEGURO salvar
    console.log("[API] ✅ Scrapes iguais! Prosseguindo com delete + insert...");

    // Transformar para formato do banco
    const eventsToSave: DBEvent[] = scrape1.map((event) => ({
      date: event.date,
      time: event.time,
      currency: event.currency,
      impact: mapImpact(event.impact),
      event_name: event.event_name,
      actual: event.actual,
      forecast: event.forecast,
      previous: event.previous,
    }));

    // Delete + Insert (seguro pois double-check passou)
    const deleted = await deleteCurrentWeekEvents();
    console.log(`[API] 🗑️ ${deleted} eventos antigos deletados`);

    await upsertEconomicEvents(eventsToSave);

    // Atualizar rate limit
    lastSyncTime.set(clientIp, now);

    // Limpar rate limits antigos (mais de 10 minutos)
    const cleanupThreshold = now - 10 * 60 * 1000;
    for (const [ip, time] of lastSyncTime.entries()) {
      if (time < cleanupThreshold) {
        lastSyncTime.delete(ip);
      }
    }

    return NextResponse.json({
      success: true,
      synced: eventsToSave.length,
      deleted,
      message: `${eventsToSave.length} eventos via Scraper (double-check OK)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Erro:", error);
    return NextResponse.json(
      {
        error: "Falha ao sincronizar calendário",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper para garantir que o impacto seja um dos valores aceitos pelo banco
function mapImpact(scrapeImpact: string): "high" | "medium" | "low" {
  switch (scrapeImpact) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "low"; // Default para 'none' ou desconhecido
  }
}

// DELETE para limpar eventos da semana (Reset manual)
export async function DELETE() {
  try {
    const deleted = await deleteCurrentWeekEvents();
    return NextResponse.json({
      success: true,
      deleted,
      message: `${deleted} eventos da semana foram removidos.`,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao limpar calendário" }, { status: 500 });
  }
}

// GET para verificar status
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/sync-calendar",
    methods: ["POST", "DELETE"],
    description: "Sincroniza ou limpa calendário econômico",
    source: "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    rateLimit: "1 request a cada 5 minutos por IP",
  });
}
