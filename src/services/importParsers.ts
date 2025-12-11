import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import {
    RawTradeData,
    parseTradeDate,
    parseNinjaTraderDate,
    cleanSymbol,
    normalizeTradeType,
    parseNinjaTraderPrice,
    parseNinjaTraderMoney
} from './importService';
import { calculateSession } from '@/utils/tradeUtils';
import { Trade } from '@/types';

export interface ColumnMapping {
  entryDate: string;
  symbol: string;
  direction: string;
  volume: string;
  entryPrice: string;
  exitDate: string;
  exitPrice: string;
  profit: string;
  commission: string;
  swap: string;
  sl: string;
  tp: string;
}

export type DataSource = 'metatrader' | 'ninjatrader' | null;

/**
 * Robust UUID generator that works in insecure contexts (HTTP)
 */
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers or insecure context
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Detects column mapping based on headers for MetaTrader/generic CSVs
 */
export const detectColumnMapping = (headers: string[]): ColumnMapping => {
    const autoMapping: ColumnMapping = {
        entryDate: '',
        symbol: '',
        direction: '',
        volume: '',
        entryPrice: '',
        exitDate: '',
        exitPrice: '',
        profit: '',
        commission: '',
        swap: '',
        sl: '',
        tp: ''
    };

    // Helper: Find header case-insensitive
    const findHeader = (candidates: string[]) =>
        headers.find(h => candidates.some(c => h.toLowerCase() === c.toLowerCase()));

    // Entry Date
    if (headers.includes('Open Time')) autoMapping.entryDate = 'Open Time';
    else {
         const h = findHeader(['Open Time', 'Time', 'Entry Time', 'Data Abertura', 'Hora Entrada']);
         if (h) autoMapping.entryDate = h;
    }

    // Symbol
    if (headers.includes('Symbol')) autoMapping.symbol = 'Symbol';
    else {
         const h = findHeader(['Symbol', 'Ativo', 'Instrumento']);
         if (h) autoMapping.symbol = h;
    }

    // Direction/Type
    if (headers.includes('Type')) autoMapping.direction = 'Type';
    else {
         const h = findHeader(['Type', 'Tipo', 'Direção', 'Direcao']);
         if (h) autoMapping.direction = h;
    }

    // Volume
    if (headers.includes('Volume')) autoMapping.volume = 'Volume';
    else {
         const h = findHeader(['Volume', 'Size', 'Lote', 'Qtd', 'Quantidade']);
         if (h) autoMapping.volume = h;
    }

    // Entry Price
    if (headers.includes('Open Price')) autoMapping.entryPrice = 'Open Price';
    else {
         const h = findHeader(['Open Price', 'Price', 'Entry Price', 'Preço Entrada', 'Preco Entrada']);
         if (h) autoMapping.entryPrice = h;
    }

    // Exit Date
    if (headers.includes('Close Time')) autoMapping.exitDate = 'Close Time';
    else {
         const h = findHeader(['Close Time', 'Exit Time', 'Data Fechamento', 'Hora Saída', 'Hora Saida']);
         if (h) autoMapping.exitDate = h;
    }

    // Exit Price
    if (headers.includes('Close Price')) autoMapping.exitPrice = 'Close Price';
    else {
         const h = findHeader(['Close Price', 'Exit Price', 'Preço Saída', 'Preco Saida']);
         if (h) autoMapping.exitPrice = h;
    }

    // Stop Loss / Take Profit
    const slHeader = findHeader(['S / L', 'SL', 'Stop Loss', 'S/L', 'StopLoss']);
    if (slHeader) autoMapping.sl = slHeader;

    const tpHeader = findHeader(['T / P', 'TP', 'Take Profit', 'T/P', 'TakeProfit']);
    if (tpHeader) autoMapping.tp = tpHeader;

    // Profit
    if (headers.includes('Profit')) autoMapping.profit = 'Profit';
    else {
         const h = findHeader(['Profit', 'Lucro', 'P/L', 'PnL']);
         if (h) autoMapping.profit = h;
    }

    // Commission
    const commHeader = findHeader(['Commission', 'Comission', 'Comissao', 'Comissão', 'Fee', 'Fees', 'Corretagem', 'Cost']);
    if (commHeader) autoMapping.commission = commHeader;

    // Swap
    const swapHeader = findHeader(['Swap', 'Swaps', 'Rollover', 'Taxes', 'Taxa', 'Taxas']);
    if (swapHeader) autoMapping.swap = swapHeader;

    return autoMapping;
};

/**
 * Converts a date from a source timezone to New York time.
 */
export const convertToNYTime = (date: Date, sourceTimezone: string): Date => {
    try {
        // Extract date components without timezone interference
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const isoString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // First convert to UTC assuming the date is in sourceTimezone
        const utcDate = fromZonedTime(isoString, sourceTimezone);

        // Then convert UTC to NY time and return as if it were a local date
        // (This matches the behavior in the original component)
        const nyDate = toZonedTime(utcDate, 'America/New_York');
        return nyDate;
    } catch (e) {
        console.warn('Timezone conversion failed', e);
        return date; // Fallback to original date
    }
};

/**
 * Transforms raw data rows into Trade objects ready for saving.
 * Excludes ID and AccountID generation (should be handled by caller or DB).
 */
