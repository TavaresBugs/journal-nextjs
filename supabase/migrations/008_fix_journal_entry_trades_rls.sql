-- ============================================
-- TRADING JOURNAL - RLS FIX: journal_entry_trades
-- ============================================
-- Este script corrige a política de SELECT da tabela
-- journal_entry_trades para permitir que visitantes de
-- links compartilhados possam visualizar as trades
-- vinculadas ao journal entry.
--
-- Execute no SQL Editor do Supabase APÓS 003_rls_policies.sql
-- ============================================

-- ============================================
-- 1. CORRIGIR POLÍTICA DE journal_entry_trades
-- ============================================

-- Remove a política existente (apenas owner)
DROP POLICY IF EXISTS "journal_entry_trades_select" ON journal_entry_trades;

-- Cria nova política com suporte a compartilhamento
-- Lógica: Owner pode ver OU visitante de link compartilhado válido pode ver
CREATE POLICY "journal_entry_trades_select" ON journal_entry_trades
    FOR SELECT USING (
        -- Regra 1: O dono do journal pode ver suas próprias trades vinculadas
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = public.auth_uid()
        )
        OR
        -- Regra 2: Visitantes podem ver se o journal está compartilhado e não expirou
        EXISTS (
            SELECT 1 FROM shared_journals
            WHERE shared_journals.journal_entry_id = journal_entry_trades.journal_entry_id
            AND shared_journals.expires_at > now()
        )
    );

-- ============================================
-- 2. GRANT PARA USUÁRIOS ANÔNIMOS
-- ============================================

-- Permite que usuários não autenticados (anon) possam executar SELECT
-- Nota: A política RLS ainda controla o acesso, isso apenas habilita
-- a capacidade de fazer a query
GRANT SELECT ON journal_entry_trades TO anon;

-- ============================================
-- PRONTO!
-- ============================================
-- Agora links compartilhados mostrarão as trades vinculadas.
-- 
-- As tabelas mental_* permanecem estritamente privadas:
-- - mental_logs: Owner only
-- - mental_entries: Owner only  
-- - mental_profiles: Owner + System defaults
-- ============================================
