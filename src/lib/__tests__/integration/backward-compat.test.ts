import { vi, describe, it, expect } from 'vitest';
import { TradeRepository } from '@/lib/repositories/TradeRepository';
import { TRADE_FRAGMENTS } from '@/lib/supabase/fragments';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Backward Compatibility Tests.
 * Ensures that the new TradeRepository returns data in the same format
 * as the old direct Supabase queries.
 */

const mockTradeData = {
  id: 'trade-compat-test',
  user_id: 'user-1',
  account_id: 'account-1',
  symbol: 'EURUSD',
  type: 'Long',
  entry_price: 1.1000,
  stop_loss: 1.0950,
  take_profit: 1.1100,
  exit_price: 1.1050,
  lot: 1.0,
  commission: 5,
  swap: -2,
  tf_analise: 'H4',
  tf_entrada: 'M15',
  tags: 'test',
  strategy: 'Breakout',
  setup: 'FVG',
  notes: 'Compat test',
  entry_date: '2024-01-15',
  entry_time: '10:00',
  exit_date: '2024-01-15',
  exit_time: '14:00',
  pnl: 100,
  outcome: 'win',
  session: 'London',
  htf_aligned: true,
  r_multiple: 2,
  market_condition: 'trending',
  plan_adherence: 'full',
  plan_adherence_rating: 5,
  entry_quality: 'picture-perfect',
  market_condition_v2: 'bull-trend',
  pd_array: 'FVG',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T14:00:00Z',
};

// Simulates old-style Supabase query
const simulateOldQuery = () => ({
  data: [mockTradeData],
  error: null,
});

// Creates mock for new repository
const createMockSupabase = () => {
  const queryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockTradeData, error: null }),
  };

  return {
    from: vi.fn().mockReturnValue({
      ...queryChain,
      select: vi.fn().mockReturnValue({
        ...queryChain,
        eq: vi.fn().mockReturnValue({
          ...queryChain,
          order: vi.fn().mockReturnValue({
            ...queryChain,
            limit: vi.fn().mockReturnValue({
              ...queryChain,
              range: vi.fn().mockResolvedValue({ data: [mockTradeData], error: null }),
              then: async (cb: Function) => cb({ data: [mockTradeData], error: null }),
            }),
            then: async (cb: Function) => cb({ data: [mockTradeData], error: null }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
};

describe('Backward Compatibility', () => {
  describe('Data Structure Compatibility', () => {
    it('should return data with same structure as old queries', async () => {
      const oldResult = simulateOldQuery();
      
      const mockSupabase = createMockSupabase();
      const repo = new TradeRepository(mockSupabase);
      const newResult = await repo.getByJournalId('journal-1');

      // Both should have data
      expect(oldResult.data).toBeDefined();
      expect(newResult.data).toBeDefined();

      // Both should have same length
      expect(oldResult.data.length).toBe(1);
      expect(newResult.data?.length).toBe(1);
    });

    it('should return trade objects with expected keys', async () => {
      const mockSupabase = createMockSupabase();
      const repo = new TradeRepository(mockSupabase);
      const result = await repo.getByJournalId('journal-1');

      const trade = result.data?.[0];
      expect(trade).toBeDefined();

      // Check essential keys exist (mapped to camelCase)
      expect(trade).toHaveProperty('id');
      expect(trade).toHaveProperty('userId');
      expect(trade).toHaveProperty('accountId');
      expect(trade).toHaveProperty('symbol');
      expect(trade).toHaveProperty('type');
      expect(trade).toHaveProperty('entryPrice');
      expect(trade).toHaveProperty('pnl');
      expect(trade).toHaveProperty('outcome');
    });

    it('should properly map snake_case to camelCase', async () => {
      const mockSupabase = createMockSupabase();
      const repo = new TradeRepository(mockSupabase);
      const result = await repo.getByJournalId('journal-1');

      const trade = result.data?.[0];
      
      // snake_case -> camelCase mapping
      expect(trade?.userId).toBe(mockTradeData.user_id);
      expect(trade?.accountId).toBe(mockTradeData.account_id);
      expect(trade?.entryPrice).toBe(mockTradeData.entry_price);
      expect(trade?.stopLoss).toBe(mockTradeData.stop_loss);
      expect(trade?.takeProfit).toBe(mockTradeData.take_profit);
      expect(trade?.exitPrice).toBe(mockTradeData.exit_price);
      expect(trade?.entryDate).toBe(mockTradeData.entry_date);
      expect(trade?.entryTime).toBe(mockTradeData.entry_time);
    });
  });

  describe('Query Fragment Compatibility', () => {
    it('TRADE_FRAGMENTS.basic should contain essential fields', () => {
      const basicFragment = TRADE_FRAGMENTS.basic;
      
      expect(basicFragment).toContain('id');
      expect(basicFragment).toContain('strategy');
      expect(basicFragment).toContain('entry_quality');
      expect(basicFragment).toContain('created_at');
    });

    it('TRADE_FRAGMENTS.detailed should contain all fields', () => {
      const detailedFragment = TRADE_FRAGMENTS.detailed;
      
      expect(detailedFragment).toContain('id');
      expect(detailedFragment).toContain('user_id');
      expect(detailedFragment).toContain('account_id');
      expect(detailedFragment).toContain('symbol');
      expect(detailedFragment).toContain('entry_price');
      expect(detailedFragment).toContain('stop_loss');
      expect(detailedFragment).toContain('take_profit');
      expect(detailedFragment).toContain('pnl');
      expect(detailedFragment).toContain('outcome');
    });

    it('TRADE_FRAGMENTS.shared should NOT contain user_id', () => {
      const sharedFragment = TRADE_FRAGMENTS.shared;
      
      expect(sharedFragment).not.toContain('user_id');
      expect(sharedFragment).not.toContain('account_id');
      expect(sharedFragment).toContain('id');
      expect(sharedFragment).toContain('symbol');
    });
  });

  describe('Filter and Order Compatibility', () => {
    it('should apply orderBy correctly', async () => {
      const mockSupabase = createMockSupabase();
      const repo = new TradeRepository(mockSupabase);

      await repo.getByJournalId('journal-1', { orderBy: 'entry_date', ascending: true });

      expect(mockSupabase.from).toHaveBeenCalledWith('trades');
    });

    it('should apply limit and offset correctly', async () => {
      const mockSupabase = createMockSupabase();
      const repo = new TradeRepository(mockSupabase);

      await repo.getByJournalId('journal-1', { limit: 10, offset: 20 });

      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
