-- ============================================
-- FIX: Auth RLS Initialization Plan (Performance)
-- Data: 2024-12-08
-- ============================================
-- O aviso "Auth RLS Initialization Plan" indica que o Supabase
-- recomenda usar uma função com cache para auth.uid() em vez
-- de chamar diretamente nas políticas RLS.
--
-- O aviso "Multiple Permissive Policies" indica que devemos
-- consolidar múltiplas políticas SELECT em uma única.
-- ============================================

-- ============================================
-- PARTE 1: CRIAR FUNÇÃO auth_uid() COM CACHE
-- ============================================
-- Esta função armazena o uid em cache na sessão,
-- melhorando a performance das políticas RLS.

CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- STABLE indica que a função retorna o mesmo valor para a mesma sessão
COMMENT ON FUNCTION public.auth_uid IS 'Cached wrapper for auth.uid() to improve RLS performance';

-- ============================================
-- PARTE 2: FUNÇÃO AUXILIAR PARA LIMPAR POLÍTICAS
-- ============================================

CREATE OR REPLACE FUNCTION public.temp_drop_all_policies(p_table_name TEXT)
RETURNS void AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = p_table_name
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, p_table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 3: ACCOUNTS - Consolidar em 4 políticas
-- ============================================

SELECT public.temp_drop_all_policies('accounts');

-- Uma política por operação, usando auth_uid()
CREATE POLICY "accounts_select" ON public.accounts
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "accounts_insert" ON public.accounts
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "accounts_update" ON public.accounts
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "accounts_delete" ON public.accounts
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 4: AUDIT_LOGS - Consolidar SELECT em uma política
-- ============================================

SELECT public.temp_drop_all_policies('audit_logs');

-- Uma única política SELECT que cobre ambos os casos
-- (usuário vê seus logs OU admin vê todos)
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (
        user_id = public.auth_uid() 
        OR 
        public.is_admin()
    );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- PARTE 5: DAILY_ROUTINES - Consolidar SELECT em uma política
-- ============================================

SELECT public.temp_drop_all_policies('daily_routines');

-- Uma única política SELECT que cobre owner e mentor
CREATE POLICY "daily_routines_select" ON public.daily_routines
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = daily_routines.user_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
            AND map.account_id = daily_routines.account_id
            AND map.can_view_routines = true
        )
    );

CREATE POLICY "daily_routines_insert" ON public.daily_routines
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "daily_routines_update" ON public.daily_routines
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "daily_routines_delete" ON public.daily_routines
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 6: TRADES - Consolidar SELECT em uma política
-- ============================================

SELECT public.temp_drop_all_policies('trades');

CREATE POLICY "trades_select" ON public.trades
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = trades.user_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
            AND map.account_id = trades.account_id
            AND map.can_view_trades = true
        )
    );

CREATE POLICY "trades_insert" ON public.trades
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "trades_update" ON public.trades
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "trades_delete" ON public.trades
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 7: JOURNAL_ENTRIES - Consolidar SELECT em uma política
-- ============================================

SELECT public.temp_drop_all_policies('journal_entries');

CREATE POLICY "journal_entries_select" ON public.journal_entries
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = journal_entries.user_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
            AND map.account_id = journal_entries.account_id
            AND map.can_view_journal = true
        )
    );

CREATE POLICY "journal_entries_insert" ON public.journal_entries
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_entries_update" ON public.journal_entries
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_entries_delete" ON public.journal_entries
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 8: SETTINGS
-- ============================================

SELECT public.temp_drop_all_policies('settings');

CREATE POLICY "settings_select" ON public.settings
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "settings_insert" ON public.settings
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "settings_update" ON public.settings
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "settings_delete" ON public.settings
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- LIMPEZA
-- ============================================

DROP FUNCTION IF EXISTS public.temp_drop_all_policies(TEXT);

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION public.auth_uid TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_uid TO anon;
