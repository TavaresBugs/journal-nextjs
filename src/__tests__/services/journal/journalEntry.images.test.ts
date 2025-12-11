import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveJournalEntry, deleteJournalEntry } from '@/services/journal/journal';
import { supabase } from '@/lib/supabase';
import * as accountService from '@/services/core/account';
import { 
    mockUserId, 
    mockAccountId, 
    journalEntryWithImages 
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

describe('Journal Entry - Images', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(accountService.getCurrentUserId).mockResolvedValue(mockUserId);
    });

    describe('saveJournalEntry with images', () => {
        it('deve salvar entrada com imagens existentes (URLs)', async () => {
            const mockDelete = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            });
            const mockInsert = vi.fn().mockResolvedValue({ error: null });

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_entries') {
                    return {
                        upsert: vi.fn().mockResolvedValue({ error: null }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_images') {
                    return {
                        delete: mockDelete,
                        insert: mockInsert,
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entry_trades') {
                    return {
                        delete: mockDelete,
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            const result = await saveJournalEntry(journalEntryWithImages);

            expect(result).toBe(true);
        });

        it('deve deletar imagens antigas antes de inserir novas', async () => {
            const mockDelete = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_entries') {
                    return {
                        upsert: vi.fn().mockResolvedValue({ error: null }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_images') {
                    return {
                        delete: mockDelete,
                        insert: vi.fn().mockResolvedValue({ error: null }),
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entry_trades') {
                    return {
                        delete: mockDelete,
                        insert: vi.fn().mockResolvedValue({ error: null }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            await saveJournalEntry(journalEntryWithImages);

            expect(mockDelete).toHaveBeenCalled();
        });

        it('deve continuar salvando mesmo se insert de imagens falhar', async () => {
            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_entries') {
                    return {
                        upsert: vi.fn().mockResolvedValue({ error: null }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_images') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null })
                        }),
                        insert: vi.fn().mockResolvedValue({ 
                            error: { message: 'Insert failed' } 
                        }),
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entry_trades') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            // Não deve throw
            const result = await saveJournalEntry(journalEntryWithImages);
            expect(result).toBe(true);
        });
    });

    describe('deleteJournalEntry with images', () => {
        it('deve deletar imagens do storage ao deletar entrada', async () => {
            const mockImages = [
                { path: 'user/2025/12/11/image1.png' }, 
                { path: 'user/2025/12/11/image2.png' }
            ];
            const mockStorageRemove = vi.fn().mockResolvedValue({ error: null });
            
            vi.mocked(supabase.storage.from).mockReturnValue({
                upload: vi.fn(),
                getPublicUrl: vi.fn(),
                remove: mockStorageRemove,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_images') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ 
                                data: mockImages, 
                                error: null 
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entries') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockResolvedValue({ error: null })
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            const result = await deleteJournalEntry('entry-1');

            expect(result).toBe(true);
            expect(mockStorageRemove).toHaveBeenCalledWith([
                'user/2025/12/11/image1.png',
                'user/2025/12/11/image2.png'
            ]);
        });

        it('deve continuar deletando entrada mesmo se storage falhar', async () => {
            const mockStorageRemove = vi.fn().mockResolvedValue({ 
                error: { message: 'Storage error' } 
            });
            
            vi.mocked(supabase.storage.from).mockReturnValue({
                upload: vi.fn(),
                getPublicUrl: vi.fn(),
                remove: mockStorageRemove,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_images') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ 
                                data: [{ path: 'test.png' }], 
                                error: null 
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entries') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockResolvedValue({ error: null })
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            const result = await deleteJournalEntry('entry-1');

            // Deve retornar true mesmo com erro de storage
            expect(result).toBe(true);
        });

        it('não deve chamar storage.remove se não houver imagens', async () => {
            const mockStorageRemove = vi.fn();
            
            vi.mocked(supabase.storage.from).mockReturnValue({
                upload: vi.fn(),
                getPublicUrl: vi.fn(),
                remove: mockStorageRemove,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'journal_images') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ 
                                data: [], // Sem imagens
                                error: null 
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                if (table === 'journal_entries') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockResolvedValue({ error: null })
                            })
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return {} as any;
            });

            await deleteJournalEntry('entry-1');

            expect(mockStorageRemove).not.toHaveBeenCalled();
        });
    });
});
