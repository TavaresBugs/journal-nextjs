-- ============================================
-- DATABASE PERFORMANCE INDEXES
-- Run in Supabase SQL Editor
-- ============================================

-- Index for trades by user_id (speeds up all trade queries)
CREATE INDEX IF NOT EXISTS idx_trades_user_id 
ON trades(user_id);

-- Index for trades by strategy (speeds up playbook stats calculation)
CREATE INDEX IF NOT EXISTS idx_trades_strategy 
ON trades(strategy);

-- Composite index for the optimized batch query in getPublicPlaybooks
CREATE INDEX IF NOT EXISTS idx_trades_user_strategy 
ON trades(user_id, strategy);

-- Index for public playbooks filter
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_public 
ON shared_playbooks(is_public) 
WHERE is_public = true;

-- Index for playbook stars
CREATE INDEX IF NOT EXISTS idx_playbook_stars_shared_id 
ON playbook_stars(shared_playbook_id);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================

-- Run this to verify:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('trades', 'shared_playbooks', 'playbook_stars');
