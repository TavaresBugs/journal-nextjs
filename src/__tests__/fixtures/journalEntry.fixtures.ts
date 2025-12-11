/**
 * Journal Entry Test Fixtures
 */

export const mockUserId = 'test-user-456';
export const mockAccountId = 'test-account-123';

export const validJournalEntry = {
    id: 'entry-1',
    userId: mockUserId,
    accountId: mockAccountId,
    date: '2025-12-11',
    title: 'Dia de Trading',
    asset: 'EURUSD',
    tradeIds: [],
    images: [],
    emotion: 'confident',
    analysis: 'Mercado em tendência de alta',
    notes: 'Segui o plano corretamente',
    createdAt: '2025-12-11T10:00:00.000Z',
    updatedAt: '2025-12-11T10:00:00.000Z',
};

export const minimalJournalEntry = {
    id: 'entry-2',
    userId: mockUserId,
    accountId: mockAccountId,
    date: '2025-12-11',
    title: '',
    asset: undefined,
    tradeIds: [],
    images: [],
    emotion: undefined,
    analysis: undefined,
    notes: undefined,
    createdAt: '2025-12-11T10:00:00.000Z',
    updatedAt: '2025-12-11T10:00:00.000Z',
};

export const journalEntryWithTrades = {
    ...validJournalEntry,
    id: 'entry-3',
    tradeIds: ['trade-1', 'trade-2', 'trade-3'],
};

export const journalEntryWithImages = {
    ...validJournalEntry,
    id: 'entry-4',
    images: [
        { 
            id: 'img-1',
            userId: mockUserId,
            journalEntryId: 'entry-4',
            url: 'https://example.com/chart1.png', 
            path: 'test-user/test-account/2025/12/11/chart1.png',
            timeframe: 'H1',
            displayOrder: 0,
            createdAt: '2025-12-11T10:00:00.000Z'
        },
        { 
            id: 'img-2',
            userId: mockUserId,
            journalEntryId: 'entry-4',
            url: 'https://example.com/chart2.png',
            path: 'test-user/test-account/2025/12/11/chart2.png', 
            timeframe: 'H4',
            displayOrder: 1,
            createdAt: '2025-12-11T10:00:00.000Z'
        },
    ],
};

// Database format fixtures (snake_case)
export const dbJournalEntry = {
    id: 'entry-1',
    user_id: mockUserId,
    account_id: mockAccountId,
    date: '2025-12-11',
    title: 'Dia de Trading',
    asset: 'EURUSD',
    trade_id: null,
    emotion: 'confident',
    analysis: 'Mercado em tendência de alta',
    notes: 'Segui o plano corretamente',
    created_at: '2025-12-11T10:00:00.000Z',
    updated_at: '2025-12-11T10:00:00.000Z',
    journal_images: [],
    journal_entry_trades: [],
};

export const dbJournalEntryWithRelations = {
    ...dbJournalEntry,
    id: 'entry-5',
    journal_images: [
        {
            id: 'img-1',
            user_id: mockUserId,
            journal_entry_id: 'entry-5',
            url: 'https://example.com/chart.png',
            path: 'test-user/chart.png',
            timeframe: 'H1',
            display_order: 0,
            created_at: '2025-12-11T10:00:00.000Z',
        }
    ],
    journal_entry_trades: [
        { trade_id: 'trade-1' },
        { trade_id: 'trade-2' },
    ],
};

export const multipleDbEntries = [
    { ...dbJournalEntry, id: 'entry-1', date: '2025-12-11' },
    { ...dbJournalEntry, id: 'entry-2', date: '2025-12-10' },
    { ...dbJournalEntry, id: 'entry-3', date: '2025-12-09' },
];
