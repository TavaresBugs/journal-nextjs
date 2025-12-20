import ExcelJS from "exceljs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface RawTradeData {
  [key: string]: string | number;
}

export interface ParsedTrade {
  entryDate: Date;
  entryTime?: string;
  symbol: string;
  type: "Long" | "Short";
  volume: number;
  entryPrice: number;
  exitDate?: Date;
  exitTime?: string;
  exitPrice?: number;
  profit?: number;
  commission?: number;
  swap?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ImportResult {
  data: RawTradeData[];
  totalNetProfit?: number;
}

/**
 * Reads and parses the trading file (XLSX/CSV).
 * Handles metadata skipping, section detection, and duplicate column mapping.
 */
export const parseTradingFile = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File is empty");

        let rows: unknown[][] = [];

        // Detect if file is CSV based on extension or content
        const isCSV = file.name.endsWith(".csv") || file.type === "text/csv";

        if (isCSV) {
          // Parse CSV manually
          const textDecoder = new TextDecoder("utf-8");
          const text = textDecoder.decode(data as ArrayBuffer);
          const lines = text.split(/\r?\n/);
          rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
        } else {
          // Check for Magic Bytes to detect actual file type
          const buffer = data as ArrayBuffer;
          const uint8Array = new Uint8Array(buffer);

          // Check for ZIP signature (PK..) -> valid XLSX
          const isZip =
            uint8Array[0] === 0x50 &&
            uint8Array[1] === 0x4b &&
            uint8Array[2] === 0x03 &&
            uint8Array[3] === 0x04;

          if (!isZip) {
            // Not a zip file, so it cannot be a valid XLSX (which is a zipped XML format)
            // Check if it looks like HTML or XML
            const decoder = new TextDecoder("utf-8");
            // Decode first 512 bytes for inspection
            const headerStr = decoder.decode(uint8Array.slice(0, 512)).trim();

            if (
              headerStr.startsWith("<") ||
              headerStr.includes("<html") ||
              headerStr.includes("<!DOCTYPE html")
            ) {
              console.log("Detected HTML/XML content in .xlsx file, switching to HTML parser");
              // It's likely an HTML file named as .xlsx
              return parseHTMLReport(file);
            }

            // If uncertain, we could throw, or try the HTML parser as fallback if it has text content
            // For now, let's throw a helpful error
            throw new Error(
              "O arquivo não parece ser um Excel válido (.xlsx). Se for um relatório HTML renomeado, tente salvar como .html ou abrir e salvar novamente no Excel."
            );
          }

          // Parse XLSX with exceljs
          const workbook = new ExcelJS.Workbook();
          try {
            await workbook.xlsx.load(buffer);
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg.includes("disallowed character")) {
              throw new Error(
                "Para sua segurança e dos seus dados, abra o arquivo Excel e salve-o com o mesmo nome novamente. Isso removerá caracteres inválidos e permitirá a importação correta."
              );
            }
            throw err;
          }

          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) throw new Error("No worksheet found");

          worksheet.eachRow((row, rowNumber) => {
            const rowValues = row.values as unknown[];
            // ExcelJS row.values is 1-indexed, so we slice from index 1
            rows[rowNumber - 1] = rowValues.slice(1);
          });
        }

        // 1. Find "Positions" section
        let positionsRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          // Check if row contains "Positions" (usually first cell)
          if (row && row[0] && String(row[0]).trim() === "Positions") {
            positionsRowIndex = i;
            break;
          }
        }

        if (positionsRowIndex === -1) {
          throw new Error('Section "Positions" not found in the file.');
        }

        // The header row is usually the next row after "Positions"
        const headerRowIndex = positionsRowIndex + 1;
        if (headerRowIndex >= rows.length) {
          throw new Error('Header row not found after "Positions" section.');
        }

        const originalHeaders = rows[headerRowIndex] as string[];

        // 2. Map Duplicate Columns
        // Expected headers: Time, Position, Symbol, Type, Volume, Price, S / L, T / P, Time, Price, Commission, Swap, Profit
        // Indices:           0      1        2       3      4       5      6      7     8      9        10        11     12

        const uniqueHeaders: string[] = [];
        const headerCounts: { [key: string]: number } = {};

        originalHeaders.forEach((header, index) => {
          const trimmedHeader = String(header).trim();

          // Specific logic for known duplicates based on position if they match standard MetaTrader export
          // However, to be robust, we can rename specific indices if they match expectations,
          // or just use a generic counter if the user didn't strictly specify relying on indices
          // (though the prompt explicitly mentions indices 0, 5, 8, 9).

          // Let's try to be smart about indices first as per requirements
          let newHeader = trimmedHeader;

          if (trimmedHeader === "Time") {
            if (index === 0) newHeader = "Entry Time";
            else if (index === 8) newHeader = "Exit Time";
            else {
              // Fallback if structure is slightly different
              headerCounts["Time"] = (headerCounts["Time"] || 0) + 1;
              newHeader = `Time_${headerCounts["Time"]}`;
            }
          } else if (trimmedHeader === "Price") {
            if (index === 5) newHeader = "Entry Price";
            else if (index === 9) newHeader = "Exit Price";
            else {
              headerCounts["Price"] = (headerCounts["Price"] || 0) + 1;
              newHeader = `Price_${headerCounts["Price"]}`;
            }
          }

          uniqueHeaders.push(newHeader);
        });

        // 3. Extract Data
        // Data starts after the header row.
        // We iterate until we hit an empty row or the end, or a new section (like "Orders")
        const rawData: RawTradeData[] = [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];

          // Stop if row is empty or seems like a footer/total
          if (!row || row.length === 0) continue;

          // Check if it's the start of another section
          if (row[0] && String(row[0]).trim() === "Orders") break;
          if (row[0] && String(row[0]).trim() === "Deals") break;

          // Check if it's a new section header (e.g. "Orders") or just empty first cell
          // Sometimes total rows have empty first cell.
          // MetaTrader total row usually has "Total" in one of the columns or is separated by empty line.
          // But strict check: if the first column is empty, it might be a spacer.
          // If the row doesn't have enough columns, skip.
          if (row.length < 3) continue; // heuristic

          const rowData: RawTradeData = {};
          uniqueHeaders.forEach((header, index) => {
            if (index < row.length) {
              rowData[header] = row[index] as string | number;
            }
          });
          rawData.push(rowData);
        }

        // 4. Extract Total Net Profit (if available in XLSX)
        let totalNetProfit: number | undefined;
        // Search for "Total Net Profit" in the rows
        for (let i = rows.length - 1; i >= 0; i--) {
          const row = rows[i];
          if (!row) continue;
          // Common MT4/MT5 format: Cell A = "Total Net Profit:", Cell B = Value
          // Or just check all cells in row
          const rowStr = row.join(" ").toLowerCase();
          if (rowStr.includes("total net profit")) {
            // Try to find the number in this row
            for (const cell of row) {
              if (typeof cell === "number") {
                totalNetProfit = cell;
                break;
              } else if (typeof cell === "string") {
                // Clean string and try parse
                const val = parseFloat(cell.replace(/[^0-9.-]/g, ""));
                if (!isNaN(val) && cell.match(/[0-9]/)) {
                  // Basic heuristic: it should be the value next to label usually
                  // But let's verify if the cell is NOT the label itself
                  if (!cell.toLowerCase().includes("total")) {
                    totalNetProfit = val;
                    break;
                  }
                }
              }
            }
          }
          if (totalNetProfit !== undefined) break;
        }

        resolve({ data: rawData, totalNetProfit });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseHTMLReport = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File is empty");

        // Decode using TextDecoder which handles BOM automatically for UTF-8 and UTF-16
        // If it fails or produces garbage, we might need to try specific encodings.
        // But usually, standard TextDecoder("utf-8") works for UTF-8.
        // For UTF-16le (common in Windows reports), we need to detect it.

        let content = "";
        const uint8Array = new Uint8Array(buffer);

        // Simple BOM detection
        if (uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
          const decoder = new TextDecoder("utf-16le");
          content = decoder.decode(buffer);
        } else if (uint8Array[0] === 0xfe && uint8Array[1] === 0xff) {
          const decoder = new TextDecoder("utf-16be");
          content = decoder.decode(buffer);
        } else {
          // Try utf-8 first
          try {
            const decoder = new TextDecoder("utf-8", { fatal: true });
            content = decoder.decode(buffer);
          } catch {
            // If fatal error, try windows-1252 (ANSI)
            const decoder = new TextDecoder("windows-1252");
            content = decoder.decode(buffer);
          }
        }

        // Basic Regex to find rows in the table
        // MetaTrader reports usually have rows with <tr ...> <td ...> ... </td> </tr>
        // We look for rows that contain trade data.

        const rows: RawTradeData[] = [];

        // Regex to find all tr elements
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;

        let inPositionsSection = false;

        while ((match = trRegex.exec(content)) !== null) {
          const rowContent = match[1];

          // Check for section headers
          if (rowContent.includes("<b>Positions</b>")) {
            inPositionsSection = true;
            continue;
          }
          if (rowContent.includes("<b>Orders</b>") || rowContent.includes("<b>Deals</b>")) {
            inPositionsSection = false;
            // Assuming Positions comes first, we can break here to be faster
            // But if order varies, we just disable the flag
            continue;
          }

          if (!inPositionsSection) continue;

          // Extract cells
          const tdRegex = /<td[^>]*>(.*?)<\/td>/gi;
          const cells: string[] = [];
          let cellMatch;

          while ((cellMatch = tdRegex.exec(rowContent)) !== null) {
            // Remove HTML tags from cell content and trim
            const cellText = cellMatch[1].replace(/<[^>]*>/g, "").trim();
            cells.push(cellText);
          }

          // Strict check for data row: should look like a date
          if (cells.length > 0 && /^\d{4}\.\d{2}\.\d{2}/.test(cells[0])) {
            // MetaTrader HTML column structure varies:
            // 13 cols: Time, Ticket, Symbol, Type, Volume, Price, S/L, T/P, Time, Price, Comm, Swap, Profit
            // 14 cols: Sometimes has extra column (Taxes or hidden)
            // 15 cols: MT5 may have additional columns

            // Standard 13-column layout (MT4)
            const entryTimeIndex = 0;
            const ticketIndex = 1;
            const symbolIndex = 2;
            const typeIndex = 3;
            let volumeIndex = 4;
            let entryPriceIndex = 5;
            let slIndex = 6;
            let tpIndex = 7;
            let exitTimeIndex = 8;
            let exitPriceIndex = 9;
            let commissionIndex = 10;
            let swapIndex = 11;
            // Profit is always last

            // Adjust indices based on actual column count
            if (cells.length === 14) {
              // 14 columns: extra column usually at position 4 (after Type)
              // New layout: Time, Ticket, Symbol, Type, [Extra], Volume, Price, S/L, T/P, Time, Price, Comm, Swap, Profit
              volumeIndex = 5;
              entryPriceIndex = 6;
              slIndex = 7;
              tpIndex = 8;
              exitTimeIndex = 9;
              exitPriceIndex = 10;
              commissionIndex = 11;
              swapIndex = 12;
            } else if (cells.length >= 15) {
              // 15+ columns: check if extra column is before Volume
              // Alternative: extra column after TP
              volumeIndex = 4;
              entryPriceIndex = 5;
              slIndex = 6;
              tpIndex = 7;
              exitTimeIndex = 8;
              exitPriceIndex = 9;
              commissionIndex = cells.length - 3;
              swapIndex = cells.length - 2;
            }

            const type = cells[typeIndex].toLowerCase();
            if (type !== "buy" && type !== "sell") continue;

            const tradeData: RawTradeData = {
              "Entry Time": cells[entryTimeIndex],
              Ticket: cells[ticketIndex],
              Symbol: cells[symbolIndex],
              Type: cells[typeIndex],
              Volume: cells[volumeIndex],
              "Entry Price": cells[entryPriceIndex],
              "S/L": cells[slIndex],
              "T/P": cells[tpIndex],
              "Exit Time": cells[exitTimeIndex],
              "Exit Price": cells[exitPriceIndex],
              Commission: cells[commissionIndex],
              Swap: cells[swapIndex],
              Profit: cells[cells.length - 1], // Always take the last cell as profit
            };
            rows.push(tradeData);
          }
        }

        // Extract Total Net Profit from HTML Summary
        let totalNetProfit: number | undefined;
        // Look for: <td ...>Total Net Profit:</td><td ...><b>-22.03</b></td>
        const totalRegex = /Total Net Profit:[\s\S]*?<b[^>]*>([\s\S]*?)<\/b>/i;
        const totalMatch = totalRegex.exec(content);
        if (totalMatch && totalMatch[1]) {
          const cleanVal = totalMatch[1].replace(/[^0-9.-]/g, "");
          const val = parseFloat(cleanVal);
          if (!isNaN(val)) totalNetProfit = val;
        }

        resolve({ data: rows, totalNetProfit });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file); // Read as binary to handle encoding manually
  });
};

