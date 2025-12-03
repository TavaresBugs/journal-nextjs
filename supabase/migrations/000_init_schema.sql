-- ============================================
-- TRADING JOURNAL - INITIAL SCHEMA (CONSOLIDATED)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ACCOUNTS TABLE
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  initial_balance DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  leverage TEXT NOT NULL DEFAULT '1:100',
  max_drawdown DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- 2. TRADES TABLE
-- ============================================

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  
  -- Analysis
  tf_analise TEXT,
  tf_entrada TEXT,
  tags TEXT,
  strategy TEXT,
  setup TEXT,
  notes TEXT,
  
  -- Dates
  entry_date DATE NOT NULL,
  entry_time TIME,
  exit_date DATE,
  exit_time TIME,
  
  -- Result
  pnl DECIMAL(15, 2),
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'breakeven', 'pending')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account ON trades(account_id);
CREATE INDEX idx_trades_entry_date ON trades(entry_date);
CREATE INDEX idx_trades_outcome ON trades(outcome);

-- ============================================
-- 3. JOURNAL ENTRIES TABLE
-- ============================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  asset TEXT,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  
  -- Multi-Timeframe Images (URLs para Supabase Storage)
  image_tfm TEXT,    -- Mensal
  image_tfw TEXT,    -- Semanal
  image_tfd TEXT,    -- Diário
  image_tfh4 TEXT,   -- 4H
  image_tfh1 TEXT,   -- 1H
  image_tfm15 TEXT,  -- M15
  image_tfm5 TEXT,   -- M5
  image_tfm3 TEXT,   -- M3/M1
  
  emotion TEXT,
  analysis TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_account ON journal_entries(account_id);
CREATE INDEX idx_journal_date ON journal_entries(date);

-- ============================================
-- 4. DAILY ROUTINES TABLE
-- ============================================

CREATE TABLE daily_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  aerobic BOOLEAN DEFAULT FALSE,
  diet BOOLEAN DEFAULT FALSE,
  reading BOOLEAN DEFAULT FALSE,
  meditation BOOLEAN DEFAULT FALSE,
  pre_market BOOLEAN DEFAULT FALSE,
  prayer BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(account_id, date)
);

CREATE INDEX idx_daily_routines_user_id ON daily_routines(user_id);
CREATE INDEX idx_routines_account ON daily_routines(account_id);
CREATE INDEX idx_routines_date ON daily_routines(date);

-- ============================================
-- 5. SETTINGS TABLE
-- ============================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  
  currencies JSONB DEFAULT '["USD", "BRL", "EUR", "GBP"]',
  leverages JSONB DEFAULT '["1:30", "1:50", "1:100", "1:200", "1:500"]',
  assets JSONB DEFAULT '{"EURUSD": 100000, "GBPUSD": 100000, "USDJPY": 100000, "XAUUSD": 100, "US30": 1, "NQ": 1}',
  strategies JSONB DEFAULT '["Pullback", "Breakout", "Reversal", "Trend Following"]',
  setups JSONB DEFAULT '["Pivô de Alta", "Pivô de Baixa", "FVG", "Order Block", "Breaker"]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/edit their own data

-- Accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);

-- Journal Entries
CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Daily Routines
CREATE POLICY "Users can view own routines" ON daily_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routines" ON daily_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routines" ON daily_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routines" ON daily_routines FOR DELETE USING (auth.uid() = user_id);

-- Settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON settings FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. TRIGGERS (UPDATED_AT)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_routines_updated_at BEFORE UPDATE ON daily_routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
