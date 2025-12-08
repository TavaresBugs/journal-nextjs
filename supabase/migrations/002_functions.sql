-- ============================================
-- TRADING JOURNAL - CONSOLIDATED FUNCTIONS
-- ============================================
-- This file contains all functions, triggers, and views.
-- Run this AFTER 001_schema.sql and BEFORE 003_rls_policies.sql.
-- ============================================

-- ============================================
-- 1. UTILITY FUNCTIONS
-- ============================================

-- 1.1 Cached auth.uid() for better RLS performance
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.auth_uid IS 'Cached wrapper for auth.uid() to improve RLS performance';

-- 1.2 Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users_extended
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.3 Check if user is mentor of another
CREATE OR REPLACE FUNCTION public.is_mentor_of(p_mentor_id UUID, p_mentee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mentor_invites
        WHERE mentor_id = p_mentor_id
        AND mentee_id = p_mentee_id
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.4 Check if mentor can access specific account
CREATE OR REPLACE FUNCTION public.can_mentor_access_account(
    p_mentor_id UUID, 
    p_account_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.mentor_account_permissions map
        JOIN public.mentor_invites mi ON mi.id = map.invite_id
        JOIN public.accounts a ON a.id = map.account_id
        WHERE mi.mentor_id = p_mentor_id
        AND mi.mentee_id = a.user_id
        AND mi.status = 'accepted'
        AND map.account_id = p_account_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_routines_updated_at ON daily_routines;
CREATE TRIGGER update_daily_routines_updated_at BEFORE UPDATE ON daily_routines 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playbooks_updated_at ON playbooks;
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. MARKET SESSION CALCULATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_market_session()
RETURNS TRIGGER AS $$
DECLARE
    trade_time TIME;
BEGIN
    -- If session is already manually set, preserve it
    IF NEW.session IS NOT NULL AND NEW.session != '' AND NEW.session != 'N/A' THEN
        RETURN NEW;
    END IF;

    -- Ensure entry_time exists
    IF NEW.entry_time IS NULL OR NEW.entry_time = '' THEN
        RETURN NEW;
    END IF;

    -- Parse entry_time (text) to TIME
    BEGIN
        trade_time := NEW.entry_time::TIME;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEW;
    END;

    -- Determine Session (Times in New York)
    IF (trade_time >= '17:00:00' OR trade_time < '03:00:00') THEN
        NEW.session := 'Asian';
    ELSIF (trade_time >= '03:00:00' AND trade_time < '08:00:00') THEN
        NEW.session := 'London';
    ELSIF (trade_time >= '08:00:00' AND trade_time < '12:00:00') THEN
        NEW.session := 'Overlap';
    ELSIF (trade_time >= '12:00:00' AND trade_time < '17:00:00') THEN
        NEW.session := 'New-York';
    ELSE
        NEW.session := 'Asian';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_calculate_session ON trades;
CREATE TRIGGER trigger_calculate_session
    BEFORE INSERT OR UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_market_session();

-- ============================================
-- 4. NEW USER HANDLER (Auto-create users_extended)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  admin_email := current_setting('app.admin_email', true);

  INSERT INTO public.users_extended (id, email, name, avatar_url, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN admin_email IS NOT NULL AND NEW.email = admin_email THEN 'approved'
      ELSE 'pending'
    END,
    CASE
      WHEN admin_email IS NOT NULL AND NEW.email = admin_email THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Migrate existing users
INSERT INTO users_extended (id, email, name, avatar_url, status, role, approved_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.raw_user_meta_data->>'avatar_url',
  'approved',
  'user',
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM users_extended WHERE id = u.id);

-- ============================================
-- 5. AUDIT LOG FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 6. PLAYBOOK STAR TOGGLE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.toggle_playbook_star(p_shared_playbook_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid()
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid();

        UPDATE public.shared_playbooks
        SET stars = GREATEST(0, stars - 1)
        WHERE id = p_shared_playbook_id;

        RETURN FALSE;
    ELSE
        INSERT INTO public.playbook_stars (shared_playbook_id, user_id)
        VALUES (p_shared_playbook_id, auth.uid());

        UPDATE public.shared_playbooks
        SET stars = stars + 1
        WHERE id = p_shared_playbook_id;

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 7. JOURNAL STREAK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_journal_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
BEGIN
    WITH all_activity_dates AS (
        SELECT DISTINCT date::date AS activity_date
        FROM public.journal_entries
        WHERE user_id = p_user_id
        AND date <= CURRENT_DATE

        UNION

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
            WHEN last_date >= CURRENT_DATE - 1 THEN streak
            ELSE 0
        END INTO v_streak
    FROM latest_streak;

    RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 8. MENTOR INVITE ACCEPT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.accept_mentor_invite(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_invite_id UUID;
    v_mentee_email TEXT;
    v_user_email TEXT;
BEGIN
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    SELECT id, mentee_email INTO v_invite_id, v_mentee_email
    FROM public.mentor_invites
    WHERE invite_token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF v_invite_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF LOWER(v_mentee_email) != LOWER(v_user_email) THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.mentor_invites
    SET 
        mentee_id = auth.uid(),
        status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 9. LEADERBOARD VIEW
-- ============================================

DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view 
WITH (security_invoker = true) AS
SELECT
    l.user_id,
    l.display_name,
    l.show_win_rate,
    l.show_profit_factor,
    l.show_total_trades,
    l.show_pnl,
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
    (
        SELECT ROUND(AVG(rr)::numeric, 2)
        FROM (
            SELECT
                CASE
                    WHEN type = 'Long' THEN
                        (COALESCE(exit_price, entry_price) - entry_price) / NULLIF(ABS(entry_price - stop_loss), 0)
                    WHEN type = 'Short' THEN
                        (entry_price - COALESCE(exit_price, entry_price)) / NULLIF(ABS(stop_loss - entry_price), 0)
                END as rr
            FROM public.trades
            WHERE user_id = l.user_id
            AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND stop_loss IS NOT NULL
            AND entry_price IS NOT NULL
            AND entry_price != stop_loss
            AND outcome IS NOT NULL
        ) t
        WHERE rr IS NOT NULL
    ) AS avg_rr,
    public.get_user_journal_streak(l.user_id) as streak,
    l.created_at
FROM public.leaderboard_opt_in l
ORDER BY
    (SELECT COUNT(*) FILTER (WHERE outcome = 'win')::numeric / NULLIF(COUNT(*), 0)
     FROM public.trades
     WHERE user_id = l.user_id
     AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
    ) DESC NULLS LAST;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION public.auth_uid TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_uid TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mentor_of TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_mentor_access_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_playbook_star TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_journal_streak TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_mentor_invite TO authenticated;
GRANT SELECT ON public.leaderboard_view TO authenticated;
