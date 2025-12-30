-- ============================================
-- Laboratory Experiment Trades Junction Table
-- Links trades to experiments for hypothesis validation
-- ============================================

-- Create the junction table
CREATE TABLE IF NOT EXISTS laboratory_experiment_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES laboratory_experiments(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  category VARCHAR(10) NOT NULL DEFAULT 'pro' CHECK (category IN ('pro', 'contra')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, trade_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiment_trades_experiment_id 
  ON laboratory_experiment_trades(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_trades_trade_id 
  ON laboratory_experiment_trades(trade_id);

-- Enable RLS
ALTER TABLE laboratory_experiment_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own experiment trades
-- Access is granted if the user owns the experiment
CREATE POLICY "Users can view their experiment trades"
ON laboratory_experiment_trades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM laboratory_experiments e
    WHERE e.id = experiment_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their experiment trades"
ON laboratory_experiment_trades
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM laboratory_experiments e
    WHERE e.id = experiment_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their experiment trades"
ON laboratory_experiment_trades
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM laboratory_experiments e
    WHERE e.id = experiment_id AND e.user_id = auth.uid()
  )
);

-- Comment describing table purpose
COMMENT ON TABLE laboratory_experiment_trades IS 
  'Junction table linking trades to experiments for hypothesis validation (Pros/Contras analysis)';
