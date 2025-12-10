-- ============================================
-- TRADING JOURNAL - SECURITY CLEANUP
-- ============================================
-- Este script resolve os alertas do Security Advisor do Supabase:
-- 1. Consolida políticas de journal_entry_trades (Multiple Permissive)
-- 2. Reforça RLS nas tabelas mental_* e journal_entries
-- 3. Garante políticas estritas para dados sensíveis
--
-- Execute no SQL Editor do Supabase.
-- ============================================

-- ============================================
-- 1. REFORÇAR RLS EM TODAS AS TABELAS CRÍTICAS
-- ============================================
-- O "Auth RLS Initialization Plan" alerta quando RLS pode não
-- estar ativo. Estes comandos são idempotentes (seguros para re-executar).

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_journals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CONSOLIDAR POLÍTICAS DE journal_entry_trades
-- ============================================
-- Remove TODAS as políticas existentes para evitar redundância

DROP POLICY IF EXISTS "journal_entry_trades_select" ON journal_entry_trades;
DROP POLICY IF EXISTS "journal_entry_trades_insert" ON journal_entry_trades;
DROP POLICY IF EXISTS "journal_entry_trades_delete" ON journal_entry_trades;
DROP POLICY IF EXISTS "journal_entry_trades_update" ON journal_entry_trades;
-- Políticas com nomes antigos que podem existir
DROP POLICY IF EXISTS "policy_owner_manage" ON journal_entry_trades;
DROP POLICY IF EXISTS "policy_visitor_view" ON journal_entry_trades;

-- Política 1: SELECT - Dono pode ver suas trades, Visitante pode ver se compartilhado
CREATE POLICY "jet_select_owner_or_shared" ON journal_entry_trades
    FOR SELECT USING (
        -- Dono: pode ver trades de seus próprios journal entries
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = public.auth_uid()
        )
        OR
        -- Visitante: pode ver se o journal está compartilhado e não expirou
        EXISTS (
            SELECT 1 FROM shared_journals sj
            WHERE sj.journal_entry_id = journal_entry_trades.journal_entry_id
            AND sj.expires_at > now()
        )
    );

-- Política 2: INSERT - Apenas o dono pode criar vínculos
CREATE POLICY "jet_insert_owner_only" ON journal_entry_trades
    FOR INSERT WITH CHECK (
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = public.auth_uid()
        )
    );

-- Política 3: DELETE - Apenas o dono pode remover vínculos  
CREATE POLICY "jet_delete_owner_only" ON journal_entry_trades
    FOR DELETE USING (
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = public.auth_uid()
        )
    );

-- ============================================
-- 3. VERIFICAR POLÍTICAS DAS TABELAS MENTAL_*
-- ============================================
-- As políticas já existem em 005_mental_logs.sql e 006_mental_hub.sql
-- Mas vamos garantir que estão corretas (DROP IF EXISTS + CREATE)

-- === MENTAL_LOGS ===
DROP POLICY IF EXISTS "Users can view own mental logs" ON mental_logs;
DROP POLICY IF EXISTS "Users can insert own mental logs" ON mental_logs;
DROP POLICY IF EXISTS "Users can delete own mental logs" ON mental_logs;
DROP POLICY IF EXISTS "Users can update own mental logs" ON mental_logs;

CREATE POLICY "mental_logs_select_owner" ON mental_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mental_logs_insert_owner" ON mental_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mental_logs_update_owner" ON mental_logs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mental_logs_delete_owner" ON mental_logs
    FOR DELETE USING (auth.uid() = user_id);

-- === MENTAL_ENTRIES ===
DROP POLICY IF EXISTS "Users can view own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON mental_entries;

CREATE POLICY "mental_entries_select_owner" ON mental_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mental_entries_insert_owner" ON mental_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mental_entries_update_owner" ON mental_entries
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mental_entries_delete_owner" ON mental_entries
    FOR DELETE USING (auth.uid() = user_id);

-- === MENTAL_PROFILES ===
DROP POLICY IF EXISTS "Users can view system and own profiles" ON mental_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON mental_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON mental_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON mental_profiles;

-- SELECT: Usuário vê profiles do sistema (is_system=true) + seus próprios
CREATE POLICY "mental_profiles_select" ON mental_profiles
    FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

-- INSERT: Usuário só pode criar profiles pessoais (não sistema)
CREATE POLICY "mental_profiles_insert_owner" ON mental_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- UPDATE: Usuário só pode atualizar seus próprios profiles
CREATE POLICY "mental_profiles_update_owner" ON mental_profiles
    FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE)
    WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- DELETE: Usuário só pode deletar seus próprios profiles
CREATE POLICY "mental_profiles_delete_owner" ON mental_profiles
    FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- ============================================
-- 4. GRANTS PARA ROLE ANON (Links Públicos)
-- ============================================
-- Permite que usuários não autenticados façam SELECT
-- (as políticas RLS ainda controlam o acesso real)

GRANT SELECT ON journal_entry_trades TO anon;
GRANT SELECT ON shared_journals TO anon;
GRANT SELECT ON journal_entries TO anon;
GRANT SELECT ON journal_images TO anon;

-- Mental tables: NÃO dar grant para anon (estritamente privadas)
-- Isso é intencional - dados psicológicos nunca são públicos

-- ============================================
-- PRONTO!
-- ============================================
-- Após executar este script:
-- 
-- ✅ journal_entry_trades: Políticas consolidadas
-- ✅ mental_*: Políticas estritas (owner only)
-- ✅ RLS reforçado em todas as tabelas críticas
-- ✅ Grants para anon apenas onde necessário
--
-- Para resolver "Leaked Password Protection":
-- → Dashboard → Authentication → Providers → Email
-- → Habilite "Leaked Password Protection"
-- ============================================
