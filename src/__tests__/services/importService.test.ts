import { describe, it, expect } from 'vitest';
import { parseTradingFile, parseTradeDate, normalizeTradeType, cleanSymbol, parseHTMLReport } from '@/services/trades/import';

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

    describe('parseTradingFile (NinjaTrader CSV)', () => {
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

            const result = await parseTradingFile(file);

            expect(result.data).toHaveLength(1);
            const row = result.data[0];

            // Check Entry Time
            const entryDate = parseTradeDate(row['Entry Time'] as string | number);
            expect(entryDate).toBeInstanceOf(Date);
            
            const expectedDate = parseTradeDate('2025.12.05 10:00');
            expect(Math.abs((entryDate?.getTime() || 0) - (expectedDate?.getTime() || 0))).toBeLessThan(60000);

            expect(Number(row['Entry Price'])).toBe(1.05);
            expect(Number(row['Exit Price'])).toBe(1.055);
            expect(row['Symbol']).toBe('EURUSD');
            expect(row['Type']).toBe('buy');
            expect(Number(row['Profit'])).toBe(500);
        });
    });

    describe('parseHTMLReport (MetaTrader HTML)', () => {
        it('parses MetaTrader HTML report with 13 columns', async () => {
            const htmlContent = `
                <html>
                <body>
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12345</td>
                        <td>EURUSD</td>
                        <td>buy</td>
                        <td>1.00</td>
                        <td>1.05000</td>
                        <td>1.04000</td>
                        <td>1.06000</td>
                        <td>2025.12.05 12:00:00</td>
                        <td>1.05500</td>
                        <td>-5.00</td>
                        <td>-2.00</td>
                        <td>500.00</td>
                    </tr>
                    <tr><td><b>Orders</b></td></tr>
                </table>
                </body>
                </html>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            expect(result.data).toHaveLength(1);
            const trade = result.data[0];

            expect(trade['Entry Time']).toBe('2025.12.05 10:00:00');
            expect(trade['Ticket']).toBe('12345');
            expect(trade['Symbol']).toBe('EURUSD');
            expect(trade['Type']).toBe('buy');
            expect(trade['Volume']).toBe('1.00');
            expect(trade['Entry Price']).toBe('1.05000');
            expect(trade['Exit Time']).toBe('2025.12.05 12:00:00');
            expect(trade['Exit Price']).toBe('1.05500');
            expect(trade['Commission']).toBe('-5.00');
            expect(trade['Swap']).toBe('-2.00');
            expect(trade['Profit']).toBe('500.00');
        });

        it('parses sell trades correctly', async () => {
            const htmlContent = `
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12346</td>
                        <td>GBPUSD</td>
                        <td>sell</td>
                        <td>0.50</td>
                        <td>1.25000</td>
                        <td>1.26000</td>
                        <td>1.24000</td>
                        <td>2025.12.05 14:00:00</td>
                        <td>1.24500</td>
                        <td>-3.00</td>
                        <td>-1.00</td>
                        <td>250.00</td>
                    </tr>
                    <tr><td><b>Deals</b></td></tr>
                </table>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            expect(result.data).toHaveLength(1);
            expect(result.data[0]['Type']).toBe('sell');
            expect(result.data[0]['Symbol']).toBe('GBPUSD');
        });

        it('ignores non-trade rows (balance, deposit, etc)', async () => {
            const htmlContent = `
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12345</td>
                        <td>EURUSD</td>
                        <td>balance</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>2025.12.05 10:00:00</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>1000.00</td>
                    </tr>
                    <tr>
                        <td>2025.12.05 11:00:00</td>
                        <td>12346</td>
                        <td>EURUSD</td>
                        <td>buy</td>
                        <td>1.00</td>
                        <td>1.05</td>
                        <td>1.04</td>
                        <td>1.06</td>
                        <td>2025.12.05 12:00:00</td>
                        <td>1.055</td>
                        <td>-5</td>
                        <td>-2</td>
                        <td>500</td>
                    </tr>
                    <tr><td><b>Orders</b></td></tr>
                </table>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            // Should only have the buy trade, not the balance entry
            expect(result.data).toHaveLength(1);
            expect(result.data[0]['Type']).toBe('buy');
        });

        it('extracts Total Net Profit from HTML', async () => {
            const htmlContent = `
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12345</td>
                        <td>EURUSD</td>
                        <td>buy</td>
                        <td>1.00</td>
                        <td>1.05</td>
                        <td>1.04</td>
                        <td>1.06</td>
                        <td>2025.12.05 12:00:00</td>
                        <td>1.055</td>
                        <td>-5</td>
                        <td>-2</td>
                        <td>500</td>
                    </tr>
                    <tr><td><b>Orders</b></td></tr>
                </table>
                <table>
                    <tr><td>Total Net Profit:</td><td><b>1234.56</b></td></tr>
                </table>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            expect(result.totalNetProfit).toBe(1234.56);
        });

        it('handles 14-column layout correctly', async () => {
            const htmlContent = `
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12345</td>
                        <td>EURUSD</td>
                        <td>buy</td>
                        <td>ExtraColumn</td>
                        <td>1.00</td>
                        <td>1.05000</td>
                        <td>1.04000</td>
                        <td>1.06000</td>
                        <td>2025.12.05 12:00:00</td>
                        <td>1.05500</td>
                        <td>-5.00</td>
                        <td>-2.00</td>
                        <td>500.00</td>
                    </tr>
                    <tr><td><b>Orders</b></td></tr>
                </table>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            expect(result.data).toHaveLength(1);
            const trade = result.data[0];

            expect(trade['Volume']).toBe('1.00');
            expect(trade['Entry Price']).toBe('1.05000');
            expect(trade['Exit Price']).toBe('1.05500');
            expect(trade['Profit']).toBe('500.00');
        });

        it('parses multiple trades correctly', async () => {
            const htmlContent = `
                <table>
                    <tr><td><b>Positions</b></td></tr>
                    <tr>
                        <td>2025.12.05 10:00:00</td>
                        <td>12345</td>
                        <td>EURUSD</td>
                        <td>buy</td>
                        <td>1.00</td>
                        <td>1.05</td>
                        <td>1.04</td>
                        <td>1.06</td>
                        <td>2025.12.05 12:00:00</td>
                        <td>1.055</td>
                        <td>-5</td>
                        <td>-2</td>
                        <td>500</td>
                    </tr>
                    <tr>
                        <td>2025.12.05 14:00:00</td>
                        <td>12346</td>
                        <td>GBPUSD</td>
                        <td>sell</td>
                        <td>0.50</td>
                        <td>1.25</td>
                        <td>1.26</td>
                        <td>1.24</td>
                        <td>2025.12.05 16:00:00</td>
                        <td>1.245</td>
                        <td>-3</td>
                        <td>-1</td>
                        <td>250</td>
                    </tr>
                    <tr><td><b>Orders</b></td></tr>
                </table>
            `;

            const file = new File([htmlContent], 'report.html', { type: 'text/html' });
            const result = await parseHTMLReport(file);

            expect(result.data).toHaveLength(2);
            expect(result.data[0]['Symbol']).toBe('EURUSD');
            expect(result.data[1]['Symbol']).toBe('GBPUSD');
        });
    });
});