/**
 * Wrapper to detect file type and call appropriate parser.
 */
export const processImportFile = async (file: File): Promise<ImportResult> => {
  if (file.type === "text/html" || file.name.endsWith(".html") || file.name.endsWith(".htm")) {
    return parseHTMLReport(file);
  }
  return parseTradingFile(file);
};

/**
 * Parses a custom date format "yyyy.MM.dd HH:mm:ss" or standard Excel date.
 */
export const parseTradeDate = (dateStr: string | number): Date | null => {
  if (!dateStr) return null;

  // If it's a number (Excel serial date)
  if (typeof dateStr === "number") {
    // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
    // 25569 = days between 1900-01-01 and 1970-01-01
    const utcDays = dateStr - 25569;
    const utcMs = utcDays * 86400 * 1000;
    return new Date(utcMs);
  }

  if (typeof dateStr === "string") {
    try {
      let normalized = dateStr.trim();
      // Normalize separators: 2025.12.05 -> 2025-12-05, 2025/12/05 -> 2025-12-05
      normalized = normalized.replace(/\./g, "-").replace(/\//g, "-");

      // 1. Try ISO-like "YYYY-MM-DD HH:mm:ss"
      let parsed = dayjs(normalized, "YYYY-MM-DD HH:mm:ss", true);
      if (parsed.isValid()) return parsed.toDate();

      // 2. Try "YYYY-MM-DD HH:mm"
      parsed = dayjs(normalized, "YYYY-MM-DD HH:mm", true);
      if (parsed.isValid()) return parsed.toDate();

      // 3. Try "DD-MM-YYYY HH:mm:ss" (Brazilian/European format)
      parsed = dayjs(normalized, "DD-MM-YYYY HH:mm:ss", true);
      if (parsed.isValid()) return parsed.toDate();

      // 4. Try "DD-MM-YYYY HH:mm"
      parsed = dayjs(normalized, "DD-MM-YYYY HH:mm", true);
      if (parsed.isValid()) return parsed.toDate();

      // 5. Try standard Date constructor as fallback
      const fallback = new Date(normalized);
      if (!isNaN(fallback.getTime())) return fallback;
    } catch (e) {
      console.warn("Date parse error:", e);
    }
  }
  return null;
};

/**
 * Normalizes trade type to 'Long' or 'Short'
 * Supports: MetaTrader (buy/sell), NinjaTrader (Comprada/Venda)
 */
export const normalizeTradeType = (type: string): "Long" | "Short" | null => {
  const lower = type.toLowerCase().trim();
  // MetaTrader
  if (lower.includes("buy")) return "Long";
  if (lower.includes("sell")) return "Short";
  // NinjaTrader (Portuguese)
  if (lower.includes("comprada") || lower === "long") return "Long";
  if (lower.includes("venda") || lower === "short") return "Short";
  return null;
};

/**
 * Cleans up symbol names
 * - MetaTrader: "EURUSD.cash" -> "EURUSD"
 * - NinjaTrader: "MNQ 12-25" -> "MNQ" (removes contract month-year)
 */
export const cleanSymbol = (symbol: string): string => {
  if (!symbol) return "";

  let cleaned = symbol.trim();

  // Remove suffix after dot (e.g., EURUSD.cash -> EURUSD)
  cleaned = cleaned.split(".")[0];

  // Remove NinjaTrader contract date (e.g., "MNQ 12-25" -> "MNQ")
  // Pattern: space followed by MM-YY or MMMYY (e.g. "DEC25")
  cleaned = cleaned.replace(/\s+(\d{1,2}-\d{2,4}|[A-Z]{3}\d{2})$/i, "");

  // Also handle "ES 03-25" format
  cleaned = cleaned.trim();

  return cleaned;
};

// ============================================
// NINJATRADER CSV PARSING FUNCTIONS
// ============================================

/**
 * NinjaTrader column mapping interface
 */
export interface NinjaTraderColumnMapping {
  tradeNumber: string; // Núm. Neg.
  symbol: string; // Ativo
  account: string; // Conta
  strategy: string; // Estratégia
  position: string; // Pos mercado.
  quantity: string; // Qtd
  entryPrice: string; // Preço entrada
  exitPrice: string; // Preço saída
  entryTime: string; // Hora entrada
  exitTime: string; // Hora saída
  entryLabel: string; // Entrada
  exitLabel: string; // Sáída (typo in original)
  profit: string; // Profit
  accumulatedProfit: string; // Acu lucro líquido
  commission: string; // Corretagem
  mae: string; // MAE
  mfe: string; // MFE
  etd: string; // ETD
  bars: string; // Barras
}

/**
 * Parses NinjaTrader CSV file with semicolon separator.
 * @param file - CSV file from NinjaTrader Grid
 * @returns Promise<RawTradeData[]>
 */
export const parseNinjaTraderCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File is empty");

        // Use TextDecoder to handle encodings (UTF-8, UTF-16, ISO-8859-1) better than readAsText
        // Check for common BOMs
        const uint8Array = new Uint8Array(buffer);
        let content = "";

        if (uint8Array.length > 2 && uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
          const decoder = new TextDecoder("utf-16le");
          content = decoder.decode(buffer);
        } else {
          const decoder = new TextDecoder("utf-8");
          content = decoder.decode(buffer);
        }

        const result = parseNinjaTraderContent(content);
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
 * Parsing logic extracted for testing and reusability
 */
export const parseNinjaTraderContent = (content: string): ImportResult => {
  if (!content) throw new Error("File is empty");

  // Split by lines and filter empty lines
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  // Detect Delimiter (semicolon vs comma) based on the header row
  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const headers = headerLine.split(delimiter).map((h) => h.trim());

  // Parse data rows
  const rawData: RawTradeData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(delimiter);

    // Skip if not enough values
    if (values.length < 3) continue;

    const rowData: RawTradeData = {};
    headers.forEach((header, index) => {
      if (index < values.length && header) {
        const val = values[index]?.trim() || "";
        // Clean quotes if comma delimiter used (CSV standard)
        rowData[header] = val.replace(/^"|"$/g, "");
      }
    });

    // Only add rows that look like trade data (have a trade number)
    // Check English "Trade number" or Portuguese "Núm. Neg."
    const tradeNum = rowData["Núm. Neg."] || rowData["Trade number"];
    if (tradeNum && !isNaN(Number(tradeNum))) {
      rawData.push(rowData);
    }
  }

  return { data: rawData };
};

