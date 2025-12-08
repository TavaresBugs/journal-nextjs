-- ============================================
-- FIX: Security Warnings do Supabase
-- Data: 2024-12-08
-- ============================================
-- Este script corrige os seguintes avisos de segurança:
-- 1. Multiple Permissive Policies (public.accounts)
-- 2. Auth RLS Initialization Plan (public.accounts)
-- 3. Function Search Path Mutable (várias funções)
-- 4. Security Definer View (public.leaderboard_view)
-- ============================================

-- ============================================
-- PARTE 1: CORRIGIR POLÍTICAS DUPLICADAS EM ACCOUNTS
-- ============================================

-- Remover TODAS as políticas existentes da tabela accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_policy" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_policy" ON public.accounts;

-- Criar políticas únicas e consolidadas
CREATE POLICY "accounts_select_own" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_own" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_own" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete_own" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PARTE 2: CORRIGIR FUNÇÕES COM SEARCH PATH MUTÁVEL
-- ============================================

-- 2.1: update_updated_at_column()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2.2: toggle_playbook_star() - SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.toggle_playbook_star(p_shared_playbook_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verificar se já deu star
    SELECT EXISTS (
        SELECT 1 FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid()
    ) INTO v_exists;

    IF v_exists THEN
        -- Remover star
        DELETE FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid();

        -- Decrementar contador
        UPDATE public.shared_playbooks
        SET stars = GREATEST(0, stars - 1)
        WHERE id = p_shared_playbook_id;

        RETURN FALSE; -- Não tem mais star
    ELSE
        -- Adicionar star
        INSERT INTO public.playbook_stars (shared_playbook_id, user_id)
        VALUES (p_shared_playbook_id, auth.uid());

        -- Incrementar contador
        UPDATE public.shared_playbooks
        SET stars = stars + 1
        WHERE id = p_shared_playbook_id;

        RETURN TRUE; -- Tem star agora
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.3: get_user_journal_streak() - SECURITY DEFINER
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.4: is_mentor_of() - SECURITY DEFINER
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

-- 2.5: handle_new_user() - SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Pega email do admin da config (se existir)
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

-- 2.6: log_audit() - SECURITY DEFINER
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
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.7: can_mentor_access_account() - SECURITY DEFINER
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

-- 2.8: calculate_market_session() - Trigger function
CREATE OR REPLACE FUNCTION public.calculate_market_session()
RETURNS TRIGGER AS $$
DECLARE
    trade_time TIME;
BEGIN
    -- If session is already manually set (and not empty/N/A), preserve it.
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
        RETURN NEW; -- return as is if time is invalid
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
        NEW.session := 'Asian'; -- Fallback
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- PARTE 3: CORRIGIR VIEW COM SECURITY DEFINER
-- ============================================

-- Recriar a view leaderboard_view com security_invoker
-- Nota: security_invoker requer PostgreSQL 15+
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
                WHEN stop_loss IS NULL OR entry_price IS NULL OR entry_price = stop_loss THEN 0
                WHEN type = 'Long' THEN (COALESCE(exit_price, current_price, entry_price) - entry_price) / ABS(entry_price - stop_loss)
                WHEN type = 'Short' THEN (entry_price - COALESCE(exit_price, current_price, entry_price)) / ABS(stop_loss - entry_price)
                ELSE 0
            END
        )::numeric, 2)
        FROM (
            SELECT type, entry_price, stop_loss, exit_price, entry_price as current_price
            FROM public.trades
            WHERE user_id = l.user_id
            AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND outcome IS NOT NULL
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

-- Garantir permissões na view
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Você pode verificar se as políticas foram criadas corretamente:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'accounts';

-- Verificar funções com seus atributos:
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('toggle_playbook_star', 'get_user_journal_streak', 'is_mentor_of', 'handle_new_user', 'log_audit', 'can_mentor_access_account', 'calculate_market_session', 'update_updated_at_column');
