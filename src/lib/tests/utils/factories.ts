import { Trade } from "@/services/trades/types";
import { JournalEntry } from "@/services/journal/types";

// ==========================================
// TRADE FACTORIES
// ==========================================

export const createMockTrade = (overrides?: Partial<Trade>): Trade => {
  return {
    id: "trade-123",
    userId: "user-123",
    accountId: "acc-123",
    symbol: "EURUSD",
    type: "Buy", // Was 'side' in factory but 'type' in mapper? mapper uses 'type'. Let's check Trade interface fully if possible, but mapper has 'type'
    entryPrice: 1.1000,
    exitPrice: 1.1050,
    lot: 1, // 'quantity' in factory -> 'lot' in mapper
    entryDate: new Date().toISOString(),
    exitDate: new Date().toISOString(),
    outcome: "Win", // 'status' in factory -> 'outcome'? Mapper has 'outcome'.
    pnl: 50,
    // pnl_percentage? mapper doesn't show it.
    commission: 5,
    notes: "Test trade",
    // magic_number?
    // ticket?
    strategy: "Trend Following",
    tfAnalise: "H1", // 'timeframe' -> tfAnalise/tfEntrada
    tfEntrada: "M15",
    // screenshot_url? mapper doesn't show it.
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  } as unknown as Trade; // cast to avoid missing properties if I missed some
};

export const createMockActiveTrade = (overrides?: Partial<Trade>): Trade => {
    return createMockTrade({
        exitDate: undefined,
        exitPrice: undefined,
        pnl: 0,
        ...overrides
    });
};

// ==========================================
// JOURNAL FACTORIES
// ==========================================

export const createMockJournalEntry = (overrides?: Partial<JournalEntry>): JournalEntry => {
    return {
        id: "journal-1",
        user_id: "user-123",
        date: new Date().toISOString(),
        content: "Today was a good trading day.",
        mood: "Neutral",
        tags: ["discipline", "focus"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trades: [],
        images: [],
        ...overrides
    };
};