/**
 * Parses NinjaTrader money format: "$ 19,00" or "-$ 14,00" -> number
 */
export const parseNinjaTraderMoney = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;

  // Remove spaces
  let str = value.trim();

  // Check for parenthesis format (100.00) = negative
  const isParenthesis = str.startsWith("(") && str.endsWith(")");
  if (isParenthesis) {
    str = str.replace(/[()]/g, "");
  }

  // Remove currency symbol and spaces
  str = str.replace(/\$/g, "").replace(/\s/g, "");

  // Detect format:
  // PT: 1.000,00 (dot thousand, comma decimal)
  // EN: 1,000.00 (comma thousand, dot decimal)

  // Simple heuristic: if it has comma and dot
  if (str.includes(",") && str.includes(".")) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Comma is last, assume PT (decimal)
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Dot is last, assume EN (decimal)
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    // Only comma. Could be 1,000 (EN 1k) or 1,00 (PT 1)
    // NinjaTrader usually provides decimals.
    // If it's a small number like 1,00 -> likely PT.
    // If it's 1,000 -> likely EN.
    // Let's assume standard NinjaTrader CSV export usually follows the locale of the headers.
    // But since we don't have that context easily passed here without refactoring signature,
    // let's try replacing comma with dot if there are no other separators.
    // (This matches previous logic for PT support)
    str = str.replace(",", ".");
  }
  // If only dot, keeps as is (EN decimal or PT thousand? usually EN decimal in standard exports)

  let num = parseFloat(str);
  if (isNaN(num)) return 0;

  if (isParenthesis) {
    num = -Math.abs(num);
  }

  return num;
};

