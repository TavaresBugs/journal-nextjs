/**
 * Tradovate CSV Parser
 *
 * Parses Performance CSV exports from Tradovate platform.
 * Format: symbol, qty, buyPrice, sellPrice, pnl, boughtTimestamp, soldTimestamp, duration
 */

import { parse, isValid } from "date-fns";

export interface TradovateRawTrade {
  symbol: string;
  qty: string;
  buyPrice: string;
  sellPrice: string;
  pnl: string;
  boughtTimestamp: string;
  soldTimestamp: string;
  duration: string;
  buyFillId?: string;
  sellFillId?: string;
}

export interface TradovateImportResult {
  data: TradovateRawTrade[];
  totalPnL?: number;
}

/**
 * Parses Tradovate money format: "$255.00" or "$(115.00)" -> number
 */
export const parseTradovateMoney = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;

  let str = value.trim();

  // Check for negative format: $(value)
  const isNegative = str.includes("(") && str.includes(")");

  // Remove $ and parentheses
  str = str.replace(/[$()]/g, "").trim();

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  return isNegative ? -Math.abs(num) : num;
};

/**
 * Parses Tradovate price format: "25501.00" -> number
 */
export const parseTradovatePrice = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;

  const num = parseFloat(value.trim());
  return isNaN(num) ? 0 : num;
};

/**
 * Parses Tradovate date format: "MM/dd/yyyy HH:mm:ss" -> Date
 * Example: "11/30/2025 20:15:41"
 */
export const parseTradovateDate = (dateStr: string | number): Date | null => {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return null;

  const str = String(dateStr).trim();
  if (!str) return null;

  try {
    const referenceDate = new Date();
    referenceDate.setSeconds(0, 0);

    // Try MM/dd/yyyy HH:mm:ss format (24-hour)
    let date = parse(str, "MM/dd/yyyy HH:mm:ss", referenceDate);
    if (isValid(date)) return date;

    // Try MM/dd/yyyy H:mm:ss format (single digit hour)
    date = parse(str, "MM/dd/yyyy H:mm:ss", referenceDate);
    if (isValid(date)) return date;

    // Try with AM/PM
    date = parse(str, "MM/dd/yyyy h:mm:ss a", referenceDate);
    if (isValid(date)) return date;

    // Fallback to Date constructor
    date = new Date(str);
    if (isValid(date)) return date;

    return null;
  } catch (e) {
    console.warn("Tradovate date parse error:", e);
    return null;
  }
};

/**
 * Determines trade direction based on buy/sell prices and timestamps.
 * In Tradovate, if boughtTimestamp < soldTimestamp, it's a Long trade.
 * If boughtTimestamp > soldTimestamp, it's a Short trade (sold first, bought to cover).
 */
export const determineTradovateDirection = (
  boughtTimestamp: string,
  soldTimestamp: string
): "Long" | "Short" => {
  const buyDate = parseTradovateDate(boughtTimestamp);
  const sellDate = parseTradovateDate(soldTimestamp);

  if (!buyDate || !sellDate) {
    // Fallback: assume Long if we can't determine
    return "Long";
  }

  // If bought before sold, it's a Long (buy low, sell high)
  // If sold before bought, it's a Short (sell high, buy to cover)
  return buyDate < sellDate ? "Long" : "Short";
};

/**
 * Cleans Tradovate symbol format.
 * Example: "NQZ5" -> "NQ" (removes contract month code)
 * Tradovate uses month codes: F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun, N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec
 * Pattern: BaseSymbol + MonthCode + Year (e.g., NQZ5 = NQ + Z + 5)
 */
export const cleanTradovateSymbol = (symbol: string): string => {
  if (!symbol) return "";

  let cleaned = symbol.trim();

  // Only clean if it matches the pattern: 2+ letters + single month code + 1-2 digit year
  // This prevents removing Q from MNQ when it's part of the symbol name
  // Valid patterns: NQZ5, ESH25, MNQ Z5 (with space), but NOT MNQ25 (no month code)
  const contractPattern = /^([A-Z]{2,})([FGHJKMNQUVXZ])(\d{1,2})$/i;
  const match = cleaned.match(contractPattern);

  if (match) {
    // Only remove if we have a clear base symbol (not ending in a month code letter)
    cleaned = match[1];
  }

  return cleaned || symbol.trim();
};

/**
 * Parses Tradovate CSV content string using PapaParse.
 */
