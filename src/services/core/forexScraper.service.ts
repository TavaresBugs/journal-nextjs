import { chromium } from "playwright";
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
 * Buscar eventos usando Playwright (Headless Chromium) para evitar bloqueios 403
 */
export async function scrapeForexFactory(): Promise<ScrapedEvent[]> {
  let browser = null;
  try {
    // Calcular a data de início da semana (Domingo) para usar no parâmetro ?week=
    const today = new Date();
    const startOfWeekDate = new Date(today);
    startOfWeekDate.setDate(today.getDate() - today.getDay());

    // Formato: MMMd.yyyy (ex: Dec14.2025)
    const weekParam = format(startOfWeekDate, "MMMd.yyyy");
    const targetUrl = `${FOREX_FACTORY_URL}?week=${weekParam}`;

    console.log(`[Scraper] Iniciando Playwright (Modo Stealth + Week) para ${targetUrl}...`);

    // Launch browser
    browser = await chromium.launch({ headless: true });

    // Create context with viewport and user agent
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
    });

    const page = await context.newPage();

    console.log("[Scraper] Navegando para a página...");

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60000 });

    // Incremental Scroll para garantir que o Lazy Loading carregue as linhas
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
    await page.waitForTimeout(1000);

    // Esperar seletor da tabela
    await page.locator(".calendar__table").waitFor({ timeout: 30000 });

    console.log("[Scraper] Página carregada. Extraindo dados...");

    // Executar script no contexto da página para extrair dados
    const rawEvents = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr.calendar__row"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = [];

      let currentDateText = "";
      let currentTime = "";

      rows.forEach((row) => {
        if (row.classList.contains("calendar__row--day-breaker")) return;

        const dateText =
          row.querySelector(".calendar__date .date")?.textContent?.trim() ||
          row.querySelector(".calendar__date")?.textContent?.trim() ||
          "";

        if (dateText) {
          currentDateText = dateText;
        }

        const timeText = row.querySelector(".calendar__time")?.textContent?.trim() || "";
        if (timeText) {
          currentTime = timeText;
        }

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
            time: currentTime,
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

    const events: ScrapedEvent[] = [];

    for (const raw of rawEvents) {
      if (!raw.dateText) continue;

      const isoDate = parseForexFactoryDate(raw.dateText);
      if (!isoDate) continue;

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

    console.log(`[Scraper] Sucesso! ${events.length} eventos processados e prontos.`);
    return events;
  } catch (error) {
    console.error("[Scraper] Erro crítico no Playwright:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
    throw error;
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

    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
    });

    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 180000 });

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
        }, 50);
      });
    });

    await page.waitForTimeout(2000);
    await page.locator(".calendar__table").waitFor({ timeout: 30000 });

    const rawEvents = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("tr.calendar__row"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = [];
      let currentDateText = "";
      let currentTime = "";

      rows.forEach((row) => {
        if (row.classList.contains("calendar__row--day-breaker")) return;

        const dateText =
          row.querySelector(".calendar__date .date")?.textContent?.trim() ||
          row.querySelector(".calendar__date")?.textContent?.trim() ||
          "";

        if (dateText) currentDateText = dateText;

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
            time: currentTime,
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

    const targetYear = targetDate.getFullYear();

    for (const raw of rawEvents) {
      if (!raw.dateText) continue;

      const isoDate = parseForexFactoryDateWithYear(raw.dateText, targetYear);
      if (!isoDate) continue;

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
    return [];
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

  const cleanTime = timeStr.trim();

  if (cleanTime.toLowerCase().includes("day") || cleanTime.toLowerCase().includes("tentative")) {
    return cleanTime;
  }

  try {
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
 * Handles year rollover: if current month is Dec and event month is Jan, use next year
 */
function parseForexFactoryDate(dateStr: string): string {
  try {
    const match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d+)/i);

    if (!match) return "";

    const monthStr = match[1];
    const dayStr = match[2];

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (0 = Jan, 11 = Dec)
    let targetYear = now.getFullYear();

    // Map month string to number (0-11)
    const monthMap: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const eventMonth = monthMap[monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase()];

    // Year rollover logic:
    // If we're in Dec (11) and event is in Jan (0), use next year
    // If we're in Jan (0) and event is in Dec (11), use previous year (historical scrape)
    if (currentMonth === 11 && eventMonth === 0) {
      targetYear = now.getFullYear() + 1;
    } else if (currentMonth === 0 && eventMonth === 11) {
      targetYear = now.getFullYear() - 1;
    }

    const parsedDate = parse(`${monthStr} ${dayStr} ${targetYear}`, "MMM d yyyy", new Date());

    return format(parsedDate, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/**
 * Compara dois arrays de eventos scraped para verificar consistência (Double-Check)
 */
export function compareScrapedEvents(
  scrape1: ScrapedEvent[],
  scrape2: ScrapedEvent[]
): { match: boolean; diff: string[]; stats: { scrape1Count: number; scrape2Count: number } } {
  const diff: string[] = [];

  const createKey = (e: ScrapedEvent) => `${e.date}|${e.time}|${e.currency}|${e.event_name}`;

  const set1 = new Set(scrape1.map(createKey));
  const set2 = new Set(scrape2.map(createKey));

  for (const key of set1) {
    if (!set2.has(key)) {
      diff.push(`[Apenas Scrape1] ${key}`);
    }
  }

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
