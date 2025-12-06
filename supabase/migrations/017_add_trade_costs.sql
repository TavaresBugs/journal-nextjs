-- Migration: Add commission and swap columns to trades table
-- These fields are needed for storing trading costs from imports (NinjaTrader, MetaTrader, etc.)

-- Add commission column (costs are stored as negative values)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS commission DECIMAL(12, 2) DEFAULT NULL;

-- Add swap column (for Forex overnight fees, can be positive or negative)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS swap DECIMAL(12, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN trades.commission IS 'Trading commission/brokerage fee (stored as negative value for costs)';
COMMENT ON COLUMN trades.swap IS 'Overnight swap fee for Forex positions (can be positive or negative)';