export const transformTrades = (
    rawData: RawTradeData[],
    mapping: ColumnMapping,
    dataSource: DataSource,
    brokerTimezone: string,
    accountId: string
): Trade[] => {
    const trades: Trade[] = [];

    for (const row of rawData) {
        try {
            // 1. Parse Entry Date
            let entryDate: Date | null;
            if (dataSource === 'ninjatrader') {
                entryDate = parseNinjaTraderDate(row[mapping.entryDate]);
            } else {
                entryDate = parseTradeDate(row[mapping.entryDate]);
            }

            if (!entryDate) continue;

            // 2. Apply Timezone Conversion -> NY Time
            if (brokerTimezone) {
                entryDate = convertToNYTime(entryDate, brokerTimezone);
            }

            // 3. Parse Symbol & Type
            const symbol = cleanSymbol(String(row[mapping.symbol]));
            const type = normalizeTradeType(String(row[mapping.direction]));

            if (!symbol || !type) continue;

            // 4. Format strings for storage
            const entryDateStr = format(entryDate, 'yyyy-MM-dd');
            const entryTimeStr = format(entryDate, 'HH:mm:ss');

            // 5. Parse Entry Price
            let entryPrice: number;
            if (dataSource === 'ninjatrader') {
                entryPrice = parseNinjaTraderPrice(row[mapping.entryPrice]);
            } else {
                entryPrice = Number(row[mapping.entryPrice]) || 0;
            }

            // 6. Parse Volume
            let volume: number;
            if (dataSource === 'ninjatrader') {
                volume = parseNinjaTraderPrice(row[mapping.volume]);
            } else {
                volume = Number(row[mapping.volume]) || 0;
            }

            // 6b. Parse S/L and T/P
            let stopLoss = 0;
            let takeProfit = 0;
            if (mapping.sl && row[mapping.sl]) {
                 stopLoss = dataSource === 'ninjatrader' ? parseNinjaTraderPrice(row[mapping.sl]) : (Number(row[mapping.sl]) || 0);
            }
            if (mapping.tp && row[mapping.tp]) {
                 takeProfit = dataSource === 'ninjatrader' ? parseNinjaTraderPrice(row[mapping.tp]) : (Number(row[mapping.tp]) || 0);
            }

            // Construct partial trade object
            const trade: Trade = {
                id: generateUUID(), // Use robust generator
                userId: '', // Caller should fill or DB
                accountId: accountId,
                symbol: symbol,
                type: type,
                entryDate: entryDateStr,
                entryTime: entryTimeStr,
                entryPrice: entryPrice,
                lot: volume,
                stopLoss: stopLoss,
                takeProfit: takeProfit,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                session: calculateSession(entryTimeStr),
            };

            // 7. Exit Date/Price
            if (mapping.exitDate && row[mapping.exitDate]) {
                let exitDate: Date | null;
                if (dataSource === 'ninjatrader') {
                    exitDate = parseNinjaTraderDate(row[mapping.exitDate]);
                } else {
                    exitDate = parseTradeDate(row[mapping.exitDate]);
                }
                if (exitDate) {
                    if (brokerTimezone) {
                        exitDate = convertToNYTime(exitDate, brokerTimezone);
                    }
                    trade.exitDate = format(exitDate, 'yyyy-MM-dd');
                    trade.exitTime = format(exitDate, 'HH:mm:ss');
                }
            }

            if (mapping.exitPrice && row[mapping.exitPrice]) {
                if (dataSource === 'ninjatrader') {
                    trade.exitPrice = parseNinjaTraderPrice(row[mapping.exitPrice]);
                } else {
                    trade.exitPrice = Number(row[mapping.exitPrice]);
                }
            }

            // 8. Profit / PnL / Outcome
            if (mapping.profit && row[mapping.profit]) {
                if (dataSource === 'ninjatrader') {
                    trade.pnl = parseNinjaTraderMoney(row[mapping.profit]);
                } else {
                    trade.pnl = Number(row[mapping.profit]);
                }

                // Add commission and swap to PnL if they exist
                if (mapping.commission && row[mapping.commission]) {
                    const commVal = dataSource === 'ninjatrader'
                    ? -Math.abs(parseNinjaTraderMoney(row[mapping.commission])) // Ninja is positive, make negative
                    : Number(row[mapping.commission]);
                    if (!isNaN(commVal)) trade.pnl += commVal;
                }
                if (mapping.swap && row[mapping.swap]) {
                    const swapVal = Number(row[mapping.swap]);
                    if (!isNaN(swapVal)) trade.pnl += swapVal;
                }

                if (trade.pnl > 0) trade.outcome = 'win';
                else if (trade.pnl < 0) trade.outcome = 'loss';
                else trade.outcome = 'breakeven';
            }

            // 9. Commission & Swap fields
            if (mapping.commission && row[mapping.commission]) {
                let commVal: number;
                if (dataSource === 'ninjatrader') {
                    commVal = parseNinjaTraderMoney(row[mapping.commission]);
                    if (commVal > 0) commVal = -commVal; // Store as negative cost
                } else {
                    commVal = Number(row[mapping.commission]);
                }
                if (!isNaN(commVal)) trade.commission = commVal;
            }

            if (mapping.swap && row[mapping.swap]) {
                const swapVal = Number(row[mapping.swap]);
                if (!isNaN(swapVal)) trade.swap = swapVal;
            }

            // 10. Notes construction if needed (omitted as per original simplified logic)

            trades.push(trade);

        } catch (e) {
            console.error('Error transforming row', row, e);
            // We just skip failing rows
        }
    }

    return trades;
};
