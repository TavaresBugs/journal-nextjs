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

/**
 * Reads and parses the trading file (XLSX/CSV).
 * Handles metadata skipping, section detection, and duplicate column mapping.
 */
export const parseTradingFile = async (file: File): Promise<RawTradeData[]> => {
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

        resolve(rawData);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses MetaTrader HTML Report.
 */
export const parseHTMLReport = async (file: File): Promise<RawTradeData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) throw new Error('File is empty');

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
                         // Heuristic: If we have > 13 columns, maybe there's a hidden one?
                         // But for now, let's treat it as standard 13-column or adapt.
                         // If we have "phantom" empty cells that shift everything, we need to know where they are.
                         
                         // Reverting to standard index mapping but keeping empty cells (important for S/L, T/P)
                         // User reported "Profit" issues. Profit is usually last. 
                         // If there's an extra cell, profit might be at 13 instead of 12.
                         // Let's grab the LAST cell for Profit? 
                         // And Index - 1 for Swap, etc?
                         // Or try to detect the hidden cell.
                         
                         // Common MT4 Report issue: hidden cell for "Taxes" or something?
                         // Let's assume standard indices first but handle potential shifting if length > 13.
                         
                         const entryTimeIndex = 0;
                         const ticketIndex = 1;
                         const symbolIndex = 2;
                         const typeIndex = 3;
                         const volumeIndex = 4;
                         let entryPriceIndex = 5;
                         const slIndex = 6;
                         const tpIndex = 7;
                         let exitTimeIndex = 8;
                         let exitPriceIndex = 9;
                         let commissionIndex = 10;
                         let swapIndex = 11;

                         // If we have 14 columns, usually one is hidden or check logic
                         if (cells.length === 14) {
                             // Sometimes there's a hidden column after Type? or at the end?
                             // Let's assume the alignment based on "Profit" being last.
                             swapIndex = 12;
                             commissionIndex = 11;
                             exitPriceIndex = 10;
                             exitTimeIndex = 9;
                             entryPriceIndex = 5; // Should be consistent unless hidden is before
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
                
                resolve(rows);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file); // HTML is text
    });
};

/**
 * Wrapper to detect file type and call appropriate parser.
 */
export const processImportFile = async (file: File): Promise<RawTradeData[]> => {
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
 */
export const normalizeTradeType = (type: string): 'Long' | 'Short' | null => {
    const lower = type.toLowerCase().trim();
    if (lower.includes('buy')) return 'Long';
    if (lower.includes('sell')) return 'Short';
    return null;
};

/**
 * Cleans up symbol names (e.g. "EURUSD.cash" -> "EURUSD")
 */
export const cleanSymbol = (symbol: string): string => {
    // Remove suffixes like .cash, +, etc if needed.
    // The prompt says: "Remove sufixos do Symbol (ex: "EURUSD.cash" -> "EURUSD")."
    // We can assume suffixes start with a dot or maybe special chars?
    // A simple regex to take the alphanumeric start.
    // Or split by dot.
    return symbol.split('.')[0];
};
