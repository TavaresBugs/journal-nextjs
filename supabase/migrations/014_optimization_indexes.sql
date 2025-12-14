-- Optimization Indexes for Trade Queries
CREATE INDEX IF NOT EXISTS idx_trades_account_date
ON trades(account_id, entry_date DESC, entry_time DESC);

CREATE INDEX IF NOT EXISTS idx_trades_user_account
ON trades(user_id, account_id);

-- Indexes for Journal Entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_date
ON journal_entries(account_id, date DESC);

-- Indexes for Junction Tables
CREATE INDEX IF NOT EXISTS idx_journal_entry_trades_composite
ON journal_entry_trades(journal_entry_id, trade_id);
