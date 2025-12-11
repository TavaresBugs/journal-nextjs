import * as XLSX from 'xlsx';
import { parse, isValid } from 'date-fns';

export interface RawTradeData {
  [key: string]: string | number;
}

export interface ParsedTrade {
  entryDate: Date;
  entryTime?: string;
  symbol: string;
  type: 'Long' | 'Short';
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

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('File is empty');

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to array of arrays to handle custom parsing
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        // 1. Find "Positions" section
        let positionsRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          // Check if row contains "Positions" (usually first cell)
          if (row && row[0] && String(row[0]).trim() === 'Positions') {
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

          if (trimmedHeader === 'Time') {
            if (index === 0) newHeader = 'Entry Time';
            else if (index === 8) newHeader = 'Exit Time';
            else {
                 // Fallback if structure is slightly different
                 headerCounts['Time'] = (headerCounts['Time'] || 0) + 1;
                 newHeader = `Time_${headerCounts['Time']}`;
            }
          } else if (trimmedHeader === 'Price') {
             if (index === 5) newHeader = 'Entry Price';
             else if (index === 9) newHeader = 'Exit Price';
             else {
                 headerCounts['Price'] = (headerCounts['Price'] || 0) + 1;
                 newHeader = `Price_${headerCounts['Price']}`;
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
             if (row[0] && String(row[0]).trim() === 'Orders') break;
             if (row[0] && String(row[0]).trim() === 'Deals') break;

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
            const rowStr = row.join(' ').toLowerCase();
            if (rowStr.includes('total net profit')) {
                 // Try to find the number in this row
                 for (const cell of row) {
                     if (typeof cell === 'number') {
                         totalNetProfit = cell;
                         break;
                     } else if (typeof cell === 'string') {
                         // Clean string and try parse
                         const val = parseFloat(cell.replace(/[^0-9.-]/g, ''));
                         if (!isNaN(val) && cell.match(/[0-9]/)) { 
                             // Basic heuristic: it should be the value next to label usually
                             // But let's verify if the cell is NOT the label itself
                             if (!cell.toLowerCase().includes('total')) {
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
                if (!buffer) throw new Error('File is empty');

                // Decode using TextDecoder which handles BOM automatically for UTF-8 and UTF-16
                // If it fails or produces garbage, we might need to try specific encodings.
                // But usually, standard TextDecoder("utf-8") works for UTF-8. 
                // For UTF-16le (common in Windows reports), we need to detect it.
                
                let content = '';
                const uint8Array = new Uint8Array(buffer);
                
                // Simple BOM detection
                if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
                    const decoder = new TextDecoder('utf-16le');
                    content = decoder.decode(buffer);
                } else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
                    const decoder = new TextDecoder('utf-16be');
                    content = decoder.decode(buffer);
                } else {
                    // Try utf-8 first
                    try {
                        const decoder = new TextDecoder('utf-8', { fatal: true });
                        content = decoder.decode(buffer);
                    } catch {
                        // If fatal error, try windows-1252 (ANSI)
                        const decoder = new TextDecoder('windows-1252');
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
                    if (rowContent.includes('<b>Positions</b>')) {
                        inPositionsSection = true;
                        continue;
                    }
                    if (rowContent.includes('<b>Orders</b>') || rowContent.includes('<b>Deals</b>')) {
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
                        const cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
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
                         if (type !== 'buy' && type !== 'sell') continue;

                         const tradeData: RawTradeData = {
                             'Entry Time': cells[entryTimeIndex],
                             'Ticket': cells[ticketIndex],
                             'Symbol': cells[symbolIndex],
                             'Type': cells[typeIndex],
                             'Volume': cells[volumeIndex],
                             'Entry Price': cells[entryPriceIndex],
                             'S/L': cells[slIndex],
                             'T/P': cells[tpIndex],
                             'Exit Time': cells[exitTimeIndex],
                             'Exit Price': cells[exitPriceIndex],
                             'Commission': cells[commissionIndex],
                             'Swap': cells[swapIndex],
                             'Profit': cells[cells.length - 1] // Always take the last cell as profit
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
                    const cleanVal = totalMatch[1].replace(/[^0-9.-]/g, '');
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
    if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
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
    if (typeof dateStr === 'number') {
        const date = XLSX.SSF.parse_date_code(dateStr);
        return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
    }
    
    if (typeof dateStr === 'string') {
        try {
            let normalized = dateStr.trim();
            // Normalize separators: 2025.12.05 -> 2025-12-05, 2025/12/05 -> 2025-12-05
            normalized = normalized.replace(/\./g, '-').replace(/\//g, '-');

            const referenceDate = new Date();
            referenceDate.setSeconds(0, 0);

            // 1. Try ISO-like "yyyy-MM-dd HH:mm:ss"
            let date = parse(normalized, 'yyyy-MM-dd HH:mm:ss', referenceDate);
            if (isValid(date)) return date;

            // 2. Try "yyyy-MM-dd HH:mm"
            date = parse(normalized, 'yyyy-MM-dd HH:mm', referenceDate);
            if (isValid(date)) {
                date.setSeconds(0, 0);
                return date;
            }

            // 3. Try "dd-MM-yyyy HH:mm:ss" (Brazilian/European format)
            date = parse(normalized, 'dd-MM-yyyy HH:mm:ss', referenceDate);
            if (isValid(date)) return date;

            // 4. Try "dd-MM-yyyy HH:mm"
            date = parse(normalized, 'dd-MM-yyyy HH:mm', referenceDate);
            if (isValid(date)) {
                date.setSeconds(0, 0);
                return date;
            }

             // 5. Try standard Date constructor as fallback
            date = new Date(normalized);
            if (isValid(date)) return date;

        } catch (e) {
            console.warn('Date parse error:', e);
        }
    }
    return null;
};

/**
 * Normalizes trade type to 'Long' or 'Short'
 * Supports: MetaTrader (buy/sell), NinjaTrader (Comprada/Venda)
 */
export const normalizeTradeType = (type: string): 'Long' | 'Short' | null => {
    const lower = type.toLowerCase().trim();
    // MetaTrader
    if (lower.includes('buy')) return 'Long';
    if (lower.includes('sell')) return 'Short';
    // NinjaTrader (Portuguese)
    if (lower.includes('comprada') || lower === 'long') return 'Long';
    if (lower.includes('venda') || lower === 'short') return 'Short';
    return null;
};

/**
 * Cleans up symbol names
 * - MetaTrader: "EURUSD.cash" -> "EURUSD"
 * - NinjaTrader: "MNQ 12-25" -> "MNQ" (removes contract month-year)
 */
export const cleanSymbol = (symbol: string): string => {
    if (!symbol) return '';
    
    let cleaned = symbol.trim();
    
    // Remove suffix after dot (e.g., EURUSD.cash -> EURUSD)
    cleaned = cleaned.split('.')[0];
    
    // Remove NinjaTrader contract date (e.g., "MNQ 12-25" -> "MNQ")
    // Pattern: space followed by MM-YY or similar contract notation
    cleaned = cleaned.replace(/\s+\d{1,2}-\d{2,4}$/, '');
    
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
    tradeNumber: string;       // Núm. Neg.
    symbol: string;            // Ativo
    account: string;           // Conta
    strategy: string;          // Estratégia
    position: string;          // Pos mercado.
    quantity: string;          // Qtd
    entryPrice: string;        // Preço entrada
    exitPrice: string;         // Preço saída
    entryTime: string;         // Hora entrada
    exitTime: string;          // Hora saída
    entryLabel: string;        // Entrada
    exitLabel: string;         // Sáída (typo in original)
    profit: string;            // Profit
    accumulatedProfit: string; // Acu lucro líquido
    commission: string;        // Corretagem
    mae: string;               // MAE
    mfe: string;               // MFE
    etd: string;               // ETD
    bars: string;              // Barras
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
                const content = e.target?.result as string;
                if (!content) throw new Error('File is empty');

                // Split by lines and filter empty lines
                const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
                
                if (lines.length < 2) {
                    throw new Error('CSV file must have at least a header and one data row');
                }

                // First line is headers
                const headerLine = lines[0];
                const headers = headerLine.split(';').map(h => h.trim());

                // Parse data rows
                const rawData: RawTradeData[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    const values = line.split(';');
                    
                    // Skip if not enough values
                    if (values.length < 3) continue;

                    const rowData: RawTradeData = {};
                    headers.forEach((header, index) => {
                        if (index < values.length && header) {
                            rowData[header] = values[index]?.trim() || '';
                        }
                    });

                    // Only add rows that look like trade data (have a trade number)
                    const tradeNum = rowData['Núm. Neg.'];
                    if (tradeNum && !isNaN(Number(tradeNum))) {
                        rawData.push(rowData);
                    }
                }

                resolve({ data: rawData });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file, 'UTF-8');
    });
};

/**
 * Parses NinjaTrader money format: "$ 19,00" or "-$ 14,00" -> number
 */
export const parseNinjaTraderMoney = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;

    // Remove $ and spaces, handle negative sign
    let str = value.trim();
    const isNegative = str.startsWith('-');
    
    // Remove -$ or $ prefix
    str = str.replace(/^-?\s*\$\s*/, '');
    
    // Replace comma with dot for decimal
    str = str.replace(',', '.');
    
    // Remove any remaining spaces
    str = str.replace(/\s/g, '');
    
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    
    return isNegative ? -num : num;
};

/**
 * Parses NinjaTrader price format: "25370,25" -> 25370.25
 */
export const parseNinjaTraderPrice = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;

    // Replace comma with dot for decimal
    const str = value.trim().replace(',', '.');
    const num = parseFloat(str);
    
    return isNaN(num) ? 0 : num;
};

/**
 * Parses NinjaTrader date format: "dd/MM/yyyy HH:mm:ss" -> Date
 */
export const parseNinjaTraderDate = (dateStr: string | number): Date | null => {
    if (!dateStr) return null;
    if (typeof dateStr === 'number') return null; // NinjaTrader uses string dates

    const str = String(dateStr).trim();
    if (!str) return null;

    try {
        // Format: dd/MM/yyyy HH:mm:ss
        const referenceDate = new Date();
        referenceDate.setSeconds(0, 0);

        // Try parsing with date-fns
        const date = parse(str, 'dd/MM/yyyy HH:mm:ss', referenceDate);
        if (isValid(date)) return date;

        // Also try without seconds
        const dateNoSec = parse(str, 'dd/MM/yyyy HH:mm', referenceDate);
        if (isValid(dateNoSec)) return dateNoSec;

        return null;
    } catch (e) {
        console.warn('NinjaTrader date parse error:', e);
        return null;
    }
};

/**
 * Gets the auto-mapping for NinjaTrader columns
 */
export const getNinjaTraderAutoMapping = () => ({
    entryDate: 'Hora entrada',
    symbol: 'Ativo',
    direction: 'Pos mercado.',
    volume: 'Qtd',
    entryPrice: 'Preço entrada',
    exitDate: 'Hora saída',
    exitPrice: 'Preço saída',
    profit: 'Profit',
    commission: 'Corretagem',
    swap: '', // NinjaTrader doesn't have swap
});
