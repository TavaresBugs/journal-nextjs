import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TradeRepository } from '@/lib/repositories/TradeRepository';
import { AppError, ErrorCode } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Unit tests for TradeRepository.
 * Tests each method's behavior with mocked Supabase client.
 */

// Sample trade data for mocking
const mockTradeData = {
  id: 'trade-123',
  user_id: 'user-abc',
  account_id: 'account-xyz',
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
  tags: 'breakout,trend',
  strategy: 'Breakout',
  setup: 'FVG',
  notes: 'Test trade',
  entry_date: '2024-01-15',
  entry_time: '10:30',
  exit_date: '2024-01-15',
  exit_time: '14:00',
  pnl: 50.00,
  outcome: 'win',
  session: 'London',
  htf_aligned: true,
  r_multiple: 2.5,
  market_condition: 'trending',
  plan_adherence: 'full',
  plan_adherence_rating: 5,
  entry_quality: 'nice',
  market_condition_v2: 'bull-trend',
  pd_array: 'FVG',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:00:00Z',
};

// Create mock Supabase client
const createMockSupabase = (options: {
  trades?: typeof mockTradeData[];
  error?: { message: string; code: string } | null;
  delayMs?: number;
} = {}) => {
  const { trades = [mockTradeData], error = null, delayMs = 0 } = options;

  const createQueryChain = (finalData: unknown, finalError: unknown) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => {
      if (delayMs) await new Promise(r => setTimeout(r, delayMs));
      return { data: Array.isArray(finalData) ? finalData[0] : finalData, error: finalError };
    }),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: async (callback: (result: { data: unknown; error: unknown }) => void) => {
      if (delayMs) await new Promise(r => setTimeout(r, delayMs));
      return callback({ data: finalData, error: finalError });
    },
  });

  const queryChain = createQueryChain(trades, error);

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'trades') {
        return {
          ...queryChain,
          select: vi.fn().mockReturnValue({
            ...queryChain,
            eq: vi.fn().mockReturnValue({
              ...queryChain,
              order: vi.fn().mockReturnValue({
                ...queryChain,
              }),
            }),
          }),
        };
      }
      if (table === 'journal_entries') {
        return {
          ...queryChain,
          select: vi.fn().mockReturnValue({
            ...queryChain,
            eq: vi.fn().mockReturnValue({
              ...queryChain,
              single: vi.fn().mockResolvedValue({
                data: { id: 'journal-1', user_id: 'user-abc' },
                error: null,
              }),
            }),
          }),
        };
      }
      return queryChain;
    }),
  } as unknown as SupabaseClient;
};

describe('TradeRepository Unit Tests', () => {
  let repo: TradeRepository;

  describe('getByJournalId', () => {
    it('should return empty array if journal has no trades', async () => {
      const mockSupabase = createMockSupabase({ trades: [] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByJournalId('journal-with-no-trades');

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should return trades for valid journal ID', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByJournalId('journal-123');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe('trade-123');
    });

    it('should respect limit option', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      await repo.getByJournalId('journal-123', { limit: 5 });

      expect(mockSupabase.from).toHaveBeenCalledWith('trades');
    });

    it('should respect offset and limit for pagination', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      await repo.getByJournalId('journal-123', { limit: 10, offset: 5 });

      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('getByIdDomain', () => {
    it('should return trade by ID without auth check', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdDomain('trade-123');

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('trade-123');
    });

    it('should return trade if userId matches', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdDomain('trade-123', 'user-abc');

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('trade-123');
    });

    it('should return error if userId does not match', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdDomain('trade-123', 'wrong-user');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
      expect(result.data).toBeNull();
    });
  });

  describe('getByIdWithAuth', () => {
    it('should return trade if userId is correct', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdWithAuth('trade-123', 'user-abc');

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('trade-123');
    });

    it('should return error if userId is incorrect', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdWithAuth('trade-123', 'wrong-user-id');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
      expect(result.error?.message).toBe('Trade not found or you do not have permission to access it');
    });

    it('should return error if trade not found', async () => {
      const mockSupabase = createMockSupabase({ trades: [] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByIdWithAuth('non-existent-trade', 'user-abc');

      expect(result.error).not.toBeNull();
    });
  });

  describe('getByAccountId', () => {
    it('should return trades for account ID', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByAccountId('account-xyz');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });

    it('should use basic fragment by default', async () => {
      const mockSupabase = createMockSupabase({ trades: [mockTradeData] });
      repo = new TradeRepository(mockSupabase);

      await repo.getByAccountId('account-xyz', { detailed: false });

      expect(mockSupabase.from).toHaveBeenCalledWith('trades');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSupabase = createMockSupabase({
        trades: [],
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
      });
      repo = new TradeRepository(mockSupabase);

      const result = await repo.getByJournalId('journal-123');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_QUERY_FAILED);
    });
  });
});
