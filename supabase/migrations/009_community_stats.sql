-- Function to calculate current journal streak
CREATE OR REPLACE FUNCTION public.get_user_journal_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
BEGIN
    WITH dates AS (
        SELECT DISTINCT date AS entry_date
        FROM public.journal_entries
        WHERE user_id = p_user_id
        AND date <= CURRENT_DATE
    ),
    groups AS (
        SELECT 
            entry_date,
            entry_date - CAST(ROW_NUMBER() OVER (ORDER BY entry_date) AS INTEGER) AS grp
        FROM dates
    ),
    latest_streak AS (
        SELECT COUNT(*) as streak, MAX(entry_date) as last_date
        FROM groups
        GROUP BY grp
        ORDER BY MAX(entry_date) DESC
        LIMIT 1
    )
    SELECT 
        CASE 
            WHEN last_date >= CURRENT_DATE - 1 THEN streak
            ELSE 0 
        END INTO v_streak
    FROM latest_streak;

    RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Leaderboard View to use Monthly Stats
CREATE OR REPLACE VIEW public.leaderboard_view AS
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
    
    -- Avg RR (Avg Risk:Reward)
    (
        SELECT ROUND(AVG(
            CASE 
                -- Se não tem stop loss ou entry price, não calcula risco
                WHEN stop_loss IS NULL OR entry_price IS NULL OR entry_price = stop_loss THEN 0
                -- Long: (Exit - Entry) / (Entry - Stop)
                WHEN type = 'Long' THEN (COALESCE(exit_price, current_price, entry_price) - entry_price) / ABS(entry_price - stop_loss)
                -- Short: (Entry - Exit) / (Stop - Entry)
                WHEN type = 'Short' THEN (entry_price - COALESCE(exit_price, current_price, entry_price)) / ABS(stop_loss - entry_price)
                ELSE 0
            END
        )::numeric, 2)
        FROM (
            SELECT type, entry_price, stop_loss, exit_price, entry_price as current_price -- current_price simplified to entry for calculation if exit missing
            FROM public.trades
            WHERE user_id = l.user_id 
            AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND outcome IS NOT NULL -- Only closed trades ideally, or use exit_price check
        ) t
    ) AS avg_rr,

    -- Streak (All Time)
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
GRANT EXECUTE ON FUNCTION public.get_user_journal_streak TO authenticated;
GRANT SELECT ON public.leaderboard_view TO authenticated;
