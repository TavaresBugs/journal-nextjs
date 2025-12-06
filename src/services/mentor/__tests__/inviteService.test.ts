import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Use vi.hoisted to ensure the mock is created before vi.mock calls and imports
const { queryMock } = vi.hoisted(() => {
    // Define explicit mock structure using Mock type
    type MockSupabaseClient = {
        select: Mock;
        insert: Mock;
        update: Mock;
        delete: Mock;
        eq: Mock;
        order: Mock;
        single: Mock;
        maybeSingle: Mock;
        limit: Mock;
        gt: Mock;
        then?: unknown;
    };

    // Helper to create a chainable mock object
    const createSupabaseMock = () => {
        const mockData = {
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            order: vi.fn(),
            single: vi.fn(),
            maybeSingle: vi.fn(),
            limit: vi.fn(),
            gt: vi.fn(),
        } as unknown as MockSupabaseClient;

        // Chain methods return the mockData itself to allow chaining
        mockData.select.mockReturnValue(mockData);
        mockData.insert.mockReturnValue(mockData);
        mockData.update.mockReturnValue(mockData);
        mockData.delete.mockReturnValue(mockData);
        mockData.eq.mockReturnValue(mockData);
        mockData.order.mockReturnValue(mockData);
        mockData.limit.mockReturnValue(mockData);
        mockData.gt.mockReturnValue(mockData);

        // Terminal methods that are awaited directly (like single/maybeSingle) return promises
        mockData.single.mockResolvedValue({ data: null, error: null });
        mockData.maybeSingle.mockResolvedValue({ data: null, error: null });

        return mockData;
    };

    return { queryMock: createSupabaseMock() };
});

vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => queryMock),
      auth: {
        getUser: vi.fn(),
      },
    },
  };
});

// Imports must be after mock setup
import * as mentorService from '../inviteService';
import { supabase } from '@/lib/supabase';

