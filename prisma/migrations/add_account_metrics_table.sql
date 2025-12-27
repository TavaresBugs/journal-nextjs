-- ============================================================================
-- Account Metrics Table & Trigger
-- 
-- This migration creates a pre-calculated metrics table for each account,
-- automatically updated via trigger when trades are inserted/updated/deleted.
-- This improves report performance from ~200-500ms to ~5-10ms.
-- ============================================================================

-- 1. CREATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.account_metrics (
  account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Basic Metrics
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  breakeven INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_pnl DECIMAL(15,2) DEFAULT 0,
  
  -- Advanced Metrics
  profit_factor DECIMAL(10,2) DEFAULT 0,
  avg_win DECIMAL(15,2) DEFAULT 0,
  avg_loss DECIMAL(15,2) DEFAULT 0,
  largest_win DECIMAL(15,2) DEFAULT 0,
  largest_loss DECIMAL(15,2) DEFAULT 0,
  sharpe_ratio DECIMAL(6,2) DEFAULT 0,
  avg_pnl DECIMAL(15,2) DEFAULT 0,
  pnl_std_dev DECIMAL(15,2) DEFAULT 0,
  
  -- Streaks
  max_win_streak INTEGER DEFAULT 0,
  max_loss_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  current_streak_type VARCHAR(10) DEFAULT 'none',
  
  -- Performance by Weekday (JSON) - 0=Sun, 1=Mon, ..., 6=Sat
  weekday_stats JSONB DEFAULT '{"0":{"trades":0,"wins":0,"pnl":0},"1":{"trades":0,"wins":0,"pnl":0},"2":{"trades":0,"wins":0,"pnl":0},"3":{"trades":0,"wins":0,"pnl":0},"4":{"trades":0,"wins":0,"pnl":0},"5":{"trades":0,"wins":0,"pnl":0},"6":{"trades":0,"wins":0,"pnl":0}}',
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_account_metrics_user_id ON public.account_metrics(user_id);


-- 2. HELPER FUNCTION FOR INITIAL POPULATION (must be created BEFORE the DO block)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_account_metrics_for_account(
  target_account_id UUID,
  target_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total_trades INTEGER;
  v_wins INTEGER;
  v_losses INTEGER;
  v_breakeven INTEGER;
  v_win_rate DECIMAL(5,2);
  v_total_pnl DECIMAL(15,2);
  v_sum_wins DECIMAL(15,2);
  v_sum_losses DECIMAL(15,2);
  v_profit_factor DECIMAL(10,2);
  v_avg_win DECIMAL(15,2);
  v_avg_loss DECIMAL(15,2);
  v_largest_win DECIMAL(15,2);
  v_largest_loss DECIMAL(15,2);
  v_avg_pnl DECIMAL(15,2);
  v_pnl_std_dev DECIMAL(15,2);
  v_sharpe_ratio DECIMAL(6,2);
  v_max_win_streak INTEGER;
  v_max_loss_streak INTEGER;
  v_current_streak INTEGER;
  v_current_streak_type VARCHAR(10);
  v_weekday_stats JSONB;
  i INTEGER;
BEGIN
  -- Calculate basic metrics
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE outcome = 'win')::INTEGER,
    COUNT(*) FILTER (WHERE outcome = 'loss')::INTEGER,
    COUNT(*) FILTER (WHERE outcome = 'breakeven')::INTEGER,
    COALESCE(SUM(pnl), 0)::DECIMAL(15,2),
    COALESCE(SUM(pnl) FILTER (WHERE outcome = 'win'), 0)::DECIMAL(15,2),
    COALESCE(ABS(SUM(pnl) FILTER (WHERE outcome = 'loss')), 0)::DECIMAL(15,2),
    COALESCE(MAX(pnl) FILTER (WHERE outcome = 'win'), 0)::DECIMAL(15,2),
    COALESCE(ABS(MIN(pnl) FILTER (WHERE outcome = 'loss')), 0)::DECIMAL(15,2),
    COALESCE(AVG(pnl), 0)::DECIMAL(15,2),
    COALESCE(STDDEV_POP(pnl), 0)::DECIMAL(15,2)
  INTO 
    v_total_trades, v_wins, v_losses, v_breakeven, v_total_pnl,
    v_sum_wins, v_sum_losses, v_largest_win, v_largest_loss,
    v_avg_pnl, v_pnl_std_dev
  FROM public.trades
  WHERE account_id = target_account_id;

  -- Derived metrics
  IF (v_wins + v_losses) > 0 THEN
    v_win_rate := ROUND((v_wins::DECIMAL / (v_wins + v_losses)) * 100, 2);
  ELSE
    v_win_rate := 0;
  END IF;

  IF v_sum_losses > 0 THEN
    v_profit_factor := ROUND(v_sum_wins / v_sum_losses, 2);
  ELSIF v_sum_wins > 0 THEN
    v_profit_factor := 999.99;
  ELSE
    v_profit_factor := 0;
  END IF;

  v_avg_win := CASE WHEN v_wins > 0 THEN ROUND(v_sum_wins / v_wins, 2) ELSE 0 END;
  v_avg_loss := CASE WHEN v_losses > 0 THEN ROUND(v_sum_losses / v_losses, 2) ELSE 0 END;
  v_sharpe_ratio := CASE WHEN v_pnl_std_dev > 0 THEN ROUND(v_avg_pnl / v_pnl_std_dev, 2) ELSE 0 END;

  -- Streaks
  WITH ordered_trades AS (
    SELECT outcome, ROW_NUMBER() OVER (ORDER BY entry_date DESC, entry_time DESC) as rn
    FROM public.trades WHERE account_id = target_account_id
  ),
  streak_groups AS (
    SELECT outcome, rn, rn - ROW_NUMBER() OVER (PARTITION BY outcome ORDER BY rn) as grp
    FROM ordered_trades
  ),
  streaks AS (
    SELECT outcome, MIN(rn) as first_rn, COUNT(*) as streak_len
    FROM streak_groups GROUP BY outcome, grp
  )
  SELECT 
    COALESCE(MAX(streak_len) FILTER (WHERE outcome = 'win'), 0),
    COALESCE(MAX(streak_len) FILTER (WHERE outcome = 'loss'), 0),
    (SELECT streak_len FROM streaks WHERE first_rn = 1 LIMIT 1),
    (SELECT outcome FROM ordered_trades WHERE rn = 1 LIMIT 1)
  INTO v_max_win_streak, v_max_loss_streak, v_current_streak, v_current_streak_type
  FROM streaks;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_current_streak_type := COALESCE(v_current_streak_type, 'none');

  -- Weekday stats
  SELECT jsonb_object_agg(day_num::text, jsonb_build_object('trades', trades, 'wins', wins, 'pnl', pnl))
  INTO v_weekday_stats
  FROM (
    SELECT EXTRACT(DOW FROM entry_date)::INTEGER as day_num, COUNT(*) as trades,
           COUNT(*) FILTER (WHERE outcome = 'win') as wins, COALESCE(SUM(pnl), 0) as pnl
    FROM public.trades WHERE account_id = target_account_id GROUP BY day_num
  ) d;

  v_weekday_stats := COALESCE(v_weekday_stats, '{}'::jsonb);
  FOR i IN 0..6 LOOP
    IF NOT v_weekday_stats ? i::text THEN
      v_weekday_stats := v_weekday_stats || jsonb_build_object(i::text, jsonb_build_object('trades', 0, 'wins', 0, 'pnl', 0));
    END IF;
  END LOOP;

  -- Upsert
  INSERT INTO public.account_metrics (
    account_id, user_id, total_trades, wins, losses, breakeven, win_rate, total_pnl,
    profit_factor, avg_win, avg_loss, largest_win, largest_loss, sharpe_ratio,
    avg_pnl, pnl_std_dev, max_win_streak, max_loss_streak, current_streak,
    current_streak_type, weekday_stats, updated_at
  ) VALUES (
    target_account_id, target_user_id, v_total_trades, v_wins, v_losses, v_breakeven,
    v_win_rate, v_total_pnl, v_profit_factor, v_avg_win, v_avg_loss, v_largest_win,
    v_largest_loss, v_sharpe_ratio, v_avg_pnl, v_pnl_std_dev, v_max_win_streak,
    v_max_loss_streak, v_current_streak, v_current_streak_type, v_weekday_stats, NOW()
  )
  ON CONFLICT (account_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades, wins = EXCLUDED.wins, losses = EXCLUDED.losses,
    breakeven = EXCLUDED.breakeven, win_rate = EXCLUDED.win_rate, total_pnl = EXCLUDED.total_pnl,
    profit_factor = EXCLUDED.profit_factor, avg_win = EXCLUDED.avg_win, avg_loss = EXCLUDED.avg_loss,
    largest_win = EXCLUDED.largest_win, largest_loss = EXCLUDED.largest_loss,
    sharpe_ratio = EXCLUDED.sharpe_ratio, avg_pnl = EXCLUDED.avg_pnl, pnl_std_dev = EXCLUDED.pnl_std_dev,
    max_win_streak = EXCLUDED.max_win_streak, max_loss_streak = EXCLUDED.max_loss_streak,
    current_streak = EXCLUDED.current_streak, current_streak_type = EXCLUDED.current_streak_type,
    weekday_stats = EXCLUDED.weekday_stats, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- 3. TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_account_metrics()
RETURNS TRIGGER AS $$
DECLARE
  target_account_id UUID;
  target_user_id UUID;
BEGIN
  -- Determine which account to update
  IF TG_OP = 'DELETE' THEN
    target_account_id := OLD.account_id;
    target_user_id := OLD.user_id;
  ELSE
    target_account_id := NEW.account_id;
    target_user_id := NEW.user_id;
  END IF;

  -- Call the helper function
  PERFORM update_account_metrics_for_account(target_account_id, target_user_id);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 4. CREATE TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_account_metrics ON public.trades;

CREATE TRIGGER trigger_update_account_metrics
AFTER INSERT OR UPDATE OR DELETE ON public.trades
FOR EACH ROW EXECUTE FUNCTION update_account_metrics();


-- 5. INITIAL POPULATION (populate metrics for existing accounts)
-- ============================================================================
DO $$
DECLARE
  acc RECORD;
BEGIN
  FOR acc IN SELECT DISTINCT account_id, user_id FROM public.trades LOOP
    PERFORM update_account_metrics_for_account(acc.account_id, acc.user_id);
  END LOOP;
END $$;

-- Done! Now metrics are calculated automatically on every trade change.