export const parseTradovateContent = (content: string): TradovateImportResult => {
  if (!content) throw new Error("File is empty");

  // Import PapaParse synchronously for content parsing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Papa = require("papaparse") as typeof import("papaparse");

  // Parse CSV with PapaParse (auto-detects delimiter, handles quotes)
  const result = Papa.parse(content, {
    skipEmptyLines: true,
    dynamicTyping: false,
    header: true, // Use first row as headers
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    console.warn("Tradovate CSV parse warnings:", result.errors);
  }

  if (!result.data || result.data.length === 0) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  // Validate required columns
  const requiredColumns = ["symbol", "pnl", "boughttimestamp", "soldtimestamp"];
  const availableHeaders = result.meta.fields || [];
  const missingColumns = requiredColumns.filter(
    (col) => !availableHeaders.some((h: string) => h === col)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  // Parse data rows
  const data: TradovateRawTrade[] = [];
  let totalPnL = 0;

  for (const row of result.data as Record<string, string>[]) {
    const trade: TradovateRawTrade = {
      symbol: row["symbol"] || "",
      qty: row["qty"] || "1",
      buyPrice: row["buyprice"] || "",
      sellPrice: row["sellprice"] || "",
      pnl: row["pnl"] || "",
      boughtTimestamp: row["boughttimestamp"] || "",
      soldTimestamp: row["soldtimestamp"] || "",
      duration: row["duration"] || "",
      buyFillId: row["buyfillid"] || undefined,
      sellFillId: row["sellfillid"] || undefined,
    };

    // Only add if we have valid essential data
    if (trade.symbol && (trade.boughtTimestamp || trade.soldTimestamp)) {
      data.push(trade);
      totalPnL += parseTradovateMoney(trade.pnl);
    }
  }

  return { data, totalPnL };
};

/**
 * Parses Tradovate CSV file.
 */
export const parseTradovateCSV = async (file: File): Promise<TradovateImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File is empty");

        // Decode content
        const uint8Array = new Uint8Array(buffer);
        let content = "";

        if (uint8Array.length > 2 && uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
          const decoder = new TextDecoder("utf-16le");
          content = decoder.decode(buffer);
        } else {
          const decoder = new TextDecoder("utf-8");
          content = decoder.decode(buffer);
        }

        const result = parseTradovateContent(content);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Gets the auto-mapping for Tradovate columns to standard trade format.
 */
export const getTradovateAutoMapping = () => ({
  entryDate: "boughtTimestamp",
  symbol: "symbol",
  direction: "", // Computed from timestamps
  volume: "qty",
  entryPrice: "buyPrice",
  exitDate: "soldTimestamp",
  exitPrice: "sellPrice",
  profit: "pnl",
  commission: "", // Not in Tradovate export
  swap: "",
  sl: "",
  tp: "",
});

/**
 * Parses Tradovate PDF file using pdfjs-dist.
 * The PDF has trades starting from page 4 in a table format.
 */
export const parseTradovatePDF = async (file: File): Promise<TradovateImportResult> => {
  // Dynamic import of pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Use local worker from public folder (copied from node_modules/pdfjs-dist/build/)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File is empty");

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const numPages = pdf.numPages;

        // Extract text from all pages (starting from page 4 where trades are)
        let allText = "";
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: unknown) => {
              if (typeof item === "object" && item !== null && "str" in item) {
                return (item as { str: string }).str;
              }
              return "";
            })
            .join(" ");
          allText += pageText + "\n";
        }

        // Parse trades from extracted text
        const trades = parseTradovatePDFText(allText);

        if (trades.length === 0) {
          throw new Error(
            "Nenhum trade encontrado no PDF. Verifique se o arquivo é um relatório de Performance do Tradovate."
          );
        }

        // Calculate total P&L
        const totalPnL = trades.reduce((sum, t) => sum + parseTradovateMoney(t.pnl), 0);

        resolve({ data: trades, totalPnL });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse trades from PDF text content.
 * The PDF has a TRADES table with columns: Symbol, Qty, Buy Price, Buy Time, Duration, Sell Time, Sell Price, P&L
 *
 * PDF.js extracts text without preserving line structure, so we use global regex matching
 * to find all trade patterns in the text.
 */
const parseTradovatePDFText = (text: string): TradovateRawTrade[] => {
  const trades: TradovateRawTrade[] = [];

  // Check if this contains the TRADES section
  if (!text.includes("TRADES") && !text.includes("Symbol") && !text.includes("Buy Price")) {
    return trades;
  }

  // Extract only the portion after "TRADES" header if present
  let tradeSection = text;
  const tradesIndex = text.indexOf("TRADES");
  if (tradesIndex !== -1) {
    tradeSection = text.substring(tradesIndex);
  }

  // Regex to match a trade entry globally
  // Pattern: Symbol(2-6 letters + optional digits) Qty(number) BuyPrice(decimal) BuyDate(MM/DD/YYYY) BuyTime(HH:MM:SS)
  //          Duration(SKIP - may span multiple lines) SellDate SellTime SellPrice P&L
  // The key insight: prices are decimal numbers like 25501.00, dates are MM/DD/YYYY format

  // Use non-greedy .*? to skip Duration (which can be multi-line in PDF)
  // This matches anything between Buy Time and the next date
  const tradePattern =
    /([A-Z]{2,6}\d{0,2})\s+(\d+)\s+([\d.]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s+.*?(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s+([\d.]+)\s+(\$[\d,.]+|\$\([\d,.]+\))/gi;

  let match;
  while ((match = tradePattern.exec(tradeSection)) !== null) {
    // Groups: 1-symbol, 2-qty, 3-buyPrice, 4-buyDate, 5-buyTime, 6-sellDate, 7-sellTime, 8-sellPrice, 9-pnl
    const [, symbol, qty, buyPrice, buyDate, buyTime, sellDate, sellTime, sellPrice, pnl] = match;

    trades.push({
      symbol: symbol,
      qty: qty,
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      pnl: pnl,
      boughtTimestamp: `${buyDate} ${buyTime}`,
      soldTimestamp: `${sellDate} ${sellTime}`,
      duration: "", // Duration skipped due to multi-line extraction issues
    });
  }

  // If no trades found with the strict pattern, try a more flexible approach
  if (trades.length === 0) {
    // Alternative: Look for NQZ5/ESZ5 pattern followed by numbers
    const flexPattern =
      /([A-Z]{2,4}[A-Z]\d{1,2})\s+(\d+)\s+([\d,.]+)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}).*?(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})\s+([\d,.]+)\s+(\$?[\d,()-]+\.?\d*)/gi;

    while ((match = flexPattern.exec(tradeSection)) !== null) {
      const [, symbol, qty, buyPrice, buyDateTime, sellDateTime, sellPrice, pnl] = match;

      trades.push({
        symbol: symbol,
        qty: qty,
        buyPrice: buyPrice.replace(/,/g, ""),
        sellPrice: sellPrice.replace(/,/g, ""),
        pnl: pnl,
        boughtTimestamp: buyDateTime,
        soldTimestamp: sellDateTime,
        duration: "",
      });
    }
  }

  return trades;
};
