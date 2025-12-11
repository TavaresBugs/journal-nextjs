import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    getJournalEntries, 
    saveJournalEntry, 
    deleteJournalEntry,
    mapJournalEntryFromDB 
} from '@/services/journal/journal';
import { supabase } from '@/lib/supabase';
import * as accountService from '@/services/core/account';
import { 
    mockUserId, 
    mockAccountId, 
    validJournalEntry, 
    minimalJournalEntry,
    dbJournalEntry, 
    multipleDbEntries 
} from '../../fixtures/journalEntry.fixtures';

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

describe('Journal Entry - CRUD Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);
    });

    // ============================================
    // getJournalEntries
    // ============================================
    describe('getJournalEntries', () => {
        it('deve retornar entradas de journal por accountId', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ 
                                data: multipleDbEntries, 
                                error: null 
                            })
                        })
                    })
                })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('entry-1');
            expect(result[0].accountId).toBe(mockAccountId);
            expect(supabase.from).toHaveBeenCalledWith('journal_entries');
        });

        it('deve retornar array vazio se usuário não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toEqual([]);
        });

        it('deve retornar array vazio em caso de erro', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ 
                                data: null, 
                                error: { message: 'Database error' } 
                            })
                        })
                    })
                })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toEqual([]);
        });

        it('deve retornar array vazio se data for null', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ 
                                data: null, 
                                error: null 
                            })
                        })
                    })
                })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await getJournalEntries(mockAccountId);

            expect(result).toEqual([]);
        });
    });

    // ============================================
    // saveJournalEntry
    // ============================================
    describe('saveJournalEntry', () => {
        it('deve salvar uma entrada com dados válidos', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await saveJournalEntry(validJournalEntry);

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('journal_entries');
        });

        it('deve salvar uma entrada com dados mínimos', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ error: null }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await saveJournalEntry(minimalJournalEntry);

            expect(result).toBe(true);
        });

        it('deve retornar false se usuário não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const result = await saveJournalEntry(validJournalEntry);

            expect(result).toBe(false);
        });

        it('deve retornar false em caso de erro no upsert', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ 
                    error: { message: 'Database error' } 
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await saveJournalEntry(validJournalEntry);

            expect(result).toBe(false);
        });
    });

    // ============================================
    // deleteJournalEntry
    // ============================================
    describe('deleteJournalEntry', () => {
        it('deve deletar uma entrada existente', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ 
                        data: [], // Sem imagens
                        error: null 
                    })
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(true);
        });

        it('deve deletar imagens do storage antes de deletar entrada', async () => {
            const mockImages = [{ path: 'user/image1.png' }, { path: 'user/image2.png' }];
            
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ 
                        data: mockImages, 
                        error: null 
                    })
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(true);
            expect(supabase.storage.from).toHaveBeenCalledWith('journal-images');
        });

        it('deve retornar false se usuário não autenticado', async () => {
            vi.mocked(accountService.getCurrentUserId).mockResolvedValue(null);

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(false);
        });

        it('deve retornar false em caso de erro', async () => {
            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null })
                }),
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ 
                            error: { message: 'Not found' } 
                        })
                    })
                }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(false);
        });
    });

    // ============================================
    // mapJournalEntryFromDB
    // ============================================
    describe('mapJournalEntryFromDB', () => {
        it('deve mapear corretamente do formato DB para App', () => {
            const result = mapJournalEntryFromDB(dbJournalEntry);

            expect(result.id).toBe('entry-1');
            expect(result.userId).toBe(mockUserId);
            expect(result.accountId).toBe(mockAccountId);
            expect(result.date).toBe('2025-12-11');
            expect(result.title).toBe('Dia de Trading');
            expect(result.emotion).toBe('confident');
            expect(result.tradeIds).toEqual([]);
            expect(result.images).toEqual([]);
        });

        it('deve mapear tradeIds corretamente de junction table', () => {
            const dbEntryWithTrades = {
                ...dbJournalEntry,
                journal_entry_trades: [
                    { trade_id: 'trade-1' },
                    { trade_id: 'trade-2' },
                ],
            };

            const result = mapJournalEntryFromDB(dbEntryWithTrades);

            expect(result.tradeIds).toEqual(['trade-1', 'trade-2']);
        });

        it('deve mapear tradeIds corretamente de legacy trade_id', () => {
            const dbEntryWithLegacyTrade = {
                ...dbJournalEntry,
                trade_id: 'legacy-trade-1',
                journal_entry_trades: undefined, // Must be undefined, not empty array
            };

            const result = mapJournalEntryFromDB(dbEntryWithLegacyTrade);

            expect(result.tradeIds).toEqual(['legacy-trade-1']);
        });

        it('deve mapear imagens corretamente', () => {
            const dbEntryWithImages = {
                ...dbJournalEntry,
                journal_images: [
                    {
                        id: 'img-1',
                        user_id: mockUserId,
                        journal_entry_id: 'entry-1',
                        url: 'https://example.com/chart.png',
                        path: 'test-path',
                        timeframe: 'H1',
                        display_order: 0,
                        created_at: '2025-12-11T10:00:00.000Z',
                    }
                ],
            };

            const result = mapJournalEntryFromDB(dbEntryWithImages);

            expect(result.images).toHaveLength(1);
            expect(result.images[0].timeframe).toBe('H1');
            expect(result.images[0].displayOrder).toBe(0);
        });
    });
});
