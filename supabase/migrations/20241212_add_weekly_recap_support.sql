-- Migration: Add weekly review support to laboratory_recaps
-- Run this in Supabase SQL Editor

-- 1. Add new columns to laboratory_recaps
ALTER TABLE laboratory_recaps 
ADD COLUMN IF NOT EXISTS review_type VARCHAR(10) DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_date DATE;

-- 2. Create table for many-to-many relationship (recap <-> trades)
CREATE TABLE IF NOT EXISTS laboratory_recap_trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recap_id UUID REFERENCES laboratory_recaps(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(recap_id, trade_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recap_trades_recap_id ON laboratory_recap_trades(recap_id);
CREATE INDEX IF NOT EXISTS idx_recap_trades_trade_id ON laboratory_recap_trades(trade_id);
CREATE INDEX IF NOT EXISTS idx_recaps_review_type ON laboratory_recaps(review_type);
CREATE INDEX IF NOT EXISTS idx_recaps_week_dates ON laboratory_recaps(week_start_date, week_end_date);

-- 4. Add constraints for validation
ALTER TABLE laboratory_recaps 
DROP CONSTRAINT IF EXISTS check_review_type;

ALTER TABLE laboratory_recaps 
ADD CONSTRAINT check_review_type 
CHECK (review_type IN ('daily', 'weekly'));

-- 5. Enable RLS on new table
ALTER TABLE laboratory_recap_trades ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for laboratory_recap_trades
DROP POLICY IF EXISTS "Users can view their own recap trades" ON laboratory_recap_trades;
CREATE POLICY "Users can view their own recap trades" ON laboratory_recap_trades
  FOR SELECT USING (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own recap trades" ON laboratory_recap_trades;
CREATE POLICY "Users can insert their own recap trades" ON laboratory_recap_trades
  FOR INSERT WITH CHECK (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own recap trades" ON laboratory_recap_trades;
CREATE POLICY "Users can delete their own recap trades" ON laboratory_recap_trades
  FOR DELETE USING (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = auth.uid())
  );
