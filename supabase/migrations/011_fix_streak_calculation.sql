-- Fix get_user_journal_streak to include trades dates (matching dashboard logic)
-- The dashboard calculates streak from BOTH journal entries AND trades dates

CREATE OR REPLACE FUNCTION public.get_user_journal_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
BEGIN
    WITH all_activity_dates AS (
        -- Journal entries dates
        SELECT DISTINCT date::date AS activity_date
        FROM public.journal_entries
        WHERE user_id = p_user_id
        AND date <= CURRENT_DATE
        
        UNION
        
        -- Trades dates (using entry_date)
        SELECT DISTINCT entry_date::date AS activity_date
        FROM public.trades
        WHERE user_id = p_user_id
        AND entry_date::date <= CURRENT_DATE
    ),
    groups AS (
        SELECT 
            activity_date,
            activity_date - CAST(ROW_NUMBER() OVER (ORDER BY activity_date) AS INTEGER) AS grp
        FROM all_activity_dates
    ),
    latest_streak AS (
        SELECT COUNT(*) as streak, MAX(activity_date) as last_date
        FROM groups
        GROUP BY grp
        ORDER BY MAX(activity_date) DESC
        LIMIT 1
    )
    SELECT 
        CASE 
            -- Streak is valid if last activity was today or yesterday
            WHEN last_date >= CURRENT_DATE - 1 THEN streak
            ELSE 0 
        END INTO v_streak
    FROM latest_streak;

    RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_journal_streak TO authenticated;

-- ============================================
-- FIX AVG RR CALCULATION
-- Problem: Previous formula included trades without stop_loss as 0, 
--          which pollutes the average. Solution: filter them out entirely.
-- ============================================

-- Updated Leaderboard View with fixed Avg RR calculation
-- Must DROP first because we're changing column definitions
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view AS
SELECT 
    l.user_id,
    l.display_name,
    l.show_win_rate,
    l.show_profit_factor,
    l.show_total_trades,
    l.show_pnl,
    -- Estatísticas mensais (Current Month)
    CASE WHEN l.show_total_trades THEN (
        SELECT COUNT(*) FROM public.trades 
        WHERE user_id = l.user_id 
        AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
    ) END AS total_trades,
    CASE WHEN l.show_win_rate THEN (
        SELECT ROUND(
            COUNT(*) FILTER (WHERE outcome = 'win')::numeric / NULLIF(COUNT(*), 0) * 100, 
            1
        ) FROM public.trades 
        WHERE user_id = l.user_id 
        AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
    ) END AS win_rate,
    CASE WHEN l.show_pnl THEN (
        SELECT COALESCE(SUM(pnl), 0) FROM public.trades 
        WHERE user_id = l.user_id 
        AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
    ) END AS total_pnl,
    
    -- Avg RR (FIXED: exclude trades without stop_loss instead of counting them as 0)
    (
        SELECT ROUND(AVG(rr)::numeric, 2)
        FROM (
            SELECT 
                CASE 
                    -- Long: (Exit - Entry) / (Entry - Stop)
                    WHEN type = 'Long' THEN 
                        (COALESCE(exit_price, entry_price) - entry_price) / NULLIF(ABS(entry_price - stop_loss), 0)
                    -- Short: (Entry - Exit) / (Stop - Entry)
                    WHEN type = 'Short' THEN 
                        (entry_price - COALESCE(exit_price, entry_price)) / NULLIF(ABS(stop_loss - entry_price), 0)
                END as rr
            FROM public.trades
            WHERE user_id = l.user_id 
            AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND stop_loss IS NOT NULL   -- Only include trades WITH stop loss
            AND entry_price IS NOT NULL
            AND entry_price != stop_loss  -- Exclude zero-risk trades
            AND outcome IS NOT NULL       -- Only closed trades
        ) t
        WHERE rr IS NOT NULL  -- Exclude NULL results from the average
    ) AS avg_rr,

    -- Streak (All Time - uses updated function with trades + journal)
    public.get_user_journal_streak(l.user_id) as streak,
    l.created_at
FROM public.leaderboard_opt_in l
ORDER BY 
    (SELECT COUNT(*) FILTER (WHERE outcome = 'win')::numeric / NULLIF(COUNT(*), 0) 
     FROM public.trades 
     WHERE user_id = l.user_id 
     AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
    ) DESC NULLS LAST;

-- Grant permissions
GRANT SELECT ON public.leaderboard_view TO authenticated;

