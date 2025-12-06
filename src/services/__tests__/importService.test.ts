import { describe, it, expect, vi } from 'vitest';
import { parseTradingFile, parseTradeDate, normalizeTradeType, cleanSymbol } from '../importService';
import * as XLSX from 'xlsx';

// Mock FileReader if necessary, but jsdom usually handles it.
// However, creating a File object works in jsdom.

describe('importService', () => {
    describe('parseTradeDate', () => {
        it('parses "yyyy.MM.dd HH:mm:ss" format', () => {
            const date = parseTradeDate('2025.12.05 17:35:00');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getFullYear()).toBe(2025);
            expect(date?.getMonth()).toBe(11); // December is 11
            expect(date?.getDate()).toBe(5);
            expect(date?.getHours()).toBe(17);
            expect(date?.getMinutes()).toBe(35);
        });

        it('parses "yyyy.MM.dd HH:mm" format', () => {
            const date = parseTradeDate('2025.12.05 17:35');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getFullYear()).toBe(2025);
        });

        it('parses Excel serial date', () => {
             // 45632 is roughly in 2024
             // Just checking it calls SSF.parse_date_code
             const date = parseTradeDate(45632);
             expect(date).toBeInstanceOf(Date);
        });
    });

    describe('normalizeTradeType', () => {
        it('normalizes buy to Long', () => {
            expect(normalizeTradeType('buy')).toBe('Long');
            expect(normalizeTradeType('Buy')).toBe('Long');
        });
        it('normalizes sell to Short', () => {
            expect(normalizeTradeType('sell')).toBe('Short');
            expect(normalizeTradeType('Sell')).toBe('Short');
        });
    });

    describe('cleanSymbol', () => {
        it('removes suffixes', () => {
            expect(cleanSymbol('EURUSD.cash')).toBe('EURUSD');
            expect(cleanSymbol('EURUSD')).toBe('EURUSD');
        });
    });

    describe('parseTradingFile', () => {
        it('parses a CSV content correctly handling Positions section', async () => {
            const csvContent = [
                'Metadata,Line1',
                'Metadata,Line2',
                'Metadata,Line3',
                'Metadata,Line4',
                'Metadata,Line5',
                'Positions,',
                'Time,Position,Symbol,Type,Volume,Price,S / L,T / P,Time,Price,Commission,Swap,Profit',
                '2025.12.05 10:00,123,EURUSD,buy,1.0,1.05,1.04,1.06,2025.12.05 12:00,1.055,0,0,500',
                'Orders,',
                'ignored,row'
            ].join('\n');

            const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

            const data = await parseTradingFile(file);

            expect(data).toHaveLength(1);
            const row = data[0];

            // Check keys mapping
            // Time -> Entry Time (index 0)
            // Price -> Entry Price (index 5)
            // Time -> Exit Time (index 8)
            // Price -> Exit Price (index 9)

            // XLSX might parse dates as numbers (Excel serial dates) and prices as numbers

            // Check Entry Time
            const entryDate = parseTradeDate(row['Entry Time'] as string | number);
            expect(entryDate).toBeInstanceOf(Date);
            
            // Compare with expected parsed date to avoid timezone issues
            const expectedDate = parseTradeDate('2025.12.05 10:00');
            expect(entryDate?.getTime()).toBe(expectedDate?.getTime());

            // Check Price (might be number or string)
            expect(Number(row['Entry Price'])).toBe(1.05);

            // Check Exit Time
            const exitDate = parseTradeDate(row['Exit Time'] as string | number);
            expect(exitDate).toBeInstanceOf(Date);
            
            const expectedExitDate = parseTradeDate('2025.12.05 12:00');
            expect(exitDate?.getTime()).toBe(expectedExitDate?.getTime());

            expect(Number(row['Exit Price'])).toBe(1.055);
            expect(row['Symbol']).toBe('EURUSD');
            expect(row['Type']).toBe('buy');
            expect(Number(row['Profit'])).toBe(500);
        });
    });
});
