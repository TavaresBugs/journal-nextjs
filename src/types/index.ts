// ============================================
// TYPES - Interfaces centralizadas
// ============================================

export interface Account {
    id: string;
    userId: string; // User ID from Supabase Auth
    name: string;
    currency: string;
    initialBalance: number;
    currentBalance: number;
    leverage: string;
    maxDrawdown: number;
    createdAt: string;
    updatedAt: string;
}

export interface Trade {
    id: string;
    userId: string; // User ID from Supabase Auth
    accountId: string;
    symbol: string; // Ativo (ex: EURUSD, US30)
    type: 'Long' | 'Short'; // Direção
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    exitPrice?: number;
    lot: number;

    // Análise
    tfAnalise?: string; // HTF (ex: 4H)
    tfEntrada?: string; // LTF (ex: M5)
    tags?: string; // PDArrays, contexto
    strategy?: string; // Estratégia
    setup?: string; // Setup específico
    notes?: string; // Notas/contexto

    // Datas
    entryDate: string;
    entryTime?: string;
    exitDate?: string;
    exitTime?: string;

    // Resultado
    pnl?: number;
    outcome?: 'win' | 'loss' | 'breakeven' | 'pending';

    createdAt: string;
    updatedAt: string;
}

export interface JournalImage {
    id: string;
    userId: string; // User ID from Supabase Auth
    journalEntryId: string;
    url: string;
    path: string; // Caminho no Storage (para delete)
    timeframe: string; // H4, M5, etc.
    displayOrder: number;
    createdAt: string;
}

export interface JournalEntry {
    id: string;
    userId: string; // User ID from Supabase Auth
    accountId: string;
    date: string; // YYYY-MM-DD
    title: string;
    asset?: string; // Ativo operado
    tradeId?: string; // Trade vinculado (opcional)

    // Imagens (Agora uma lista flexível)
    images: JournalImage[];

    emotion?: string; // Estado emocional
    analysis?: string; // Leitura do ativo
    notes?: string; // Review

    createdAt: string;
    updatedAt: string;
}

export interface DailyRoutine {
    id: string;
    userId: string; // User ID from Supabase Auth
    accountId: string;
    date: string; // YYYY-MM-DD

    aerobic: boolean;
    diet: boolean;
    reading: boolean;
    meditation: boolean;
    preMarket: boolean;
    prayer: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface Settings {
    id: string;
    userId: string; // User ID from Supabase Auth
    accountId?: string; // null = global settings

    // Listas customizadas
    currencies: string[];
    leverages: string[];
    assets: Record<string, number>; // { "US30": 1, "EURUSD": 100000, ... }
    strategies: string[];
    setups: string[];

    createdAt: string;
    updatedAt: string;
}

// ============================================
// ENUMS E CONSTANTES
// ============================================

export const DEFAULT_CURRENCIES = ['USD', 'BRL', 'EUR', 'GBP'];
export const DEFAULT_LEVERAGES = ['1:30', '1:50', '1:100', '1:200', '1:500'];

export const DEFAULT_ASSETS: Record<string, number> = {
    'EURUSD': 100000,
    'GBPUSD': 100000,
    'USDJPY': 100000,
    'XAUUSD': 100,
    'US30': 1,
    'NQ': 1,
    'MNQ': 1,
    'ES': 1,
    'MES': 1,
};

export const DEFAULT_STRATEGIES = [
    'Pullback',
    'Breakout',
    'Reversal',
    'Trend Following',
];

export const DEFAULT_SETUPS = [
    'Pivô de Alta',
    'Pivô de Baixa',
    'FVG',
    'Order Block',
    'Breaker',
];

// ============================================
// HELPER TYPES
// ============================================

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'pending';
export type TradeDirection = 'Long' | 'Short';

export interface TradeFilters {
    accountId?: string;
    symbol?: string;
    type?: TradeDirection;
    outcome?: TradeOutcome;
    dateFrom?: string;
    dateTo?: string;
}

export interface TradeMetrics {
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    pending: number;
    winRate: number;
    totalPnL: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    maxDrawdown: number;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export type AuthProvider = 'email' | 'google' | 'github';

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider: AuthProvider;
    createdAt: string;
}

// ============================================
// USER SETTINGS TYPES
// ============================================

export interface Asset {
    symbol: string;
    multiplier: number;
}

export interface UserSettings {
    id?: string;
    user_id?: string;
    currencies: string[];
    leverages: string[];
    assets: Asset[];
    strategies: string[];
    setups: string[];
    created_at?: string;
    updated_at?: string;
}
