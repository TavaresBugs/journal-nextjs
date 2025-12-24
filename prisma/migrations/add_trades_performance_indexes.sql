-- Performance Optimization Indices for Dashboard
-- Issue: https://github.com/TavaresBugs/journal-nextjs/issues/82
-- Created: 2024-12-24
-- 
-- Run this in Supabase SQL Editor

-- Composite index for dashboard metrics query
-- Optimizes: getDashboardMetrics single query with FILTER by outcome
CREATE INDEX IF NOT EXISTS idx_trades_account_user_outcome 
ON trades(account_id, user_id, outcome) 
INCLUDE (pnl);

-- Composite index for trade listing ordered by date
-- Optimizes: getByAccountId with pagination and date ordering
CREATE INDEX IF NOT EXISTS idx_trades_account_user_date 
ON trades(account_id, user_id, entry_date DESC);

-- Index for symbol filtering (common dashboard filter)
CREATE INDEX IF NOT EXISTS idx_trades_account_user_symbol 
ON trades(account_id, user_id, symbol);
