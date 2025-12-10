-- ============================================
-- TRADING JOURNAL - PERFORMANCE & DUPLICATE FIX
-- ============================================
-- Este script resolve:
-- 1. Políticas legadas duplicadas em journal_entry_trades
-- 2. Performance: auth.uid() → (select auth.uid())
--
-- A otimização (select auth.uid()) evita reavaliação por linha,
-- executando a função apenas uma vez por query.
--
-- Execute no SQL Editor do Supabase.
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS LEGADAS (journal_entry_trades)
-- ============================================
-- Nomes exatos do log do Supabase

DROP POLICY IF EXISTS "Users can view their own journal_entry_trades" ON journal_entry_trades;
DROP POLICY IF EXISTS "Users can insert their own journal_entry_trades" ON journal_entry_trades;
DROP POLICY IF EXISTS "Users can update their own journal_entry_trades" ON journal_entry_trades;
DROP POLICY IF EXISTS "Users can delete their own journal_entry_trades" ON journal_entry_trades;

-- Nomes do script 009 (para recriar com otimização)
DROP POLICY IF EXISTS "jet_select_owner_or_shared" ON journal_entry_trades;
DROP POLICY IF EXISTS "jet_insert_owner_only" ON journal_entry_trades;
DROP POLICY IF EXISTS "jet_delete_owner_only" ON journal_entry_trades;

-- Nomes do script 003 original
DROP POLICY IF EXISTS "journal_entry_trades_select" ON journal_entry_trades;
DROP POLICY IF EXISTS "journal_entry_trades_insert" ON journal_entry_trades;
DROP POLICY IF EXISTS "journal_entry_trades_delete" ON journal_entry_trades;

-- ============================================
-- 2. JOURNAL_ENTRY_TRADES - Políticas Otimizadas
-- ============================================

CREATE POLICY "jet_select_owner_or_shared" ON journal_entry_trades
    FOR SELECT USING (
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = (select auth.uid())
        )
        OR
        EXISTS (
            SELECT 1 FROM shared_journals sj
            WHERE sj.journal_entry_id = journal_entry_trades.journal_entry_id
            AND sj.expires_at > now()
        )
    );

CREATE POLICY "jet_insert_owner_only" ON journal_entry_trades
    FOR INSERT WITH CHECK (
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "jet_delete_owner_only" ON journal_entry_trades
    FOR DELETE USING (
        journal_entry_id IN (
            SELECT id FROM journal_entries 
            WHERE user_id = (select auth.uid())
        )
    );

-- ============================================
-- 3. MENTAL_LOGS - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "mental_logs_select_owner" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs_insert_owner" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs_update_owner" ON mental_logs;
DROP POLICY IF EXISTS "mental_logs_delete_owner" ON mental_logs;
DROP POLICY IF EXISTS "Users can view own mental logs" ON mental_logs;
DROP POLICY IF EXISTS "Users can insert own mental logs" ON mental_logs;
DROP POLICY IF EXISTS "Users can delete own mental logs" ON mental_logs;

CREATE POLICY "mental_logs_select_owner" ON mental_logs
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "mental_logs_insert_owner" ON mental_logs
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "mental_logs_update_owner" ON mental_logs
    FOR UPDATE USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "mental_logs_delete_owner" ON mental_logs
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================
-- 4. MENTAL_ENTRIES - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "mental_entries_select_owner" ON mental_entries;
DROP POLICY IF EXISTS "mental_entries_insert_owner" ON mental_entries;
DROP POLICY IF EXISTS "mental_entries_update_owner" ON mental_entries;
DROP POLICY IF EXISTS "mental_entries_delete_owner" ON mental_entries;
DROP POLICY IF EXISTS "Users can view own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON mental_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON mental_entries;

CREATE POLICY "mental_entries_select_owner" ON mental_entries
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "mental_entries_insert_owner" ON mental_entries
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "mental_entries_update_owner" ON mental_entries
    FOR UPDATE USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "mental_entries_delete_owner" ON mental_entries
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================
-- 5. MENTAL_PROFILES - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "mental_profiles_select" ON mental_profiles;
DROP POLICY IF EXISTS "mental_profiles_insert_owner" ON mental_profiles;
DROP POLICY IF EXISTS "mental_profiles_update_owner" ON mental_profiles;
DROP POLICY IF EXISTS "mental_profiles_delete_owner" ON mental_profiles;
DROP POLICY IF EXISTS "Users can view system and own profiles" ON mental_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON mental_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON mental_profiles;

CREATE POLICY "mental_profiles_select" ON mental_profiles
    FOR SELECT USING (is_system = TRUE OR (select auth.uid()) = user_id);

CREATE POLICY "mental_profiles_insert_owner" ON mental_profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id AND is_system = FALSE);

