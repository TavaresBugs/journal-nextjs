-- ============================================
-- ROLLBACK SCRIPT for 014_optimization_indexes.sql
-- ============================================
--
-- Execute this if indexes cause issues in production.
-- Dropping indexes is fast and safe (no data loss).
-- Indexes can be recreated later if needed.
--
-- ============================================

-- TRADES TABLE INDEXES
DROP INDEX IF EXISTS idx_trades_created_at;
DROP INDEX IF EXISTS idx_trades_account_date;
DROP INDEX IF EXISTS idx_trades_user_account;

-- JOURNAL ENTRIES TABLE INDEXES
DROP INDEX IF EXISTS idx_journal_entries_user_date;
DROP INDEX IF EXISTS idx_journal_entries_account_date;

-- JUNCTION TABLE INDEXES
DROP INDEX IF EXISTS idx_journal_entry_trades_journal_id;
DROP INDEX IF EXISTS idx_journal_entry_trades_trade_id;
DROP INDEX IF EXISTS idx_journal_entry_trades_composite;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify indexes were dropped:
--
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE indexname LIKE 'idx_%' 
-- ORDER BY tablename;
-- ============================================
