-- Corrige a Constraint de market_condition_v2 para aceitar os valores em inglês (slugs)
-- O Frontend envia: 'bull-trend', 'bear-trend', 'ranging', 'breakout'

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_market_condition_v2_check;

ALTER TABLE trades 
ADD CONSTRAINT trades_market_condition_v2_check 
CHECK (market_condition_v2 IN ('bull-trend', 'bear-trend', 'ranging', 'breakout'));

-- Confirma que entry_quality também está correto
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_entry_quality_check;

ALTER TABLE trades 
ADD CONSTRAINT trades_entry_quality_check 
CHECK (entry_quality IN ('picture-perfect', 'nice', 'normal', 'ugly'));
