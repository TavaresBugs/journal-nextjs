import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAllData } from '../exportService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
    return {
        supabase: {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                range: vi.fn(),
            })),
        },
    };
});

describe('exportService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error if user is not authenticated', async () => {
        // Mock no user
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

        await expect(exportAllData()).rejects.toThrow('Usuário não autenticado');
    });

    it('should export all data correctly', async () => {
        // Mock user
        const mockUser = { id: 'user-123' };
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

        // Mock response data
        const mockAccounts = [{ id: 'acc-1', user_id: 'user-123', name: 'Test Account', initial_balance: 1000, current_balance: 1000 }];
        const mockTrades = [{ id: 'trade-1', user_id: 'user-123', symbol: 'EURUSD', entry_price: 1.1, lot: 1, entry_date: '2023-01-01' }];
        const mockJournal = [{ id: 'entry-1', user_id: 'user-123', title: 'Journal 1', date: '2023-01-01', images: [] }];
        const mockPlaybooks = [{ id: 'pb-1', user_id: 'user-123', name: 'Playbook 1' }];
        const mockRoutines = [{ id: 'routine-1', user_id: 'user-123', date: '2023-01-01', aerobic: true }];
        const mockSettings = { id: 'settings-1', user_id: 'user-123', currencies: ['USD'], created_at: '2023-01-01' };

        // Mock Supabase responses
        const fromMock = vi.fn((table: string) => {
            const selectMock = vi.fn().mockReturnThis();
            const eqMock = vi.fn().mockReturnThis();
            const singleMock = vi.fn();
            const rangeMock = vi.fn();

            // Setup return values based on table
            if (table === 'accounts') {
                eqMock.mockResolvedValue({ data: mockAccounts, error: null });
            } else if (table === 'trades') {
                rangeMock.mockResolvedValueOnce({ data: mockTrades, error: null })
                         .mockResolvedValue({ data: [], error: null }); // Second call empty to stop loop
                eqMock.mockReturnValue({ range: rangeMock });
            } else if (table === 'journal_entries') {
                eqMock.mockResolvedValue({ data: mockJournal, error: null });
            } else if (table === 'playbooks') {
                eqMock.mockResolvedValue({ data: mockPlaybooks, error: null });
            } else if (table === 'daily_routines') {
                eqMock.mockResolvedValue({ data: mockRoutines, error: null });
            } else if (table === 'settings') {
                singleMock.mockResolvedValue({ data: mockSettings, error: null });
                eqMock.mockReturnValue({ single: singleMock });
            }

            return {
                select: selectMock,
                eq: eqMock,
                range: rangeMock,
                single: singleMock
            };
        });

        (supabase.from as any).mockImplementation(fromMock);

        const result = await exportAllData();

        expect(result).toBeDefined();
        expect(result.version).toBe('1.0');
        expect(result.accounts).toHaveLength(1);
        expect(result.trades).toHaveLength(1);
        expect(result.journalEntries).toHaveLength(1);
        expect(result.playbooks).toHaveLength(1);
        expect(result.routines).toHaveLength(1);
        expect(result.settings).toBeDefined();
        expect(result.settings?.currencies).toEqual(['USD']);
    });
});
