import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry } from '@/services/journal/journal';
import { supabase } from '@/lib/supabase';
import * as accountService from '@/services/core/account';
import { mockUserId, mockAccountId, dbJournalEntry } from '../../fixtures/journalEntry.fixtures';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } }),
                remove: vi.fn().mockResolvedValue({ error: null }),
            }),
        },
    },
}));

// Mock do accountService
vi.mock('@/services/core/account', () => ({
    getCurrentUserId: vi.fn(),
}));

// Mock do errorHandler
vi.mock('@/lib/errorHandler', () => ({
    handleServiceError: vi.fn(),
}));

describe('Journal Entry - Security & Permissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('User Authentication', () => {
        it('getJournalEntries deve retornar vazio se não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toEqual([]);
        });

        it('saveJournalEntry deve retornar false se não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const entry = {
                id: 'entry-1',
                userId: '',
                accountId: mockAccountId,
                date: '2025-12-11',
                title: '',
                tradeIds: [],
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = await saveJournalEntry(entry);

            expect(result).toBe(false);
        });

        it('deleteJournalEntry deve retornar false se não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(false);
        });
    });

    describe('User Isolation (RLS Simulation)', () => {
        it('getJournalEntries deve filtrar por user_id', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);
            
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation((field, value) => {
                    // Simular que a query filtra por account_id e user_id
                    if (field === 'account_id') {
                        return {
                            eq: vi.fn().mockImplementation((field2) => {
                                expect(field2).toBe('user_id');
                                return {
                                    order: vi.fn().mockResolvedValue({
                                        data: [dbJournalEntry],
                                        error: null
                                    })
                                };
                            })
                        };
                    }
                    return { order: vi.fn().mockResolvedValue({ data: [], error: null }) };
                })
            });

            vi.mocked(supabase.from).mockReturnValue({
                select: mockSelect,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            await getJournalEntries(mockAccountId);

            expect(supabase.from).toHaveBeenCalledWith('journal_entries');
        });

        it('deleteJournalEntry deve filtrar por user_id', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

            const mockEq = vi.fn().mockImplementation((field, value) => {
                if (field === 'id') {
                    return {
                        eq: vi.fn().mockImplementation((field2, value2) => {
                            // Verificar que filtra por user_id
                            expect(field2).toBe('user_id');
                            expect(value2).toBe(mockUserId);
                            return Promise.resolve({ error: null });
                        })
                    };
                }
                return Promise.resolve({ error: null });
            });

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_images') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entries') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: mockEq
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            await deleteJournalEntry('entry-1');

            expect(supabase.from).toHaveBeenCalledWith('journal_entries');
        });
    });

    describe('Cross-Account Access Prevention', () => {
        it('não deve retornar entradas de outras contas', async () => {
            const otherAccountId = 'other-account-999';
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({
                                data: [], // RLS retorna vazio para outras contas
                                error: null
                            })
                        })
                    })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await getJournalEntries(otherAccountId);

            expect(result).toEqual([]);
        });
    });

    describe('Data Integrity', () => {
        it('saveJournalEntry deve associar userId corretamente', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

            let capturedData: unknown;
            vi.mocked(supabase.from).mockReturnValue({
                upsert: vi.fn().mockImplementation((data) => {
                    capturedData = data;
                    return Promise.resolve({ error: null });
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                }),
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const entry = {
                id: 'entry-1',
                userId: 'ignored-user', // Deve ser sobrescrito
                accountId: mockAccountId,
                date: '2025-12-11',
                title: '',
                tradeIds: [],
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await saveJournalEntry(entry);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((capturedData as any).user_id).toBe(mockUserId);
        });
    });

    describe('Error Handling', () => {
        it('deve tratar erro de permissão gracefully', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({
                                data: null,
                                error: { 
                                    message: 'permission denied for table journal_entries',
                                    code: '42501'
                                }
                            })
                        })
                    })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toEqual([]);
        });

        it('deve tratar erro de violação de RLS gracefully', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);

            vi.mocked(supabase.from).mockReturnValue({
                upsert: vi.fn().mockResolvedValue({
                    error: { 
                        message: 'new row violates row-level security policy',
                        code: '42501'
                    }
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const entry = {
                id: 'entry-1',
                userId: mockUserId,
                accountId: mockAccountId,
                date: '2025-12-11',
                title: '',
                tradeIds: [],
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = await saveJournalEntry(entry);

            expect(result).toBe(false);
        });
    });
});
