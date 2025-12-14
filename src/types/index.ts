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

    // Costs
    commission?: number;
    swap?: number;

    // Análise
    tfAnalise?: string; // HTF (ex: 4H)
    tfEntrada?: string; // LTF (ex: M5)
    tags?: string | null; // PDArrays, contexto
    strategy?: string; // Estratégia
    strategyIcon?: string; // Ícone do playbook
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

    // Telemetria automática
    session?: string; // Trading session (Tokyo, London, NY, etc.)
    htfAligned?: boolean; // Whether TF alignment is valid
    rMultiple?: number; // Risk multiple

    // Telemetria qualitativa
    marketCondition?: 'Trending Bull' | 'Trending Bear' | 'Range' | 'High Vol' | 'Low Vol';
    planAdherence?: '100%' | 'partial' | 'off-plan';
    planAdherenceRating?: number; // 1-5

    // Entry Telemetry (v2)
    entry_quality?: 'picture-perfect' | 'nice' | 'normal' | 'ugly';
    market_condition_v2?: 'bull-trend' | 'bear-trend' | 'ranging' | 'breakout';
    pdArray?: PdArrayType;

    createdAt: string;
    updatedAt: string;
}

export interface TradeLite {
    id: string;
    entryDate: string;
    entryTime?: string;
    exitDate?: string;
    exitTime?: string;
    pnl?: number;
    outcome?: 'win' | 'loss' | 'breakeven' | 'pending';
    accountId: string; 
    symbol: string; 
    type: 'Long' | 'Short';
    // Table columns
    entryPrice: number;
    exitPrice?: number;
    stopLoss: number;
    takeProfit: number;
    lot: number;
    tags?: string | null;
    strategy?: string;
    strategyIcon?: string;
    setup?: string;
    // Timeframes for analytics
    tfAnalise?: string;
    tfEntrada?: string;
    // Market condition (legacy)
    marketCondition?: 'Trending Bull' | 'Trending Bear' | 'Range' | 'High Vol' | 'Low Vol';
    // Entry Telemetry v2
    entry_quality?: 'picture-perfect' | 'nice' | 'normal' | 'ugly';
    market_condition_v2?: 'bull-trend' | 'bear-trend' | 'ranging' | 'breakout';
    pdArray?: PdArrayType;
    session?: string;
    commission?: number;
    swap?: number;
}

export interface TradeResponse {
    data: Trade[];
    count: number;
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
    tradeIds?: string[]; // Trades vinculados (opcional)

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

export interface RuleGroup {
    id: string;
    name: string;
    rules: string[];
}

export interface Playbook {
    id: string;
    userId: string; // User ID from Supabase Auth
    accountId?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    ruleGroups: RuleGroup[];
    createdAt: string;
    updatedAt: string;
}

export interface SharedJournal {
    id: string;
    journalEntryId: string;
    userId: string;
    shareToken: string;
    expiresAt: string;
    createdAt: string;
    viewCount: number;
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
export type PdArrayType = 'FVG' | 'OB' | 'MB' | 'BB' | 'Swing High' | 'Swing Low' | 'PDH' | 'PDL';

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

// ============================================
// ADMIN TYPES
// ============================================

export type UserStatus = 'pending' | 'approved' | 'suspended' | 'banned';
export type UserRole = 'admin' | 'user' | 'guest' | 'mentor';

export interface UserExtended {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    status: UserStatus;
    role: UserRole;
    approvedAt?: string;
    approvedBy?: string;
    notes?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLog {
    id: string;
    userId?: string;
    userEmail?: string; // Para display
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface AdminStats {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    adminUsers: number;
    todayLogins: number;
    todaySignups: number;
}

// ============================================
// MENTOR MODE TYPES
// ============================================

export type MentorPermission = 'view' | 'comment';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'revoked';

export interface MentorInvite {
    id: string;
    // Mentor que enviou o convite (sempre presente)
    mentorId: string;
    mentorEmail: string;
    mentorName?: string;
    // Mentorado que recebe o convite (preenchido quando aceita)
    menteeId?: string;
    menteeEmail: string;
    menteeName?: string;
    // Configurações
    permission: MentorPermission;
    status: InviteStatus;
    inviteToken: string;
    createdAt: string;
    acceptedAt?: string;
    expiresAt: string;
}

export interface TradeComment {
    id: string;
    tradeId: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface MenteeOverview {
    menteeId: string;
    menteeName: string;
    menteeEmail: string;
    menteeAvatar?: string;
    permission: MentorPermission;
    totalTrades: number;
    winRate: number;
    recentTradesCount: number; // trades nos últimos 7 dias
    lastTradeDate?: string;
}

/**
 * Permissão de acesso do mentor a uma carteira específica do mentorado
 */
export interface MentorAccountPermission {
    id: string;
    inviteId: string;
    accountId: string;
    accountName?: string; // Para exibição na UI
    canViewTrades: boolean;
    canViewJournal: boolean;
    canViewRoutines: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// COMMUNITY TYPES
// ============================================

export interface SharedPlaybook {
    id: string;
    playbookId: string;
    playbook?: Playbook; // Join com playbooks
    userId: string;
    userName?: string;
    userAvatar?: string;
    isPublic: boolean;
    description?: string;
    stars: number;
    downloads: number;
    hasUserStarred?: boolean; // Se o usuário atual deu star
    // Author's performance with this playbook
    authorStats?: {
        totalTrades: number;
        winRate: number;
        profitFactor: number;
        netPnl: number;
        avgRR: number; // Average Risk:Reward ratio
        maxWinStreak: number; // Longest winning streak
        avgDuration?: string; // e.g., "2h 15m"
        preferredSymbol?: string; // e.g., "EURUSD"
        preferredSession?: string; // e.g., "London"
    };
    createdAt: string;
    updatedAt: string;
}

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    showWinRate: boolean;
    showProfitFactor: boolean;
    showTotalTrades: boolean;
    showPnl: boolean;
    totalTrades?: number;
    winRate?: number;
    profitFactor?: number;
    avgRR?: number; // Average Risk:Reward
    totalPnl?: number;
    streak?: number; // Journal streak
    rank?: number;
}

export interface LeaderboardOptIn {
    userId: string;
    displayName: string;
    showWinRate: boolean;
    showProfitFactor: boolean;
    showTotalTrades: boolean;
    showPnl: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    type: 'invite' | 'update' | 'announcement' | 'feedback';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: unknown; // Flexible data payload (MentorInvite, ReviewContext, etc)
}

// ============================================
// LABORATORY TYPES
// ============================================

export type ExperimentStatus = 'em_aberto' | 'testando' | 'validado' | 'descartado';

export type EmotionalState = 
    | 'confiante' 
    | 'ansioso' 
    | 'fomo' 
    | 'disciplinado' 
    | 'frustrado' 
    | 'euforico' 
    | 'neutro';

export interface LaboratoryImage {
    id: string;
    experimentId: string;
    imageUrl: string;
    description?: string;
    uploadedAt: string;
}

export interface LaboratoryExperiment {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: ExperimentStatus;
    category?: string;
    expectedWinRate?: number;
    expectedRiskReward?: number;
    promotedToPlaybook: boolean;
    images: LaboratoryImage[];
    createdAt: string;
    updatedAt: string;
}

export interface LaboratoryRecap {
    id: string;
    userId: string;
    tradeId?: string;
    title: string;
    whatWorked?: string;
    whatFailed?: string;
    emotionalState?: EmotionalState;
    lessonsLearned?: string;
    images: string[];
    createdAt: string;
    // Joined data
    trade?: TradeLite;
}
