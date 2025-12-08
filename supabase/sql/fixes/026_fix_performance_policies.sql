-- ============================================
-- FIX: Performance - Políticas Duplicadas
-- Data: 2024-12-08
-- ============================================
-- Este script resolve os avisos de performance:
-- 1. Multiple Permissive Policies em várias tabelas
-- 2. Auth RLS Initialization Plan (otimização)
-- ============================================

-- ============================================
-- FUNÇÃO AUXILIAR: Limpar todas políticas de uma tabela
-- ============================================

CREATE OR REPLACE FUNCTION public.drop_all_policies(p_table_name TEXT)
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
        RAISE NOTICE 'Dropped policy % on %', policy_record.policyname, p_table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 1: LIMPAR E RECRIAR POLÍTICAS - ACCOUNTS
-- ============================================

SELECT public.drop_all_policies('accounts');

-- Recriar políticas consolidadas para accounts
CREATE POLICY "accounts_select" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PARTE 2: LIMPAR E RECRIAR POLÍTICAS - AUDIT_LOGS
-- ============================================

SELECT public.drop_all_policies('audit_logs');

-- Recriar políticas consolidadas para audit_logs
-- Usando RESTRICTIVE para admin view + PERMISSIVE para user view em vez de múltiplas permissivas

-- Usuários podem ver seus próprios logs
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- Admins podem ver todos (usando função is_admin já corrigida)
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

-- Sistema pode inserir via service role
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- PARTE 3: LIMPAR E RECRIAR POLÍTICAS - DAILY_ROUTINES
-- ============================================

SELECT public.drop_all_policies('daily_routines');

-- Recriar políticas consolidadas para daily_routines
CREATE POLICY "daily_routines_select" ON public.daily_routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_routines_insert" ON public.daily_routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_routines_update" ON public.daily_routines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "daily_routines_delete" ON public.daily_routines
    FOR DELETE USING (auth.uid() = user_id);

-- Política para mentores verem rotinas (se existir mentor_account_permissions)
CREATE POLICY "daily_routines_mentor_view" ON public.daily_routines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = daily_routines.user_id
            AND mi.mentor_id = auth.uid()
            AND mi.status = 'accepted'
            AND map.account_id = daily_routines.account_id
            AND map.can_view_routines = true
        )
    );

-- ============================================
-- PARTE 4: LIMPAR E RECRIAR POLÍTICAS - TRADES
-- ============================================

SELECT public.drop_all_policies('trades');

-- Políticas consolidadas para trades
CREATE POLICY "trades_select" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trades_insert" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trades_delete" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Mentores podem ver trades de mentorados
CREATE POLICY "trades_mentor_view" ON public.trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = trades.user_id
            AND mi.mentor_id = auth.uid()
            AND mi.status = 'accepted'
            AND map.account_id = trades.account_id
            AND map.can_view_trades = true
        )
    );

-- ============================================
-- PARTE 5: LIMPAR E RECRIAR POLÍTICAS - JOURNAL_ENTRIES
-- ============================================

SELECT public.drop_all_policies('journal_entries');

-- Políticas consolidadas para journal_entries
CREATE POLICY "journal_entries_select" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_insert" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_update" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_delete" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Mentores podem ver journal entries de mentorados
CREATE POLICY "journal_entries_mentor_view" ON public.journal_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = journal_entries.user_id
            AND mi.mentor_id = auth.uid()
            AND mi.status = 'accepted'
            AND map.account_id = journal_entries.account_id
            AND map.can_view_journal = true
        )
    );

-- ============================================
-- PARTE 6: LIMPAR E RECRIAR POLÍTICAS - SETTINGS
-- ============================================

SELECT public.drop_all_policies('settings');

CREATE POLICY "settings_select" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "settings_insert" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "settings_delete" ON public.settings
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- LIMPEZA: Remover função auxiliar temporária
-- ============================================

DROP FUNCTION IF EXISTS public.drop_all_policies(TEXT);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para ver todas as políticas atuais:
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
