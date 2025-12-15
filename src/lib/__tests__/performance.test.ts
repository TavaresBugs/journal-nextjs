import { vi, describe, it, expect } from 'vitest';
import { TradeRepository } from '@/lib/repositories/TradeRepository';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Performance benchmarks for TradeRepository.
 * These tests verify that query optimizations are effective.
 */

// Mock Supabase client that simulates realistic response times
const createMockSupabase = (responseTimeMs: number = 50, dataCount: number = 100) => {
  const mockTrades = Array.from({ length: dataCount }, (_, i) => ({
    id: `trade-${i}`,
    user_id: 'user-1',
    account_id: 'account-1',
    symbol: 'EURUSD',
    type: 'Long',
    entry_price: 1.1000,
    stop_loss: 1.0950,
    take_profit: 1.1100,
    exit_price: 1.1050,
    lot: 1.0,
    entry_date: '2024-01-01',
    entry_time: '10:00',
    pnl: 50,
    outcome: 'win',
    strategy: 'Breakout',
    entry_quality: 'nice',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, responseTimeMs));
      return { data: mockTrades[0], error: null };
    }),
    then: vi.fn().mockImplementation(async (callback) => {
      await new Promise(resolve => setTimeout(resolve, responseTimeMs));
      return callback({ data: mockTrades, error: null });
    }),
  };

  // Make the query builder thenable
  Object.defineProperty(mockQueryBuilder, Symbol.iterator, {
    value: async function* () {
      await new Promise(resolve => setTimeout(resolve, responseTimeMs));
      yield* mockTrades;
    }
  });

  return {
    from: vi.fn().mockReturnValue({
      ...mockQueryBuilder,
      select: vi.fn().mockImplementation(() => ({
        ...mockQueryBuilder,
        eq: vi.fn().mockImplementation(() => ({
          ...mockQueryBuilder,
          order: vi.fn().mockImplementation(() => ({
            ...mockQueryBuilder,
            limit: vi.fn().mockImplementation(() => ({
              ...mockQueryBuilder,
              range: vi.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, responseTimeMs));
                return { data: mockTrades, error: null };
              }),
              then: vi.fn().mockImplementation(async (callback) => {
                await new Promise(resolve => setTimeout(resolve, responseTimeMs));
                return callback({ data: mockTrades, error: null });
              }),
            })),
            then: vi.fn().mockImplementation(async (callback) => {
              await new Promise(resolve => setTimeout(resolve, responseTimeMs));
              return callback({ data: mockTrades, error: null });
            }),
          })),
        })),
      })),
    }),
  } as unknown as SupabaseClient;
};

describe('TradeRepository Performance', () => {
  describe('Query Performance Benchmarks', () => {
    it('should fetch 100 trades with basic fragment in less than 500ms', async () => {
      const mockSupabase = createMockSupabase(50, 100);
      const repo = new TradeRepository(mockSupabase);

      const startTime = performance.now();
      await repo.getByJournalId('journal-1', { detailed: false, limit: 100 });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should fetch trades with pagination in less than 300ms', async () => {
      const mockSupabase = createMockSupabase(30, 50);
      const repo = new TradeRepository(mockSupabase);

      const startTime = performance.now();
      await repo.getByJournalId('journal-1', { 
        detailed: false, 
        limit: 10, 
        offset: 0 
      });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('should handle detailed fragments without significant performance degradation', async () => {
      const mockSupabase = createMockSupabase(50, 50);
      const repo = new TradeRepository(mockSupabase);

      // Basic fragment
      const basicStart = performance.now();
      await repo.getByJournalId('journal-1', { detailed: false });
      const basicDuration = performance.now() - basicStart;

      // Detailed fragment
      const detailedStart = performance.now();
      await repo.getByJournalId('journal-1', { detailed: true });
      const detailedDuration = performance.now() - detailedStart;

      // Detailed should not be more than 2x slower than basic
      expect(detailedDuration).toBeLessThan(basicDuration * 2 + 100);
    });

    it('should return results in acceptable time for getByIdDomain', async () => {
      const mockSupabase = createMockSupabase(20, 1);
      const repo = new TradeRepository(mockSupabase);

      const startTime = performance.now();
      await repo.getByIdDomain('trade-1');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200);
    });
  });
});
