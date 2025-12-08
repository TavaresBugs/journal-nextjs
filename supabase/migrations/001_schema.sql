-- ============================================
-- TRADING JOURNAL - CONSOLIDATED SCHEMA
-- ============================================
-- This file contains all tables, columns, and indexes.
-- Run this FIRST before functions and RLS policies.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  initial_balance DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  leverage TEXT NOT NULL DEFAULT '1:100',
  max_drawdown DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- 2. TRADES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Trade Info
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Long', 'Short')),
  entry_price DECIMAL(15, 5) NOT NULL,
  stop_loss DECIMAL(15, 5),
  take_profit DECIMAL(15, 5),
  exit_price DECIMAL(15, 5),
  lot DECIMAL(10, 2) NOT NULL DEFAULT 1.0,

  -- Costs (from imports)
  commission DECIMAL(12, 2) DEFAULT NULL,
  swap DECIMAL(12, 2) DEFAULT NULL,

  -- Analysis
  tf_analise TEXT,
  tf_entrada TEXT,
  tags TEXT,
  strategy TEXT,
  setup TEXT,
  notes TEXT,

  -- Dates (TEXT to avoid timezone issues)
  entry_date DATE NOT NULL,
  entry_time TEXT,
  exit_date DATE,
  exit_time TEXT,

  -- Result
  pnl DECIMAL(15, 2),
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'breakeven', 'pending')),

  -- Telemetry Fields
  session VARCHAR(50),
  htf_aligned BOOLEAN DEFAULT false,
  r_multiple DECIMAL(5,2),
  market_condition VARCHAR(50),
  plan_adherence VARCHAR(20),
  plan_adherence_rating INTEGER CHECK (plan_adherence_rating BETWEEN 1 AND 5),

  -- Entry Telemetry v2
  entry_quality TEXT CHECK (entry_quality IS NULL OR entry_quality IN ('picture-perfect', 'nice', 'normal', 'ugly')),
  market_condition_v2 TEXT CHECK (market_condition_v2 IS NULL OR market_condition_v2 IN ('bull-trend', 'bear-trend', 'ranging', 'breakout')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON trades(outcome);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);
CREATE INDEX IF NOT EXISTS idx_trades_htf_aligned ON trades(htf_aligned);
CREATE INDEX IF NOT EXISTS idx_trades_market_condition ON trades(market_condition);
CREATE INDEX IF NOT EXISTS idx_trades_entry_quality ON trades(entry_quality);
CREATE INDEX IF NOT EXISTS idx_trades_market_condition_v2 ON trades(market_condition_v2);

-- ============================================
-- 3. JOURNAL ENTRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  asset TEXT,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL, -- Legacy: single trade

  -- Multi-Timeframe Images (legacy columns, prefer journal_images table)
  image_tfm TEXT,
  image_tfw TEXT,
  image_tfd TEXT,
  image_tfh4 TEXT,
  image_tfh1 TEXT,
  image_tfm15 TEXT,
  image_tfm5 TEXT,
  image_tfm3 TEXT,

  emotion TEXT,
  analysis TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_account ON journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);

-- ============================================
-- 4. JOURNAL ENTRY TRADES (Multi-Trade Junction)
-- ============================================

