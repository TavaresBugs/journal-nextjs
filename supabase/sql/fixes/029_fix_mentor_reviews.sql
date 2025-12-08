-- ============================================
-- FIX: mentor_reviews - Consolidar Políticas
-- Data: 2024-12-08
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

-- Limpar todas as políticas
SELECT public.temp_drop_all_policies('mentor_reviews');

-- Uma única política SELECT que cobre mentor e mentee
CREATE POLICY "mentor_reviews_select" ON public.mentor_reviews
    FOR SELECT USING (
        public.auth_uid() = mentor_id
        OR
        public.auth_uid() = mentee_id
    );

-- Uma única política INSERT para mentor
CREATE POLICY "mentor_reviews_insert" ON public.mentor_reviews
    FOR INSERT WITH CHECK (
        public.auth_uid() = mentor_id 
        AND EXISTS (
            SELECT 1 FROM public.mentor_invites
            WHERE mentor_invites.mentor_id = public.auth_uid()
            AND mentor_invites.mentee_id = mentor_reviews.mentee_id
            AND mentor_invites.status = 'accepted'
        )
    );

-- Uma única política UPDATE que cobre mentor e mentee (update read status)
CREATE POLICY "mentor_reviews_update" ON public.mentor_reviews
    FOR UPDATE USING (
        public.auth_uid() = mentor_id
        OR
        public.auth_uid() = mentee_id
    )
    WITH CHECK (
        public.auth_uid() = mentor_id
        OR
        public.auth_uid() = mentee_id
    );

-- Delete apenas para mentor
CREATE POLICY "mentor_reviews_delete" ON public.mentor_reviews
    FOR DELETE USING (public.auth_uid() = mentor_id);

-- Limpeza
DROP FUNCTION IF EXISTS public.temp_drop_all_policies(TEXT);