describe('MentorService', () => {
    const mockUser = { id: 'user-123', email: 'mentor@example.com' };

    // Helper to set the 'then' behavior of the chain
    const setQueryReturn = (data: unknown, error: unknown = null) => {
        // We cast to any here just for the dynamic 'then' property which isn't on the MockSupabaseClient type officially but needed for await emulation
        // This is safe in tests
        (queryMock as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void }).then = (resolve: (value: { data: unknown; error: unknown }) => void) => resolve({ data, error });
    };

    const setQueryError = (error: unknown) => {
        (queryMock as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void }).then = (resolve: (value: { data: unknown; error: unknown }) => void) => resolve({ data: null, error });
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset chain behaviors
        queryMock.select.mockReturnValue(queryMock);
        queryMock.insert.mockReturnValue(queryMock);
        queryMock.update.mockReturnValue(queryMock);
        queryMock.delete.mockReturnValue(queryMock);
        queryMock.eq.mockReturnValue(queryMock);
        queryMock.order.mockReturnValue(queryMock);
        queryMock.limit.mockReturnValue(queryMock);
        queryMock.gt.mockReturnValue(queryMock);

        queryMock.single.mockResolvedValue({ data: null, error: null });
        queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });

        setQueryReturn([]);

        (supabase.from as unknown as Mock).mockImplementation(() => queryMock);
    });

    const setupAuth = (user = mockUser) => {
        (supabase.auth.getUser as unknown as Mock).mockResolvedValue({
            data: { user },
            error: null,
        });
    };

    const setupAuthError = () => {
        (supabase.auth.getUser as unknown as Mock).mockResolvedValue({
            data: { user: null },
            error: new Error('Auth error'),
        });
    };

    // ==========================================
    // inviteMentee
    // ==========================================
    describe('inviteMentee', () => {
        it('should create an invite successfully', async () => {
            setupAuth();
            queryMock.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const newInvite = {
                id: 'invite-1',
                mentor_id: mockUser.id,
                mentee_email: 'mentee@example.com',
                created_at: new Date().toISOString()
            };
            queryMock.single.mockResolvedValueOnce({ data: newInvite, error: null });

            const result = await mentorService.inviteMentee('mentee@example.com');

            expect(result).toEqual(expect.objectContaining({ id: 'invite-1' }));
            expect(supabase.from).toHaveBeenCalledWith('mentor_invites');
            expect(queryMock.insert).toHaveBeenCalled();
        });

        it('should return existing invite if pending exists', async () => {
            setupAuth();
            const existingInvite = {
                id: 'invite-existing',
                mentor_id: mockUser.id,
                status: 'pending'
            };
            queryMock.maybeSingle.mockResolvedValueOnce({ data: existingInvite, error: null });

            const result = await mentorService.inviteMentee('mentee@example.com');

            expect(result).toEqual(expect.objectContaining({ id: 'invite-existing' }));
            expect(queryMock.insert).not.toHaveBeenCalled();
        });

        it('should return null if not authenticated', async () => {
            setupAuthError();
            const result = await mentorService.inviteMentee('mentee@example.com');
            expect(result).toBeNull();
        });

        it('should return null on supabase error', async () => {
            setupAuth();
            queryMock.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            queryMock.single.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

            const result = await mentorService.inviteMentee('mentee@example.com');
            expect(result).toBeNull();
        });
    });

    // ==========================================
    // getSentInvites
    // ==========================================
    describe('getSentInvites', () => {
        it('should return list of invites', async () => {
            setupAuth();
            const invites = [{ id: '1', mentor_id: mockUser.id }];
            setQueryReturn(invites);

            const result = await mentorService.getSentInvites();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });

        it('should return empty array if not authenticated', async () => {
            setupAuthError();
            const result = await mentorService.getSentInvites();
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            setupAuth();
            setQueryError({ message: 'Error' });

            const result = await mentorService.getSentInvites();
            expect(result).toEqual([]);
        });
    });

    // ==========================================
    // getReceivedInvites
    // ==========================================
    describe('getReceivedInvites', () => {
        it('should return list of received invites', async () => {
            setupAuth();
            const invites = [{ id: '2', mentee_email: mockUser.email }];

            const resultsQueue = [
                { data: invites, error: null },
                { data: invites, error: null }
            ];

            let callCount = 0;
            (queryMock as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void }).then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
                const result = resultsQueue[callCount] || { data: [], error: null };
                if (callCount < resultsQueue.length - 1) callCount++;
                resolve(result);
            };

            const result = await mentorService.getReceivedInvites();
            expect(result).toHaveLength(1);
        });

        it('should return empty array if not authenticated', async () => {
            // Note: getReceivedInvites checks user?.email.
            // setupAuthError returns user: null.
            setupAuthError();
            const result = await mentorService.getReceivedInvites();
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            setupAuth();

            // First call (pending check) returns success to proceed, or fail?
            // If checking pending fails, it logs error but proceeds to main query?
            // "const { data: allPending, error: debugError } = await ..." - debugError is logged but not blocking.
            // "const { data, error } = await ..." - this error returns [].

            const resultsQueue = [
                { data: [], error: null },
                { data: null, error: { message: 'Error' } }
            ];

            let callCount = 0;
            (queryMock as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void }).then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
                const result = resultsQueue[callCount] || { data: [], error: null };
                if (callCount < resultsQueue.length - 1) callCount++;
                resolve(result);
            };

            const result = await mentorService.getReceivedInvites();
            expect(result).toEqual([]);
        });
    });

    // ==========================================
    // acceptInvite
    // ==========================================
    describe('acceptInvite', () => {
        it('should accept invite successfully', async () => {
            setupAuth();
            setQueryReturn(null);

            const result = await mentorService.acceptInvite('token-123');
            expect(result).toBe(true);
            expect(queryMock.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }));
        });

        it('should return false if not authenticated', async () => {
             setupAuthError();
             const result = await mentorService.acceptInvite('token-123');
             expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            setupAuth();
            setQueryError({ message: 'Error' });

            const result = await mentorService.acceptInvite('token-123');
            expect(result).toBe(false);
        });
    });

    // ==========================================
    // rejectInvite
    // ==========================================
    describe('rejectInvite', () => {
        it('should reject invite successfully', async () => {
            setQueryReturn(null);
            const result = await mentorService.rejectInvite('invite-1');
            expect(result).toBe(true);
            expect(queryMock.update).toHaveBeenCalledWith({ status: 'rejected' });
        });

        it('should return false on error', async () => {
            setQueryError({ message: 'Error' });
            const result = await mentorService.rejectInvite('invite-1');
            expect(result).toBe(false);
        });
    });

    // ==========================================
    // revokeInvite (revokeMentorship)
    // ==========================================
    describe('revokeInvite', () => {
        it('should revoke invite successfully', async () => {
            setQueryReturn(null);
            const result = await mentorService.revokeInvite('invite-1');
            expect(result).toBe(true);
            expect(queryMock.update).toHaveBeenCalledWith({ status: 'revoked' });
        });

        it('should return false on error', async () => {
            setQueryError({ message: 'Error' });
            const result = await mentorService.revokeInvite('invite-1');
            expect(result).toBe(false);
        });
    });

    // ==========================================
    // getMentees
    // ==========================================
    describe('getMentees', () => {
        it('should return list of mentees with stats', async () => {
            setupAuth();

            const createLocalMock = () => {
                const mock = { then: null } as unknown as MockSupabaseClient;
                ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle', 'limit', 'gt'].forEach(method => {
                    mock[method] = vi.fn().mockReturnValue(mock);
                });
                return mock;
            };

            const invitesMock = createLocalMock() as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void };
            invitesMock.then = (resolve: (value: { data: unknown; error: unknown }) => void) => resolve({
                data: [{ id: 'inv-1', mentee_id: 'm1', mentee_email: 'm@t.com', status: 'accepted' }],
                error: null
            });

            const tradesMock = createLocalMock() as unknown as { then: (resolve: (value: { data: unknown; error: unknown }) => void) => void };
            tradesMock.then = (resolve: (value: { data: unknown; error: unknown }) => void) => resolve({
                data: [{ id: 't1', outcome: 'win', entry_date: '2023-01-01' }],
                error: null
            });

            (supabase.from as unknown as Mock).mockImplementation((table: string) => {
                if (table === 'mentor_invites') return invitesMock;
                if (table === 'trades') return tradesMock;
                return queryMock;
            });

            const result = await mentorService.getMentees();

            expect(result).toHaveLength(1);
            expect(result[0].menteeId).toBe('m1');
            expect(result[0].totalTrades).toBe(1);
            expect(result[0].winRate).toBe(100);
        });

        it('should return empty array if not authenticated', async () => {
            setupAuthError();
            const result = await mentorService.getMentees();
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            setupAuth();
            setQueryError({ message: 'Error' });
            // Both calls will fail with this default mock on queryMock if not overridden for specific tables

            const result = await mentorService.getMentees();
            expect(result).toEqual([]);
        });
    });

    // ==========================================
    // getMentors
    // ==========================================
    describe('getMentors', () => {
        it('should return list of mentors', async () => {
            setupAuth();
            setQueryReturn([{ id: 'inv-2', mentor_id: 'mentor-2' }]);

            const result = await mentorService.getMentors();

            expect(result).toHaveLength(1);
            expect(result[0].mentorId).toBe('mentor-2');
        });

        it('should return empty array if not authenticated', async () => {
            setupAuthError();
            const result = await mentorService.getMentors();
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            setupAuth();
            setQueryError({ message: 'Error' });
            const result = await mentorService.getMentors();
            expect(result).toEqual([]);
        });
    });
});
