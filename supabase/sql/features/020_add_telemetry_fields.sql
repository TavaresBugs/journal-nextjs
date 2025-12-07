-- Migration: 020_add_telemetry_fields
-- Description: Add telemetry fields for session detection, HTF alignment, and R-Multiple

-- Campos automáticos
ALTER TABLE trades ADD COLUMN IF NOT EXISTS session VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS htf_aligned BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple DECIMAL(5,2);

-- Campos qualitativos
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_condition VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS plan_adherence VARCHAR(20); -- '100%', 'partial', 'off-plan'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS plan_adherence_rating INTEGER CHECK (plan_adherence_rating BETWEEN 1 AND 5);

-- Índices para performance em queries de analytics
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);
CREATE INDEX IF NOT EXISTS idx_trades_htf_aligned ON trades(htf_aligned);
CREATE INDEX IF NOT EXISTS idx_trades_market_condition ON trades(market_condition);

-- Comentários para documentação
COMMENT ON COLUMN trades.session IS 'Trading session detected from entry time (Tokyo, London, NY, etc.)';
COMMENT ON COLUMN trades.htf_aligned IS 'Whether entry TF is aligned with analysis TF per professional standards';
COMMENT ON COLUMN trades.r_multiple IS 'Risk multiple: (Exit - Entry) / (Entry - StopLoss)';
COMMENT ON COLUMN trades.market_condition IS 'Manual market condition (Trending Bull/Bear, Range, High Vol, Low Vol)';
COMMENT ON COLUMN trades.plan_adherence IS 'Did trader follow the plan: 100%, partial, off-plan';
COMMENT ON COLUMN trades.plan_adherence_rating IS 'Plan adherence rating 1-5 stars';
