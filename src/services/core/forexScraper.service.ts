import puppeteer from "puppeteer";
import { format, parse } from "date-fns";

export interface ScrapedEvent {
  date: string; // ISO "2025-12-18"
  time: string; // "10:30am", "Tentative", "All Day"
  currency: string; // "USD"
  impact: "high" | "medium" | "low" | "none";
  event_name: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

const FOREX_FACTORY_URL = "https://www.forexfactory.com/calendar";

/**
 * Mapeamento de classes CSS/Title para níveis de impacto
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IMPACT_MAP: Record<string, ScrapedEvent["impact"]> = {
  "High Impact": "high",
  high: "high",
  "Medium Impact": "medium",
  medium: "medium",
  "Low Impact": "low",
  low: "low",
  "Non-Economic": "none",
  gray: "none",
};

/**
 * Buscar eventos usando Puppeteer (Headless Chrome) para evitar bloqueios 403
 */
export async function scrapeForexFactory(): Promise<ScrapedEvent[]> {
  let browser = null;
  try {
    // Calcular a data de início da semana (Domingo) para usar no parâmetro ?week=
    // O Forex Factory aceita o dia de início da semana (ex: Dec14.2025)
    // Isso garante que a view carregue a semana cheia (Sun-Sat) e não pare na Quinta.
    const today = new Date();
    const startOfWeekDate = new Date(today);
    startOfWeekDate.setDate(today.getDate() - today.getDay()); // Vai para o Domingo recente

    // Formato: MMMd.yyyy (ex: Dec14.2025)
    const weekParam = format(startOfWeekDate, "MMMd.yyyy");
    const targetUrl = `${FOREX_FACTORY_URL}?week=${weekParam}`;

    console.log(`[Scraper] Iniciando Puppeteer (Modo Stealth + Week) para ${targetUrl}...`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Configurar Viewport e User-Agent realistas
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // Headers adicionais para parecer humano e driblar CF
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
    });

    console.log("[Scraper] Navegando para a página...");

    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // Incremental Scroll para garantir que o Lazy Loading (se houver) carregue as linhas do meio
    // Forex Factory às vezes usa virtual scrolling ou delay em linhas do meio
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Esperar um pouco mais após o scroll completo
    await new Promise((r) => setTimeout(r, 1000));

    // Esperar seletor da tabela
    await page.waitForSelector(".calendar__table", { timeout: 30000 });

    console.log("[Scraper] Página carregada. Extraindo dados...");

    // Executar script no contexto da página para extrair dados
    const rawEvents = await page.evaluate(() => {
      // Selector correto: tr.calendar__row (com duplo underscore)
      const rows = Array.from(document.querySelectorAll("tr.calendar__row"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = [];

      // Armazena a data e hora correntes para preencher linhas vazias (comum no FF)
      let currentDateText = "";
      let currentTime = ""; // NOVO: Propagar horário para eventos consecutivos no mesmo horário

      rows.forEach((row) => {
        // Ignorar linhas de separação de dia (.calendar__row--day-breaker) se não tiver conteúdo útil
        if (row.classList.contains("calendar__row--day-breaker")) return;

        // 1. Data
        // A data vem dentro de .calendar__date. Se não tiver texto, usa a anterior.
        const dateText =
          row.querySelector(".calendar__date .date")?.textContent?.trim() ||
          row.querySelector(".calendar__date")?.textContent?.trim() ||
          "";

        // Se encontramos uma data nova, atualizamos a corrente
        if (dateText) {
          currentDateText = dateText;
        }

        // 2. Tempo - PROPAGAR se vazio (eventos no mesmo horário não repetem o time)
        const timeText = row.querySelector(".calendar__time")?.textContent?.trim() || "";
        if (timeText) {
          currentTime = timeText; // Atualiza o horário atual
        }

        // 3. Moeda
        const currency = row.querySelector(".calendar__currency")?.textContent?.trim() || "";

        // 4. Impacto
        const impactSpan = row.querySelector(".calendar__impact span");
        const impactTitle = impactSpan?.getAttribute("title") || "";
        const impactClass = impactSpan?.className || "";

        let impact = "none";
        if (impactTitle.includes("High") || impactClass.includes("icon--ff-impact-red"))
          impact = "high";
        else if (impactTitle.includes("Medium") || impactClass.includes("icon--ff-impact-ora"))
          impact = "medium";
        else if (impactTitle.includes("Low") || impactClass.includes("icon--ff-impact-yel"))
          impact = "low";

        // 5. Nome
        const eventName = row.querySelector(".calendar__event-title")?.textContent?.trim() || "";

        // 6. Valores
        const actual = row.querySelector(".calendar__actual")?.textContent?.trim() || null;
        const forecast = row.querySelector(".calendar__forecast")?.textContent?.trim() || null;
        const previous = row.querySelector(".calendar__previous")?.textContent?.trim() || null;

        // Só adicionar se tiver moeda e nome (filtra linhas de cabeçalho/vazias)
        if (currency && eventName) {
          results.push({
            dateText: currentDateText, // "SunDec 14"
            time: currentTime, // Usa horário propagado (eventos consecutivos herdam o horário)
            currency,
            impact,
            event_name: eventName,
            actual,
            forecast,
            previous,
          });
        }
      });

      return results;
    });

    console.log(`[Scraper] RAW: ${rawEvents.length} linhas extraídas. Processando datas...`);

    // Processar datas fora do browser context (temos acesso ao date-fns aqui)
    const events: ScrapedEvent[] = [];

    for (const raw of rawEvents) {
      if (!raw.dateText) continue;

      const isoDate = parseForexFactoryDate(raw.dateText);
      if (!isoDate) continue; // Só pular se não conseguir parsear a data

      // Converter tempo para 24h (se vazio, usar "All Day" como fallback)
      const time24 = convertTo24Hour(raw.time) || "All Day";

      // Incluir todos os eventos que têm data válida (não filtrar por tempo)
      events.push({
        date: isoDate,
        time: time24,
        currency: raw.currency,
        impact: raw.impact as "high" | "medium" | "low" | "none",
        event_name: raw.event_name,
        actual: raw.actual,
        forecast: raw.forecast,
        previous: raw.previous,
      });
    }

    console.log(`[Scraper] Sucesso! ${events.length} eventos processados e prontos.`);
    return events;
  } catch (error) {
    console.error("[Scraper] Erro crítico no Puppeteer:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
    throw error; // Relança para o route.ts pegar e usar fallback
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Variante para buscar o MÊS inteiro
 * URL param: ?month=mmm.yyyy (ex: jan.2024)
 */
export async function scrapeForexFactoryMonth(targetDate: Date): Promise<ScrapedEvent[]> {
  let browser = null;
  try {
    const monthParam = format(targetDate, "MMM.yyyy").toLowerCase();
    const targetUrl = `${FOREX_FACTORY_URL}?month=${monthParam}`;

    console.log(`[Scraper History] Iniciando para MÊS: ${targetUrl}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Stealth Headers
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
    });

    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 90000 }); // Maior timeout para mês

    // Incremental Scroll (Mês é longo, precisa de mais scroll)
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 50); // Scroll um pouco mais rápido mas ainda suave
      });
    });

    await new Promise((r) => setTimeout(r, 2000));
    await page.waitForSelector(".calendar__table", { timeout: 30000 });

    const rawEvents = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr.calendar__row"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = [];
      let currentDateText = "";
      let currentTime = ""; // Propagar horário para eventos consecutivos

      rows.forEach((row) => {
        if (row.classList.contains("calendar__row--day-breaker")) return;

        const dateText =
          row.querySelector(".calendar__date .date")?.textContent?.trim() ||
          row.querySelector(".calendar__date")?.textContent?.trim() ||
          "";

        if (dateText) currentDateText = dateText;

        // Propagar horário quando vazio
        const timeText = row.querySelector(".calendar__time")?.textContent?.trim() || "";
        if (timeText) currentTime = timeText;

        const currency = row.querySelector(".calendar__currency")?.textContent?.trim() || "";

        const impactSpan = row.querySelector(".calendar__impact span");
        const impactTitle = impactSpan?.getAttribute("title") || "";
        const impactClass = impactSpan?.className || "";

        let impact = "none";
        if (impactTitle.includes("High") || impactClass.includes("icon--ff-impact-red"))
          impact = "high";
        else if (impactTitle.includes("Medium") || impactClass.includes("icon--ff-impact-ora"))
          impact = "medium";
        else if (impactTitle.includes("Low") || impactClass.includes("icon--ff-impact-yel"))
          impact = "low";

        const eventName = row.querySelector(".calendar__event-title")?.textContent?.trim() || "";
        const actual = row.querySelector(".calendar__actual")?.textContent?.trim() || null;
        const forecast = row.querySelector(".calendar__forecast")?.textContent?.trim() || null;
        const previous = row.querySelector(".calendar__previous")?.textContent?.trim() || null;

        if (currency && eventName) {
          results.push({
            dateText: currentDateText,
            time: currentTime, // Usa horário propagado
            currency,
            impact,
            event_name: eventName,
            actual,
            forecast,
            previous,
          });
        }
      });
      return results;
    });

    console.log(`[Scraper History] ${rawEvents.length} linhas extraídas.`);
    const events: ScrapedEvent[] = [];

    // Ano alvo para o parse da data (evita bug de virada de ano)
    const targetYear = targetDate.getFullYear();

    for (const raw of rawEvents) {
      if (!raw.dateText) continue;

      // Usar função de parse adaptada para receber o ano correto
      const isoDate = parseForexFactoryDateWithYear(raw.dateText, targetYear);
      if (!isoDate) continue; // Só pular se não conseguir parsear a data

      const time24 = convertTo24Hour(raw.time) || "All Day";

      events.push({
        date: isoDate,
        time: time24,
        currency: raw.currency,
        impact: raw.impact as "high" | "medium" | "low" | "none",
        event_name: raw.event_name,
        actual: raw.actual,
        forecast: raw.forecast,
        previous: raw.previous,
      });
    }

    return events;
  } catch (error) {
    console.error("[Scraper History] Erro:", error);
    if (browser) await browser.close();
    return []; // Retorna array vazio em vez de erro para não travar o loop de meses
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Parser auxiliar que aceita o ano forçado (para histórico)
 */
function parseForexFactoryDateWithYear(dateStr: string, year: number): string {
  try {
    const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d+)/i);
    if (!match) return "";

    const monthStr = match[1];
    const dayStr = match[2];

    const parsedDate = parse(`${monthStr} ${dayStr} ${year}`, "MMM d yyyy", new Date());
    return format(parsedDate, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/**
 * Converter "1:30pm" -> "13:30"
 * "Tentative" -> "Tentative"
 * "All Day" -> "All Day"
 */
function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return "";

  // Limpar espaços ou quebras de linha
  const cleanTime = timeStr.trim();

  // Casos especiais
  if (cleanTime.toLowerCase().includes("day") || cleanTime.toLowerCase().includes("tentative")) {
    return cleanTime;
  }

  try {
    // timeStr ex: "1:30pm" ou "10:00am"
    const match = cleanTime.match(/(\d{1,2}):(\d{2})([ap]m)/i);
    if (!match) return cleanTime;

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toLowerCase();

    if (ampm === "pm" && hours < 12) {
      hours += 12;
    }
    if (ampm === "am" && hours === 12) {
      hours = 0;
    }

    const hoursStr = hours.toString().padStart(2, "0");
    return `${hoursStr}:${minutes}`;
  } catch {
    return cleanTime;
  }
}

/**
 * Converter data do formato FF ("SunDec 14") para ISO ("2025-12-14")
 */
function parseForexFactoryDate(dateStr: string): string {
  try {
    // dateStr ex: "SunDec 14" ou "Dec 14"
    // Regex melhorada: Busca explicitamente pelo Mês (Jan|Feb...) ignorando o dia da semana (Sun|Mon...) antes
    const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d+)/i);

    if (!match) return "";

    const monthStr = match[1]; // "Dec"
    const dayStr = match[2]; // "14"

    const currentYear = new Date().getFullYear();

    // Tentar criar data com ano atual
    // MMM d yyyy -> Dec 14 2024
    const parsedDate = parse(`${monthStr} ${dayStr} ${currentYear}`, "MMM d yyyy", new Date());

    // Se a data parseada for muito antiga (ex: scrapper rodando em Jan pegando Dezembro), ajustar ano?
    // Por enquanto assume ano corrente. O Forex Factory geralmente mostra o ano na URL mas não na célula.

    return format(parsedDate, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/**
 * Compara dois arrays de eventos scraped para verificar consistência (Double-Check)
 * @param scrape1 Primeiro resultado do scrape
 * @param scrape2 Segundo resultado do scrape
 * @returns { match: boolean, diff: string[] } - match true se iguais, diff com lista de diferenças
 */
export function compareScrapedEvents(
  scrape1: ScrapedEvent[],
  scrape2: ScrapedEvent[]
): { match: boolean; diff: string[]; stats: { scrape1Count: number; scrape2Count: number } } {
  const diff: string[] = [];

  // Criar chave única para cada evento
  const createKey = (e: ScrapedEvent) => `${e.date}|${e.time}|${e.currency}|${e.event_name}`;

  const set1 = new Set(scrape1.map(createKey));
  const set2 = new Set(scrape2.map(createKey));

  // Eventos no scrape1 mas não no scrape2
  for (const key of set1) {
    if (!set2.has(key)) {
      diff.push(`[Apenas Scrape1] ${key}`);
    }
  }

  // Eventos no scrape2 mas não no scrape1
  for (const key of set2) {
    if (!set1.has(key)) {
      diff.push(`[Apenas Scrape2] ${key}`);
    }
  }

  const match = diff.length === 0 && scrape1.length === scrape2.length;

  return {
    match,
    diff,
    stats: {
      scrape1Count: scrape1.length,
      scrape2Count: scrape2.length,
    },
  };
}
