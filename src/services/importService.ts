import * as XLSX from 'xlsx';
import { parse, isValid, formatISO } from 'date-fns';

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
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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
                    rowData[header] = row[index];
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
 * Parses a custom date format "yyyy.MM.dd HH:mm:ss" or standard Excel date.
 */
export const parseTradeDate = (dateStr: string | number): Date | null => {
    if (!dateStr) return null;

    // If it's a number (Excel serial date)
    if (typeof dateStr === 'number') {
        // XLSX.utils usually handles this if we use sheet_to_json with raw: false, but we used raw: true (implicitly by accessing rows directly via sheet_to_json header:1).
        // Actually sheet_to_json(..., {header:1}) returns raw values (numbers for dates).
        // SheetJS provides a utility to convert Excel date to JS Date.
        const date = XLSX.SSF.parse_date_code(dateStr);
        return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
    }

    if (typeof dateStr === 'string') {
        // Format: "2025.12.05 17:35" or "2025.12.05 17:35:00"
        // Replace dots with hyphens for standard parsing or use date-fns
        // date-fns format string for "2025.12.05 17:35" is "yyyy.MM.dd HH:mm"
        try {
            const normalized = dateStr.trim();
            // Try parsing with seconds
            let date = parse(normalized, 'yyyy.MM.dd HH:mm:ss', new Date());
            if (isValid(date)) return date;

            // Try parsing without seconds
            date = parse(normalized, 'yyyy.MM.dd HH:mm', new Date());
            if (isValid(date)) return date;

             // Try standard ISO
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
