-- ============================================
-- ENTRY TELEMETRY FIELDS
-- Adds quality and market condition tracking
-- ============================================

-- Entry Quality: visual quality assessment of the setup
-- Values: picture-perfect, nice, normal, ugly
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS entry_quality TEXT CHECK (
  entry_quality IS NULL OR entry_quality IN ('picture-perfect', 'nice', 'normal', 'ugly')
);

-- Market Condition V2: market condition classification
-- Values: bull-trend, bear-trend, ranging, breakout
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS market_condition_v2 TEXT CHECK (
  market_condition_v2 IS NULL OR market_condition_v2 IN ('bull-trend', 'bear-trend', 'ranging', 'breakout')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_entry_quality ON trades(entry_quality);
CREATE INDEX IF NOT EXISTS idx_trades_market_condition_v2 ON trades(market_condition_v2);

-- Add comments for documentation
COMMENT ON COLUMN trades.entry_quality IS 
  'Visual quality assessment of the setup: picture-perfect, nice, normal, or ugly';
COMMENT ON COLUMN trades.market_condition_v2 IS 
  'Market condition classification: strong-trend, weak-trend, ranging, or breakout';
