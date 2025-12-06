import { describe, it, expect } from 'vitest';
import {
  calculateTradePnL,
  determineTradeOutcome,
  filterTrades,
  calculateTradeMetrics,
  calculateTradeDuration,
  formatDuration,
  formatCurrency,
  formatPercentage,
  calculateSharpeRatio,
  calculateCalmarRatio,
  calculateAverageHoldTime,
  calculateConsecutiveStreaks,
  formatTimeMinutes
} from '../calculations';
import { Trade } from '@/types';

// Mock generic trade data
const mockTrade: Trade = {
  id: '1',
  accountId: 'acc1',
  symbol: 'EURUSD',
  type: 'Long',
  entryPrice: 1.1000,
  exitPrice: 1.1050,
  lot: 1,
  entryDate: '2023-01-01',
  entryTime: '10:00',
  exitDate: '2023-01-01',
  exitTime: '12:00',
  status: 'closed',
  pnl: 50,
  outcome: 'win',
  notes: '',
  images: [],
  tags: [],
  created_at: '2023-01-01T10:00:00Z',
  user_id: 'user1'
};

describe('calculations.ts', () => {
  describe('calculateTradePnL', () => {
    it('should calculate PnL for Long trade (Win)', () => {
      const trade = { ...mockTrade, type: 'Long', entryPrice: 100, exitPrice: 110, lot: 1 };
      // (110 - 100) * 1 = 10
      expect(calculateTradePnL(trade as Trade)).toBe(10);
    });

    it('should calculate PnL for Long trade (Loss)', () => {
      const trade = { ...mockTrade, type: 'Long', entryPrice: 100, exitPrice: 90, lot: 1 };
      // (90 - 100) * 1 = -10
      expect(calculateTradePnL(trade as Trade)).toBe(-10);
    });

    it('should calculate PnL for Short trade (Win)', () => {
      const trade = { ...mockTrade, type: 'Short', entryPrice: 100, exitPrice: 90, lot: 1 };
      // (100 - 90) * 1 = 10
      expect(calculateTradePnL(trade as Trade)).toBe(10);
    });

    it('should calculate PnL for Short trade (Loss)', () => {
      const trade = { ...mockTrade, type: 'Short', entryPrice: 100, exitPrice: 110, lot: 1 };
      // (100 - 110) * 1 = -10
      expect(calculateTradePnL(trade as Trade)).toBe(-10);
    });

    it('should return 0 if exitPrice is missing', () => {
        const trade = { ...mockTrade, exitPrice: undefined };
        expect(calculateTradePnL(trade as Trade)).toBe(0);
    });

    it('should apply asset multiplier', () => {
        const trade = { ...mockTrade, type: 'Long', entryPrice: 100, exitPrice: 110, lot: 1 };
        // (10 - 0) * 1 * 10 = 100
        expect(calculateTradePnL(trade as Trade, 10)).toBe(100);
    });
  });

  describe('determineTradeOutcome', () => {
    it('should return "win" for positive PnL', () => {
      const trade = { ...mockTrade, pnl: 10, exitPrice: 1.1050 };
      expect(determineTradeOutcome(trade as Trade)).toBe('win');
    });

    it('should return "loss" for negative PnL', () => {
      const trade = { ...mockTrade, pnl: -10, exitPrice: 1.0950 };
      expect(determineTradeOutcome(trade as Trade)).toBe('loss');
    });

    it('should return "breakeven" for zero PnL', () => {
      const trade = { ...mockTrade, pnl: 0, exitPrice: 1.1000 };
      expect(determineTradeOutcome(trade as Trade)).toBe('breakeven');
    });

    it('should return "pending" if exitPrice is missing', () => {
        const trade = { ...mockTrade, exitPrice: undefined };
        expect(determineTradeOutcome(trade as Trade)).toBe('pending');
    });
  });

  describe('filterTrades', () => {
      const trades = [
          { ...mockTrade, id: '1', symbol: 'EURUSD', type: 'Long', outcome: 'win' },
          { ...mockTrade, id: '2', symbol: 'GBPUSD', type: 'Short', outcome: 'loss' },
          { ...mockTrade, id: '3', symbol: 'EURUSD', type: 'Long', outcome: 'breakeven' },
      ] as Trade[];

      it('should filter by symbol', () => {
          const result = filterTrades(trades, { symbol: 'EURUSD' });
          expect(result).toHaveLength(2);
          expect(result[0].id).toBe('1');
          expect(result[1].id).toBe('3');
      });

      it('should filter by type', () => {
          const result = filterTrades(trades, { type: 'Short' });
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('2');
      });

      it('should filter by outcome', () => {
          const result = filterTrades(trades, { outcome: 'win' });
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('1');
      });
  });

  describe('calculateTradeMetrics', () => {
      const trades = [
          { ...mockTrade, outcome: 'win', pnl: 100 },
          { ...mockTrade, outcome: 'loss', pnl: -50 },
          { ...mockTrade, outcome: 'win', pnl: 150 },
          { ...mockTrade, outcome: 'breakeven', pnl: 0 },
      ] as Trade[];

      it('should calculate basic metrics correctly', () => {
          const metrics = calculateTradeMetrics(trades);
          expect(metrics.totalTrades).toBe(4);
          expect(metrics.wins).toBe(2);
          expect(metrics.losses).toBe(1);
          expect(metrics.breakeven).toBe(1);
          expect(metrics.totalPnL).toBe(200);
      });

      it('should calculate win rate correctly', () => {
          const metrics = calculateTradeMetrics(trades);
          // 2 wins out of 3 decisive trades? No, formula is wins / (wins + losses) * 100
          // 2 / (2 + 1) = 2/3 = 66.666...
          expect(metrics.winRate).toBeCloseTo(66.67, 1);
      });

      it('should calculate averages', () => {
          const metrics = calculateTradeMetrics(trades);
          expect(metrics.avgWin).toBe(125); // (100 + 150) / 2
          expect(metrics.avgLoss).toBe(50); // abs(-50) / 1
      });

      it('should calculate profit factor', () => {
          const metrics = calculateTradeMetrics(trades);
          // (125 * 2) / (50 * 1) = 250 / 50 = 5
          expect(metrics.profitFactor).toBe(5);
      });
  });

  describe('calculateTradeDuration', () => {
      it('should calculate duration in minutes', () => {
          const trade = {
              ...mockTrade,
              entryDate: '2023-01-01', entryTime: '10:00',
              exitDate: '2023-01-01', exitTime: '12:30'
          } as Trade;
          // 2h 30m = 150 minutes
          expect(calculateTradeDuration(trade)).toBe(150);
      });

       it('should handle across days', () => {
          const trade = {
              ...mockTrade,
              entryDate: '2023-01-01', entryTime: '23:00',
              exitDate: '2023-01-02', exitTime: '01:00'
          } as Trade;
          // 2 hours = 120 minutes
          expect(calculateTradeDuration(trade)).toBe(120);
      });
  });

  describe('formatDuration', () => {
      it('should format minutes correctly', () => {
          expect(formatDuration(45)).toBe('45m');
      });
      it('should format hours and minutes correctly', () => {
          expect(formatDuration(150)).toBe('2h 30m');
      });
      it('should format days and hours correctly', () => {
          expect(formatDuration(1500)).toBe('1d 1h'); // 24*60 = 1440. 1500-1440 = 60m = 1h
      });
  });

  describe('formatCurrency', () => {
      it('should format USD correctly', () => {
          // Note: Intl.NumberFormat might behave slightly differently in Node vs Browser environments regarding spaces (NBSP)
          // We can use replace to normalize spaces if needed, but let's try strict first
          const formatted = formatCurrency(1234.56, 'USD');
          expect(formatted).toContain('US$');
          expect(formatted).toContain('1.234,56'); // pt-BR locale
      });
  });

  describe('Advanced Metrics', () => {
    const advancedTrades = [
        { ...mockTrade, entryDate: '2023-01-01', outcome: 'win', pnl: 100 },
        { ...mockTrade, entryDate: '2023-01-02', outcome: 'loss', pnl: -50 },
        { ...mockTrade, entryDate: '2023-01-03', outcome: 'win', pnl: 200 },
    ] as Trade[];

    it('calculateSharpeRatio should return a number', () => {
        const sharpe = calculateSharpeRatio(advancedTrades);
        expect(typeof sharpe).toBe('number');
    });

    it('calculateConsecutiveStreaks should identify streaks', () => {
        const streakTrades = [
            { ...mockTrade, entryDate: '2023-01-01', outcome: 'win' },
            { ...mockTrade, entryDate: '2023-01-02', outcome: 'win' },
            { ...mockTrade, entryDate: '2023-01-03', outcome: 'loss' },
            { ...mockTrade, entryDate: '2023-01-04', outcome: 'win' },
        ] as Trade[];

        const streaks = calculateConsecutiveStreaks(streakTrades);
        expect(streaks.maxWinStreak).toBe(2);
        expect(streaks.maxLossStreak).toBe(1);
        expect(streaks.currentStreak.type).toBe('win');
        expect(streaks.currentStreak.count).toBe(1);
    });
  });
});
