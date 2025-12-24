/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Prisma Mock Setup for Repository Tests
 *
 * This module provides utilities for mocking the Prisma client
 * in unit tests for the Prisma repositories.
 */

import { vi } from "vitest";

// Mock Prisma result type
export interface MockPrismaResult<T> {
  data: T | null;
  error: Error | null;
}

// Create a comprehensive Prisma mock
export function createPrismaMock() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createMockQueryBuilder = (modelName: string) => ({
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    createManyAndReturn: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({}),
  });

  return {
    // Mental models
    mental_profiles: createMockQueryBuilder("mental_profiles"),
    mental_entries: createMockQueryBuilder("mental_entries"),
    mental_logs: createMockQueryBuilder("mental_logs"),

    // Laboratory models
    laboratory_experiments: createMockQueryBuilder("laboratory_experiments"),
    laboratory_images: createMockQueryBuilder("laboratory_images"),
    laboratory_recaps: createMockQueryBuilder("laboratory_recaps"),
    laboratory_recap_trades: createMockQueryBuilder("laboratory_recap_trades"),

    // Admin models
    users: createMockQueryBuilder("users"),
    users_extended: createMockQueryBuilder("users_extended"),
    profiles: createMockQueryBuilder("profiles"),
    audit_logs: createMockQueryBuilder("audit_logs"),

    // Core models
    accounts: createMockQueryBuilder("accounts"),
    user_settings: createMockQueryBuilder("user_settings"),
    settings: createMockQueryBuilder("settings"),
    trades: createMockQueryBuilder("trades"),
    journal_entries: createMockQueryBuilder("journal_entries"),
    journal_images: createMockQueryBuilder("journal_images"),
    journal_entry_trades: createMockQueryBuilder("journal_entry_trades"),
    playbooks: createMockQueryBuilder("playbooks"),
    daily_routines: createMockQueryBuilder("daily_routines"),
    mentor_reviews: createMockQueryBuilder("mentor_reviews"),

    // Community models
    shared_playbooks: createMockQueryBuilder("shared_playbooks"),
    playbook_stars: createMockQueryBuilder("playbook_stars"),
    leaderboard_opt_in: createMockQueryBuilder("leaderboard_opt_in"),

    // Mentor models
    mentor_invites: createMockQueryBuilder("mentor_invites"),
    mentor_account_permissions: createMockQueryBuilder("mentor_account_permissions"),
    trade_comments: createMockQueryBuilder("trade_comments"),

    // Share models
    shared_journals: createMockQueryBuilder("shared_journals"),

    // Transaction support
    $transaction: vi.fn().mockImplementation(async (fn: any) => {
      if (typeof fn === "function") {
        return fn(createPrismaMock());
      }
      return Promise.all(fn);
    }),

    // Connect/Disconnect
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),

    // Query raw
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(0),
  };
}

// Helper to create mock data
export const createMockData = {
  mentalProfile: (overrides = {}) => ({
    id: "profile-123",
    user_id: "user-123",
    category: "fear",
    description: "Fear of missing out",
    severity: 3,
    zone: "danger",
    is_system: false,
    created_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  mentalEntry: (overrides = {}) => ({
    id: "entry-123",
    user_id: "user-123",
    trigger_event: "Missed entry",
    emotion: "frustrated",
    behavior: "revenge trading",
    mistake: "Ignored rules",
    correction: "Wait for next setup",
    zone_detected: "danger",
    source: "grid",
    created_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  experiment: (overrides = {}) => ({
    id: "exp-123",
    user_id: "user-123",
    title: "Test Strategy",
    description: "Testing a new approach",
    status: "em_aberto",
    category: "momentum",
    expected_win_rate: 60,
    expected_risk_reward: 2.5,
    promoted_to_playbook: false,
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    laboratory_images: [],
    ...overrides,
  }),

  recap: (overrides = {}) => ({
    id: "recap-123",
    user_id: "user-123",
    trade_id: null,
    title: "Weekly Review",
    what_worked: "Patience",
    what_failed: "Overtrading",
    emotional_state: "disciplinado",
    lessons_learned: "Wait for setups",
    images: [],
    review_type: "weekly",
    week_start_date: new Date("2024-12-16"),
    week_end_date: new Date("2024-12-20"),
    linked_type: null,
    linked_id: null,
    created_at: new Date("2024-12-20T10:00:00Z"),
    laboratory_recap_trades: [],
    trades: null,
    ...overrides,
  }),

  userExtended: (overrides = {}) => ({
    id: "user-123",
    user_id: "user-123",
    email: "test@example.com",
    name: "Test User",
    avatar_url: null,
    status: "approved",
    role: "user",
    approved_at: new Date("2024-12-20T10:00:00Z"),
    approved_by: null,
    notes: null,
    last_login_at: new Date("2024-12-20T10:00:00Z"),
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  auditLog: (overrides = {}) => ({
    id: "log-123",
    user_id: "user-123",
    action: "login",
    resource_type: "session",
    resource_id: null,
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    metadata: {},
    created_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  trade: (overrides = {}) => ({
    id: "trade-123",
    user_id: "user-123",
    account_id: "account-123",
    symbol: "EURUSD",
    type: "BUY",
    entry_price: 1.1,
    exit_price: 1.105,
    quantity: 1,
    pnl: 50,
    commission: 0,
    fees: 0,
    open_time: new Date("2024-12-20T10:00:00Z"),
    close_time: new Date("2024-12-20T11:00:00Z"),
    notes: "Good trade",
    status: "CLOSED",
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  journalEntry: (overrides = {}) => ({
    id: "journal-123",
    user_id: "user-123",
    account_id: "account-123",
    date: new Date("2024-12-20"),
    title: "Daily Journal",
    content: "Market was volatile",
    mood: "neutral",
    tags: ["volatile", "news"],
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    journal_images: [],
    journal_entry_trades: [],
    ...overrides,
  }),

  leaderboardOptIn: (overrides = {}) => ({
    id: "opt-123",
    user_id: "user-123",
    display_name: "Trader1",
    show_win_rate: true,
    show_profit_factor: true,
    show_total_trades: true,
    show_pnl: false,
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  sharedPlaybook: (overrides = {}) => ({
    id: "shared-123",
    playbook_id: "pb-123",
    user_id: "user-123",
    name: "Strategy 1",
    description: "Best strategy",
    is_public: true,
    stars: 5,
    downloads: 10,
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    users: { name: "Test User", avatar_url: null },
    ...overrides,
  }),

  dailyRoutine: (overrides = {}) => ({
    id: "routine-123",
    user_id: "user-123",
    account_id: "account-123",
    date: new Date("2024-12-20"),
    pre_market_analysis: "Bullish",
    news_analysis: "High impact",
    emotional_check: 8,
    trading_plan: "Wait for pullback",
    post_market_analysis: "Executed well",
    lessons_learned: "Patience pays",
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),

  mentorReview: (overrides = {}) => ({
    id: "review-123",
    mentor_id: "mentor-123",
    mentee_id: "mentee-123",
    trade_id: null,
    journal_entry_id: null,
    review_type: "trade",
    content: "Good trade",
    rating: 5,
    is_read: false,
    created_at: new Date("2024-12-20T10:00:00Z"),
    updated_at: new Date("2024-12-20T10:00:00Z"),
    ...overrides,
  }),
};

// Type for the mock
export type PrismaMock = ReturnType<typeof createPrismaMock>;