CREATE TABLE IF NOT EXISTS journal_entry_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(journal_entry_id, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_jet_journal_entry_id ON journal_entry_trades(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jet_trade_id ON journal_entry_trades(trade_id);

-- Migrate existing data from legacy trade_id column
INSERT INTO journal_entry_trades (journal_entry_id, trade_id)
SELECT id, trade_id FROM journal_entries 
WHERE trade_id IS NOT NULL
ON CONFLICT (journal_entry_id, trade_id) DO NOTHING;

-- ============================================
-- 5. JOURNAL IMAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS journal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT,
  timeframe TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_images_entry ON journal_images(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_images_user ON journal_images(user_id);

-- ============================================
-- 6. DAILY ROUTINES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS daily_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  aerobic BOOLEAN DEFAULT FALSE,
  diet BOOLEAN DEFAULT FALSE,
  reading BOOLEAN DEFAULT FALSE,
  meditation BOOLEAN DEFAULT FALSE,
  pre_market BOOLEAN DEFAULT FALSE,
  prayer BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_routines_user_id ON daily_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_account ON daily_routines(account_id);
CREATE INDEX IF NOT EXISTS idx_routines_date ON daily_routines(date);

-- ============================================
-- 7. SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  currencies JSONB DEFAULT '["USD", "BRL", "EUR", "GBP"]',
  leverages JSONB DEFAULT '["1:30", "1:50", "1:100", "1:200", "1:500"]',
  assets JSONB DEFAULT '{"EURUSD": 100000, "GBPUSD": 100000, "USDJPY": 100000, "XAUUSD": 100, "US30": 1, "NQ": 1}',
  strategies JSONB DEFAULT '["Pullback", "Breakout", "Reversal", "Trend Following"]',
  setups JSONB DEFAULT '["Pivô de Alta", "Pivô de Baixa", "FVG", "Order Block", "Breaker"]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- ============================================
-- 8. USER SETTINGS TABLE (if different from settings)
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'pt-BR',
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. PLAYBOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- Nullable for global playbooks
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📈',
    color TEXT DEFAULT '#3B82F6',
    rule_groups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_playbooks_user_id ON playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_account_id ON playbooks(account_id);

-- ============================================
-- 10. SHARED JOURNALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS shared_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    view_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_shared_journals_token ON shared_journals(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_journals_journal_entry ON shared_journals(journal_entry_id);

-- ============================================
-- 11. USERS EXTENDED TABLE (Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'banned')),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest', 'mentor')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_extended_status ON users_extended(status);
CREATE INDEX IF NOT EXISTS idx_users_extended_role ON users_extended(role);
CREATE INDEX IF NOT EXISTS idx_users_extended_email ON users_extended(email);

-- ============================================
-- 12. AUDIT LOGS TABLE (Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 13. MENTOR INVITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mentor_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentor_email TEXT NOT NULL,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    mentee_email TEXT NOT NULL,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'comment')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
    invite_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentor ON mentor_invites(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentee ON mentor_invites(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_token ON mentor_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentor_email ON mentor_invites(mentor_email);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentee_email ON mentor_invites(mentee_email);

-- ============================================
-- 14. TRADE COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS trade_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_comments_trade ON trade_comments(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_user ON trade_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_created ON trade_comments(created_at DESC);

-- ============================================
-- 15. MENTOR REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mentor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    review_type TEXT NOT NULL CHECK (review_type IN ('correction', 'comment', 'suggestion')),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_id ON mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentee_id ON mentor_reviews(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_trade_id ON mentor_reviews(trade_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_is_read ON mentor_reviews(is_read);

-- ============================================
-- 16. MENTOR ACCOUNT PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mentor_account_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_id UUID NOT NULL REFERENCES mentor_invites(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    can_view_trades BOOLEAN DEFAULT true,
    can_view_journal BOOLEAN DEFAULT true,
    can_view_routines BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invite_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_account_permissions_invite ON mentor_account_permissions(invite_id);
CREATE INDEX IF NOT EXISTS idx_mentor_account_permissions_account ON mentor_account_permissions(account_id);

-- ============================================
-- 17. SHARED PLAYBOOKS TABLE (Community)
-- ============================================

CREATE TABLE IF NOT EXISTS shared_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    description TEXT,
    stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playbook_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_playbooks_user ON shared_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_public ON shared_playbooks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_stars ON shared_playbooks(stars DESC);

-- ============================================
-- 18. PLAYBOOK STARS TABLE (Community)
-- ============================================

CREATE TABLE IF NOT EXISTS playbook_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_playbook_id UUID NOT NULL REFERENCES shared_playbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shared_playbook_id, user_id)
);

-- ============================================
-- 19. LEADERBOARD OPT-IN TABLE (Community)
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_opt_in (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    show_win_rate BOOLEAN DEFAULT true,
    show_profit_factor BOOLEAN DEFAULT true,
    show_total_trades BOOLEAN DEFAULT true,
    show_pnl BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORAGE: Journal Images Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