CREATE POLICY "mental_profiles_update_owner" ON mental_profiles
    FOR UPDATE USING ((select auth.uid()) = user_id AND is_system = FALSE)
    WITH CHECK ((select auth.uid()) = user_id AND is_system = FALSE);

CREATE POLICY "mental_profiles_delete_owner" ON mental_profiles
    FOR DELETE USING ((select auth.uid()) = user_id AND is_system = FALSE);

-- ============================================
-- 6. JOURNAL_ENTRIES - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "journal_entries_select" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_update" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries_delete" ON journal_entries;

CREATE POLICY "journal_entries_select" ON journal_entries
    FOR SELECT USING (
        (select auth.uid()) = user_id
        OR
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            JOIN mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = journal_entries.user_id
            AND mi.mentor_id = (select auth.uid())
            AND mi.status = 'accepted'
            AND map.account_id = journal_entries.account_id
            AND map.can_view_journal = true
        )
        OR
        EXISTS (
            SELECT 1 FROM shared_journals
            WHERE shared_journals.journal_entry_id = journal_entries.id
            AND shared_journals.expires_at > now()
        )
    );

CREATE POLICY "journal_entries_insert" ON journal_entries
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "journal_entries_update" ON journal_entries
    FOR UPDATE USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "journal_entries_delete" ON journal_entries
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================
-- 7. JOURNAL_IMAGES - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "journal_images_select" ON journal_images;
DROP POLICY IF EXISTS "journal_images_insert" ON journal_images;
DROP POLICY IF EXISTS "journal_images_update" ON journal_images;
DROP POLICY IF EXISTS "journal_images_delete" ON journal_images;

CREATE POLICY "journal_images_select" ON journal_images
    FOR SELECT USING (
        (select auth.uid()) = user_id
        OR
        EXISTS (
            SELECT 1 FROM shared_journals
            WHERE shared_journals.journal_entry_id = journal_images.journal_entry_id
            AND shared_journals.expires_at > now()
        )
    );

CREATE POLICY "journal_images_insert" ON journal_images
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "journal_images_update" ON journal_images
    FOR UPDATE USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "journal_images_delete" ON journal_images
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================
-- 8. SHARED_JOURNALS - Políticas Otimizadas
-- ============================================

DROP POLICY IF EXISTS "shared_journals_select" ON shared_journals;
DROP POLICY IF EXISTS "shared_journals_insert" ON shared_journals;
DROP POLICY IF EXISTS "shared_journals_delete" ON shared_journals;

CREATE POLICY "shared_journals_select" ON shared_journals
    FOR SELECT USING (
        (select auth.uid()) = user_id
        OR
        expires_at > now()
    );

CREATE POLICY "shared_journals_insert" ON shared_journals
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "shared_journals_delete" ON shared_journals
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================
-- PRONTO!
-- ============================================
-- Após executar este script:
-- 
-- ✅ Políticas legadas "Users can..." removidas
-- ✅ Todas as políticas usam (select auth.uid())
-- ✅ Lógica de compartilhamento preservada
-- ✅ Performance otimizada
-- ============================================
