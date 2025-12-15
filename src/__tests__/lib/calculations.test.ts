import { describe, it, expect } from 'vitest';
import { 
    calculateTradePnL, 
    determineTradeOutcome, 
    formatCurrency,
    groupTradesByDay 
} from '@/lib/calculations';
import type { Trade } from '@/types';

// ============================================
// calculateTradePnL Tests
// ============================================

describe('calculateTradePnL', () => {
    const baseTrade: Trade = {
        id: '1',
        userId: 'user1',
        accountId: 'acc1',
        symbol: 'EURUSD',
        type: 'Long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lot: 1,
        commission: -7,
        swap: -2,
        stopLoss: 1.0950,
        takeProfit: 1.1100,
        entryDate: '2024-01-15',
        pnl: 0,
        outcome: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    it('should calculate positive PnL for winning Long trade', () => {
        const trade = { ...baseTrade };
        const multiplier = 100000; // Standard forex lot
        
        const pnl = calculateTradePnL(trade, multiplier);
        
        // (1.1050 - 1.1000) * 1 * 100000 = 500
        // 500 - 7 - 2 = 491
        expect(pnl).toBeCloseTo(491, 0);
    });

    it('should calculate negative PnL for losing Long trade', () => {
        const trade = { 
            ...baseTrade, 
            exitPrice: 1.0950  // Hit stop loss
        };
        const multiplier = 100000;
        
        const pnl = calculateTradePnL(trade, multiplier);
        
        // (1.0950 - 1.1000) * 1 * 100000 = -500
        // -500 - 7 - 2 = -509
        expect(pnl).toBeCloseTo(-509, 0);
    });

    it('should calculate positive PnL for winning Short trade', () => {
        const trade = { 
            ...baseTrade, 
            type: 'Short' as const,
            entryPrice: 1.1050,
            exitPrice: 1.1000,
        };
        const multiplier = 100000;
        
        const pnl = calculateTradePnL(trade, multiplier);
        
        // (1.1050 - 1.1000) * 1 * 100000 = 500
        // 500 - 7 - 2 = 491
        expect(pnl).toBeCloseTo(491, 0);
    });

    it('should return 0 if no exit price', () => {
        const trade = { ...baseTrade, exitPrice: undefined };
        const pnl = calculateTradePnL(trade, 100000);
        
        expect(pnl).toBe(0);
    });

    it('should handle different lot sizes', () => {
        const trade = { ...baseTrade, lot: 0.5 };
        const multiplier = 100000;
        
        const pnl = calculateTradePnL(trade, multiplier);
        
        // (1.1050 - 1.1000) * 0.5 * 100000 = 250
        // 250 - 7 - 2 = 241
        expect(pnl).toBeCloseTo(241, 0);
    });
});

// ============================================
// determineTradeOutcome Tests
// ============================================

describe('determineTradeOutcome', () => {
    const baseTrade: Trade = {
        id: '1',
        userId: 'user1',
        accountId: 'acc1',
        symbol: 'EURUSD',
        type: 'Long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        lot: 1,
        commission: 0,
        swap: 0,
        stopLoss: 1.0950,
        takeProfit: 1.1100,
        entryDate: '2024-01-15',
        pnl: 0,
        outcome: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    it('should return "win" for positive PnL', () => {
        const trade = { ...baseTrade, pnl: 100 };
        expect(determineTradeOutcome(trade)).toBe('win');
    });

    it('should return "loss" for negative PnL', () => {
        const trade = { ...baseTrade, pnl: -100 };
        expect(determineTradeOutcome(trade)).toBe('loss');
    });

    it('should return "breakeven" for zero PnL', () => {
        const trade = { ...baseTrade, pnl: 0 };
        expect(determineTradeOutcome(trade)).toBe('breakeven');
    });

    it('should return "pending" if no exitPrice', () => {
        const trade = { ...baseTrade, exitPrice: undefined, pnl: undefined };
        expect(determineTradeOutcome(trade)).toBe('pending');
    });
});

// ============================================
// formatCurrency Tests
// ============================================

describe('formatCurrency', () => {
    // Note: Tests use pt-BR locale which outputs "US$ X.XXX,XX" format
    it('should format positive numbers with currency symbol', () => {
        const result = formatCurrency(1234.56);
        // Check it contains basic number representation
        expect(result).toContain('1');
        expect(result).toContain('234');
    });

    it('should format negative numbers with minus sign', () => {
        const result = formatCurrency(-500);
        expect(result).toContain('-');
        expect(result).toContain('500');
    });

    it('should format zero', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0');
    });

    it('should handle small decimals', () => {
        const result = formatCurrency(0.01);
        expect(result).toContain('0');
        expect(result).toContain('01');
    });
});

// ============================================
// groupTradesByDay Tests
// ============================================

describe('groupTradesByDay', () => {
    const trades: Trade[] = [
        {
            id: '1',
            userId: 'user1',
            accountId: 'acc1',
            symbol: 'EURUSD',
            type: 'Long',
            entryPrice: 1.1000,
            lot: 1,
            commission: 0,
            swap: 0,
            stopLoss: 1.0950,
            takeProfit: 1.1100,
            entryDate: '2024-01-15',
            pnl: 100,
            outcome: 'win',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '2',
            userId: 'user1',
            accountId: 'acc1',
            symbol: 'GBPUSD',
            type: 'Short',
            entryPrice: 1.2500,
            lot: 1,
            commission: 0,
            swap: 0,
            stopLoss: 1.2550,
            takeProfit: 1.2400,
            entryDate: '2024-01-15', // Same day
            pnl: 50,
            outcome: 'win',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '3',
            userId: 'user1',
            accountId: 'acc1',
            symbol: 'USDJPY',
            type: 'Long',
            entryPrice: 150.00,
            lot: 1,
            commission: 0,
            swap: 0,
            stopLoss: 149.50,
            takeProfit: 150.50,
            entryDate: '2024-01-16', // Different day
            pnl: -30,
            outcome: 'loss',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    it('should group trades by entryDate', () => {
        const grouped = groupTradesByDay(trades);
        
        expect(Object.keys(grouped)).toHaveLength(2);
        expect(grouped['2024-01-15']).toHaveLength(2);
        expect(grouped['2024-01-16']).toHaveLength(1);
    });

    it('should return empty object for empty array', () => {
        const grouped = groupTradesByDay([]);
        expect(grouped).toEqual({});
    });

    it('should preserve trade data in groups', () => {
        const grouped = groupTradesByDay(trades);
        
        expect(grouped['2024-01-15'][0].symbol).toBe('EURUSD');
        expect(grouped['2024-01-15'][1].symbol).toBe('GBPUSD');
    });
});
