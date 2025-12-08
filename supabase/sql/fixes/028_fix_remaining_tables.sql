-- ============================================
-- FIX: Tabelas Restantes (journal_images, leaderboard_opt_in, shared_journals)
-- Data: 2024-12-08
-- ============================================

-- Reutilizar função auxiliar
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
-- PARTE 1: JOURNAL_IMAGES
-- ============================================

SELECT public.temp_drop_all_policies('journal_images');

-- Uma única política SELECT que cobre owner e shared
CREATE POLICY "journal_images_select" ON public.journal_images
    FOR SELECT USING (
        -- Owner pode ver
        public.auth_uid() = user_id
        OR
        -- Imagens de journals compartilhados públicamente
        EXISTS (
            SELECT 1 FROM public.shared_journals
            WHERE shared_journals.journal_entry_id = journal_images.journal_entry_id
            AND shared_journals.expires_at > now()
        )
    );

CREATE POLICY "journal_images_insert" ON public.journal_images
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_images_update" ON public.journal_images
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_images_delete" ON public.journal_images
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 2: LEADERBOARD_OPT_IN
-- ============================================

SELECT public.temp_drop_all_policies('leaderboard_opt_in');

-- Uma única política SELECT: qualquer um pode ver
-- Uma política para gerenciar: apenas o owner
CREATE POLICY "leaderboard_opt_in_select" ON public.leaderboard_opt_in
    FOR SELECT USING (true);

CREATE POLICY "leaderboard_opt_in_insert" ON public.leaderboard_opt_in
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "leaderboard_opt_in_update" ON public.leaderboard_opt_in
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "leaderboard_opt_in_delete" ON public.leaderboard_opt_in
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 3: SHARED_JOURNALS
-- ============================================

SELECT public.temp_drop_all_policies('shared_journals');

-- Uma única política SELECT que cobre owner e public
CREATE POLICY "shared_journals_select" ON public.shared_journals
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        expires_at > now()
    );

CREATE POLICY "shared_journals_insert" ON public.shared_journals
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_journals_delete" ON public.shared_journals
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 4: SHARED_PLAYBOOKS
-- ============================================

SELECT public.temp_drop_all_policies('shared_playbooks');

CREATE POLICY "shared_playbooks_select" ON public.shared_playbooks
    FOR SELECT USING (
        is_public = true
        OR
        public.auth_uid() = user_id
    );

CREATE POLICY "shared_playbooks_insert" ON public.shared_playbooks
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_playbooks_update" ON public.shared_playbooks
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_playbooks_delete" ON public.shared_playbooks
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 5: PLAYBOOK_STARS
-- ============================================

SELECT public.temp_drop_all_policies('playbook_stars');

CREATE POLICY "playbook_stars_select" ON public.playbook_stars
    FOR SELECT USING (public.auth_uid() IS NOT NULL);

CREATE POLICY "playbook_stars_insert" ON public.playbook_stars
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbook_stars_delete" ON public.playbook_stars
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- PARTE 6: USERS_EXTENDED
-- ============================================

SELECT public.temp_drop_all_policies('users_extended');

-- Uma única política SELECT: owner OU admin
CREATE POLICY "users_extended_select" ON public.users_extended
    FOR SELECT USING (
        id = public.auth_uid()
        OR
        public.is_admin()
    );

CREATE POLICY "users_extended_insert" ON public.users_extended
    FOR INSERT WITH CHECK (id = public.auth_uid() OR public.is_admin());

CREATE POLICY "users_extended_update" ON public.users_extended
    FOR UPDATE USING (id = public.auth_uid() OR public.is_admin())
    WITH CHECK (id = public.auth_uid() OR public.is_admin());

CREATE POLICY "users_extended_delete" ON public.users_extended
    FOR DELETE USING (public.is_admin());

-- ============================================
-- PARTE 7: MENTOR_INVITES
-- ============================================

SELECT public.temp_drop_all_policies('mentor_invites');

CREATE POLICY "mentor_invites_select" ON public.mentor_invites
    FOR SELECT USING (
        mentor_id = public.auth_uid()
        OR
        (mentee_id = public.auth_uid() AND status = 'accepted')
        OR
        (
            EXISTS (
                SELECT 1 FROM auth.users u
                WHERE u.id = public.auth_uid()
                AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
            )
            AND status = 'pending'
            AND expires_at > NOW()
        )
    );

CREATE POLICY "mentor_invites_insert" ON public.mentor_invites
    FOR INSERT WITH CHECK (mentor_id = public.auth_uid());

CREATE POLICY "mentor_invites_update" ON public.mentor_invites
    FOR UPDATE USING (mentor_id = public.auth_uid() OR mentee_id = public.auth_uid());

CREATE POLICY "mentor_invites_delete" ON public.mentor_invites
    FOR DELETE USING (mentor_id = public.auth_uid());

-- ============================================
-- PARTE 8: MENTOR_ACCOUNT_PERMISSIONS
-- ============================================

SELECT public.temp_drop_all_policies('mentor_account_permissions');

CREATE POLICY "mentor_account_permissions_select" ON public.mentor_account_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND (mi.mentee_id = public.auth_uid() OR mi.mentor_id = public.auth_uid())
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_insert" ON public.mentor_account_permissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_update" ON public.mentor_account_permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_delete" ON public.mentor_account_permissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

-- ============================================
-- PARTE 9: TRADE_COMMENTS
-- ============================================

SELECT public.temp_drop_all_policies('trade_comments');

CREATE POLICY "trade_comments_select" ON public.trade_comments
    FOR SELECT USING (
        -- Dono do trade pode ver
        EXISTS (
            SELECT 1 FROM public.trades
            WHERE trades.id = trade_comments.trade_id
            AND trades.user_id = public.auth_uid()
        )
        OR
        -- Mentor pode ver
        EXISTS (
            SELECT 1 FROM public.trades t
            JOIN public.mentor_invites mi ON mi.mentee_id = t.user_id
            WHERE t.id = trade_comments.trade_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "trade_comments_insert" ON public.trade_comments
    FOR INSERT WITH CHECK (
        user_id = public.auth_uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.trades
                WHERE trades.id = trade_comments.trade_id
                AND trades.user_id = public.auth_uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.trades t
                JOIN public.mentor_invites mi ON mi.mentee_id = t.user_id
                WHERE t.id = trade_comments.trade_id
                AND mi.mentor_id = public.auth_uid()
                AND mi.status = 'accepted'
                AND mi.permission = 'comment'
            )
        )
    );

CREATE POLICY "trade_comments_delete" ON public.trade_comments
    FOR DELETE USING (user_id = public.auth_uid());

-- ============================================
-- PARTE 10: PLAYBOOKS
-- ============================================

SELECT public.temp_drop_all_policies('playbooks');

CREATE POLICY "playbooks_select" ON public.playbooks
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.shared_playbooks
            WHERE shared_playbooks.playbook_id = playbooks.id
            AND shared_playbooks.is_public = true
        )
    );

CREATE POLICY "playbooks_insert" ON public.playbooks
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbooks_update" ON public.playbooks
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbooks_delete" ON public.playbooks
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- LIMPEZA
-- ============================================

DROP FUNCTION IF EXISTS public.temp_drop_all_policies(TEXT);