/**
 * Parses NinjaTrader price format: "25370,25" -> 25370.25
 */
export const parseNinjaTraderPrice = (value: string | number): number => {
  // Use same logic as Money but without currency handling
  return parseNinjaTraderMoney(value);
};

/**
 * Parses NinjaTrader date format: "dd/MM/yyyy HH:mm:ss" OR "M/d/yyyy h:mm:ss a" -> Date
 */
export const parseNinjaTraderDate = (dateStr: string | number): Date | null => {
  if (!dateStr) return null;
  if (typeof dateStr === "number") return null; // NinjaTrader uses string dates

  const str = String(dateStr).trim();
  if (!str) return null;

  try {
    // 1. Try PT/EU format: DD/MM/YYYY HH:mm:ss
    let parsed = dayjs(str, "DD/MM/YYYY HH:mm:ss", true);
    if (parsed.isValid()) return parsed.toDate();

    // 2. Try English format: MM/DD/YYYY h:mm:ss A (e.g. 12/19/2024 8:44:03 AM)
    parsed = dayjs(str, "MM/DD/YYYY h:mm:ss A", true);
    if (parsed.isValid()) return parsed.toDate();

    // 3. Try English format without seconds: MM/DD/YYYY h:mm A
    parsed = dayjs(str, "MM/DD/YYYY h:mm A", true);
    if (parsed.isValid()) return parsed.toDate();

    // 4. Try generic ISO-like or fallback
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) return fallback;

    // 5. Try without seconds (PT)
    parsed = dayjs(str, "DD/MM/YYYY HH:mm", true);
    if (parsed.isValid()) return parsed.toDate();

    return null;
  } catch (e) {
    console.warn("NinjaTrader date parse error:", e);
    return null;
  }
};

/**
 * Gets the auto-mapping for NinjaTrader columns
 */
export const getNinjaTraderAutoMapping = () => ({
  entryDate: "Hora entrada",
  symbol: "Ativo",
  direction: "Pos mercado.",
  volume: "Qtd",
  entryPrice: "Preço entrada",
  exitDate: "Hora saída",
  exitPrice: "Preço saída",
  profit: "Profit",
  commission: "Corretagem",
  swap: "", // NinjaTrader doesn't have swap
  sl: "",
  tp: "",
});
