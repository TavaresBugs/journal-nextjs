import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TradeRepository } from '@/lib/repositories/TradeRepository';
import { AppError, ErrorCode } from '@/lib/errors';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock types
const mockSupabase = {
    from: vi.fn(),
} as unknown as SupabaseClient;

describe('TradeRepository', () => {
    let repo: TradeRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new TradeRepository(mockSupabase);
    });

    describe('getByIdDomain', () => {
        it('should return trade if found', async () => {
            const mockTrade = { id: 't1', user_id: 'u1' };
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTrade, error: null }),
            };
            (mockSupabase.from as any).mockReturnValue(queryBuilder);

            const result = await repo.getByIdDomain('t1');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('t1');
        });

        it('should perform ownership check if userId provided', async () => {
            const mockTrade = { id: 't1', user_id: 'u1' };
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTrade, error: null }),
            };
            (mockSupabase.from as any).mockReturnValue(queryBuilder);

            const result = await repo.getByIdDomain('t1', 'u1');

            expect(result.error).toBeNull();
            expect(result.data?.id).toBe('t1');
        });

        it('should return error if ownership check fails', async () => {
            const mockTrade = { id: 't1', user_id: 'u1' };
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockTrade, error: null }),
            };
            (mockSupabase.from as any).mockReturnValue(queryBuilder);

            const result = await repo.getByIdDomain('t1', 'u2');

            expect(result.error).toBeInstanceOf(AppError);
            expect(result.error?.code).toBe(ErrorCode.AUTH_FORBIDDEN);
            expect(result.data).toBeNull();
        });
    });

    describe('getByJournalId', () => {
        it('should fetch trades via junction table join', async () => {
            const mockTrades = [{ id: 't1', user_id: 'u1' }];

            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                range: vi.fn().mockImplementation(async () => ({ data: mockTrades, error: null })),
                then: vi.fn().mockImplementation(async (cb) => cb({ data: mockTrades, error: null })),
            };
            (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(queryBuilder);

            const result = await repo.getByJournalId('j1');

            // Query now starts from 'trades' table with JOIN to junction table
            expect(mockSupabase.from).toHaveBeenCalledWith('trades');
            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
            expect(result.data![0].id).toBe('t1');
        });
    });
});
