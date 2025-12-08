-- ============================================
-- FIX: user_settings e Índices Não Usados
-- Data: 2024-12-08
-- ============================================

-- ============================================
-- PARTE 1: CORRIGIR user_settings
-- ============================================

-- Função auxiliar
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

-- Limpar políticas de user_settings
SELECT public.temp_drop_all_policies('user_settings');

-- Recriar políticas consolidadas usando auth_uid()
CREATE POLICY "user_settings_select" ON public.user_settings
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "user_settings_insert" ON public.user_settings
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "user_settings_update" ON public.user_settings
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "user_settings_delete" ON public.user_settings
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 2: REMOVER ÍNDICES NÃO USADOS (OPCIONAL)
-- ============================================
-- ATENÇÃO: Remover índices pode impactar performance de queries
-- que ainda não foram executadas. Avalie se deseja remover.

-- Para ver quais índices estão não usados:
-- SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- AND schemaname = 'public';

-- Descomente as linhas abaixo para remover os índices não usados:

-- DROP INDEX IF EXISTS public.idx_audit_logs_user;
-- DROP INDEX IF EXISTS public.idx_audit_logs_action;
-- DROP INDEX IF EXISTS public.idx_mentor_reviews_is_read;
-- DROP INDEX IF EXISTS public.idx_shared_playbooks_stars;
-- DROP INDEX IF EXISTS public.idx_trade_comments_user;
-- DROP INDEX IF EXISTS public.idx_trade_comments_created;
-- DROP INDEX IF EXISTS public.idx_trades_outcome;
-- DROP INDEX IF EXISTS public.idx_trades_entry_date;

-- ============================================
-- LIMPEZA
-- ============================================

DROP FUNCTION IF EXISTS public.temp_drop_all_policies(TEXT);
