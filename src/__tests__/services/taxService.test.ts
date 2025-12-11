import { describe, it, expect } from 'vitest';
import { identifyDayTrades, calculateMonthlyTax, enrichTradesWithCosts, TaxCostsConfig, TaxableTrade } from '@/services/analytics/tax';
import { Trade } from '@/types';

// Mock Trade Helper
const createMockTrade = (overrides: Partial<Trade> = {}): Trade => ({
    id: '1',
    userId: 'user1',
    accountId: 'acc1',
    symbol: 'WIN',
    type: 'Long',
    entryPrice: 1000,
    stopLoss: 900,
    takeProfit: 1100,
    lot: 1,
    entryDate: '2023-10-10',
    exitDate: '2023-10-10', // Default Day Trade
    pnl: 100,
    outcome: 'win',
    createdAt: '',
    updatedAt: '',
    ...overrides
});

describe('Tax Service', () => {
    describe('identifyDayTrades', () => {
        it('should identify day trades correctly', () => {
            const trades: Trade[] = [
                createMockTrade({ id: '1', entryDate: '2023-10-01', exitDate: '2023-10-01' }), // DT
                createMockTrade({ id: '2', entryDate: '2023-10-01', exitDate: '2023-10-02' }), // Swing
                createMockTrade({ id: '3', entryDate: '2023-10-05', exitDate: '2023-10-05' }), // DT
            ];

            const result = identifyDayTrades(trades);
            expect(result).toHaveLength(2);
            expect(result.map(t => t.id)).toEqual(['1', '3']);
        });
    });

    describe('enrichTradesWithCosts', () => {
        it('should calculate costs and irrf correctly for profitable DT', () => {
            const trades: Trade[] = [
                createMockTrade({ id: '1', pnl: 500, entryDate: '2023-10-01', exitDate: '2023-10-01' })
            ];
            const config: TaxCostsConfig = {
                defaultBrokerageFee: 1.0,
                defaultExchangeFeePct: 0,
                defaultTaxesPct: 0 // ISS
            };

            const enriched = enrichTradesWithCosts(trades, config);
            const trade = enriched[0];

            expect(trade.brokerageFee).toBe(1.0);
            expect(trade.irrf).toBe(5.0); // 1% of 500
            expect(trade.netResult).toBe(500 - 1.0); // 500 - 1 (costs)
            expect(trade.isDayTrade).toBe(true);
        });

        it('should not calculate irrf for losing DT', () => {
            const trades: Trade[] = [
                createMockTrade({ id: '1', pnl: -200, entryDate: '2023-10-01', exitDate: '2023-10-01' })
            ];
            const config: TaxCostsConfig = {
                defaultBrokerageFee: 1.0,
                defaultExchangeFeePct: 0,
                defaultTaxesPct: 0
            };

            const enriched = enrichTradesWithCosts(trades, config);
            const trade = enriched[0];

            expect(trade.irrf).toBe(0);
            expect(trade.netResult).toBe(-200 - 1.0); // -201
        });
    });

    describe('calculateMonthlyTax', () => {
        it('should calculate tax due correctly without previous loss', () => {
            const trades: TaxableTrade[] = [
                // Trade 1: Profit 1000, Costs 10, IRRF 10. Net = 990.
                { ...createMockTrade(), pnl: 1000, brokerageFee: 10, exchangeFee: 0, taxes: 0, irrf: 10, netResult: 990, isDayTrade: true, exitDate: '2023-10-01' },
                // Trade 2: Loss 200, Costs 5, IRRF 0. Net = -205.
                { ...createMockTrade(), pnl: -200, brokerageFee: 5, exchangeFee: 0, taxes: 0, irrf: 0, netResult: -205, isDayTrade: true, exitDate: '2023-10-02' }
            ] as TaxableTrade[];

            // Total Net: 990 - 205 = 785
            // Taxable Basis: 785
            // Tax (20%): 157
            // IRRF Deduct: 10 (only from profitable trade)
            // Due: 147

            const result = calculateMonthlyTax('2023-10', trades, 0);

            expect(result.grossProfit).toBe(800);
            expect(result.costs).toBe(15);
            expect(result.netResult).toBe(785);
            expect(result.taxableBasis).toBe(785);
            expect(result.irrfDeduction).toBe(10);
            expect(result.taxDue).toBe(157 - 10);
        });

        it('should offset previous losses', () => {
             const trades: TaxableTrade[] = [
                // Profit 1000, Costs 0, IRRF 10. Net 1000.
                { ...createMockTrade(), pnl: 1000, brokerageFee: 0, exchangeFee: 0, taxes: 0, irrf: 10, netResult: 1000, isDayTrade: true, exitDate: '2023-10-01' }
            ] as TaxableTrade[];

            // Previous Loss: 400
            // Net: 1000. Taxable Basis: 1000 - 400 = 600.
            // Tax (20%): 120.
            // IRRF Deduct: 10.
            // Due: 110.

            const result = calculateMonthlyTax('2023-10', trades, 400);

            expect(result.accumulatedLoss).toBe(0);
            expect(result.taxableBasis).toBe(600);
            expect(result.taxDue).toBe(120 - 10);
        });

        it('should carry forward remaining loss', () => {
             const trades: TaxableTrade[] = [
                // Profit 200, Costs 0, IRRF 2. Net 200.
                { ...createMockTrade(), pnl: 200, brokerageFee: 0, exchangeFee: 0, taxes: 0, irrf: 2, netResult: 200, isDayTrade: true, exitDate: '2023-10-01' }
            ] as TaxableTrade[];

            // Previous Loss: 500
            // Net: 200. Covers part of loss.
            // Remaining Loss: 300.
            // Taxable Basis: 0.
            // Tax Due: 0. (IRRF 2 stays as credit? In this logic, taxDue goes negative or zero).

            const result = calculateMonthlyTax('2023-10', trades, 500);

            expect(result.accumulatedLoss).toBe(300);
            expect(result.taxableBasis).toBe(0);
            expect(result.taxDue).toBeLessThanOrEqual(0);
        });

         it('should accumulate new loss', () => {
             const trades: TaxableTrade[] = [
                // Loss 200. Net -200.
                { ...createMockTrade(), pnl: -200, brokerageFee: 0, exchangeFee: 0, taxes: 0, irrf: 0, netResult: -200, isDayTrade: true, exitDate: '2023-10-01' }
            ] as TaxableTrade[];

            // Previous Loss: 100
            // Net: -200.
            // New Accumulated Loss: 100 + 200 = 300.

            const result = calculateMonthlyTax('2023-10', trades, 100);

            expect(result.accumulatedLoss).toBe(300);
            expect(result.taxableBasis).toBe(0);
        });
    });
});
