-- ============================================
-- TRADING JOURNAL - CONSOLIDATED RLS POLICIES
-- ============================================
-- This file contains all Row Level Security policies.
-- Run this AFTER 001_schema.sql and 002_functions.sql.
-- 
-- All policies use public.auth_uid() for better performance.
-- Each table has exactly 4 policies (select, insert, update, delete).
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_account_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_opt_in ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: Drop all existing policies
-- ============================================

CREATE OR REPLACE FUNCTION temp_drop_all_policies(p_table_name TEXT)
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
-- 1. ACCOUNTS
-- ============================================

SELECT temp_drop_all_policies('accounts');

CREATE POLICY "accounts_select" ON accounts
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "accounts_insert" ON accounts
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "accounts_update" ON accounts
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "accounts_delete" ON accounts
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 2. TRADES (Owner + Mentor can view)
-- ============================================

SELECT temp_drop_all_policies('trades');

CREATE POLICY "trades_select" ON trades
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            JOIN mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = trades.user_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
            AND map.account_id = trades.account_id
            AND map.can_view_trades = true
        )
    );

CREATE POLICY "trades_insert" ON trades
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "trades_update" ON trades
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "trades_delete" ON trades
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 3. JOURNAL ENTRIES (Owner + Mentor + Shared)
-- ============================================

SELECT temp_drop_all_policies('journal_entries');

CREATE POLICY "journal_entries_select" ON journal_entries
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            JOIN mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = journal_entries.user_id
            AND mi.mentor_id = public.auth_uid()
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
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_entries_update" ON journal_entries
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_entries_delete" ON journal_entries
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 4. JOURNAL ENTRY TRADES (Junction)
-- ============================================

SELECT temp_drop_all_policies('journal_entry_trades');

CREATE POLICY "journal_entry_trades_select" ON journal_entry_trades
    FOR SELECT USING (
        journal_entry_id IN (SELECT id FROM journal_entries WHERE user_id = public.auth_uid())
    );

CREATE POLICY "journal_entry_trades_insert" ON journal_entry_trades
    FOR INSERT WITH CHECK (
        journal_entry_id IN (SELECT id FROM journal_entries WHERE user_id = public.auth_uid())
    );

CREATE POLICY "journal_entry_trades_delete" ON journal_entry_trades
    FOR DELETE USING (
        journal_entry_id IN (SELECT id FROM journal_entries WHERE user_id = public.auth_uid())
    );

-- ============================================
-- 5. JOURNAL IMAGES (Owner + Shared)
-- ============================================

SELECT temp_drop_all_policies('journal_images');

CREATE POLICY "journal_images_select" ON journal_images
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM shared_journals
            WHERE shared_journals.journal_entry_id = journal_images.journal_entry_id
            AND shared_journals.expires_at > now()
        )
    );

CREATE POLICY "journal_images_insert" ON journal_images
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_images_update" ON journal_images
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "journal_images_delete" ON journal_images
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 6. DAILY ROUTINES (Owner + Mentor)
-- ============================================

SELECT temp_drop_all_policies('daily_routines');

CREATE POLICY "daily_routines_select" ON daily_routines
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            JOIN mentor_account_permissions map ON map.invite_id = mi.id
            WHERE mi.mentee_id = daily_routines.user_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
            AND map.account_id = daily_routines.account_id
            AND map.can_view_routines = true
        )
    );

CREATE POLICY "daily_routines_insert" ON daily_routines
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "daily_routines_update" ON daily_routines
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "daily_routines_delete" ON daily_routines
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 7. SETTINGS
-- ============================================

SELECT temp_drop_all_policies('settings');

CREATE POLICY "settings_select" ON settings
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "settings_insert" ON settings
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "settings_update" ON settings
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "settings_delete" ON settings
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 8. USER SETTINGS
-- ============================================

SELECT temp_drop_all_policies('user_settings');

CREATE POLICY "user_settings_select" ON user_settings
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "user_settings_insert" ON user_settings
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "user_settings_update" ON user_settings
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "user_settings_delete" ON user_settings
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 9. PLAYBOOKS (Owner + Public Shared)
-- ============================================

SELECT temp_drop_all_policies('playbooks');

CREATE POLICY "playbooks_select" ON playbooks
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM shared_playbooks
            WHERE shared_playbooks.playbook_id = playbooks.id
            AND shared_playbooks.is_public = true
        )
    );

CREATE POLICY "playbooks_insert" ON playbooks
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbooks_update" ON playbooks
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbooks_delete" ON playbooks
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 10. SHARED JOURNALS (Owner + Public)
-- ============================================

SELECT temp_drop_all_policies('shared_journals');

CREATE POLICY "shared_journals_select" ON shared_journals
    FOR SELECT USING (
        public.auth_uid() = user_id
        OR
        expires_at > now()
    );

CREATE POLICY "shared_journals_insert" ON shared_journals
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_journals_delete" ON shared_journals
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 11. USERS EXTENDED (Owner + Admin)
-- ============================================

SELECT temp_drop_all_policies('users_extended');

CREATE POLICY "users_extended_select" ON users_extended
    FOR SELECT USING (
        id = public.auth_uid()
        OR
        public.is_admin()
        OR
        true -- Allow reading public names for community features
    );

CREATE POLICY "users_extended_insert" ON users_extended
    FOR INSERT WITH CHECK (id = public.auth_uid() OR public.is_admin());

CREATE POLICY "users_extended_update" ON users_extended
    FOR UPDATE USING (id = public.auth_uid() OR public.is_admin())
    WITH CHECK (id = public.auth_uid() OR public.is_admin());

CREATE POLICY "users_extended_delete" ON users_extended
    FOR DELETE USING (public.is_admin());

-- ============================================
-- 12. AUDIT LOGS (Owner + Admin)
-- ============================================

SELECT temp_drop_all_policies('audit_logs');

CREATE POLICY "audit_logs_select" ON audit_logs
    FOR SELECT USING (
        user_id = public.auth_uid() 
        OR 
        public.is_admin()
    );

CREATE POLICY "audit_logs_insert" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 13. MENTOR INVITES
-- ============================================

SELECT temp_drop_all_policies('mentor_invites');

CREATE POLICY "mentor_invites_select" ON mentor_invites
    FOR SELECT USING (
        mentor_id = public.auth_uid()
        OR
        (mentee_id = public.auth_uid() AND status = 'accepted')
        OR
        (
            LOWER(mentee_email) = LOWER((auth.jwt() ->> 'email'::text))
            AND status = 'pending'
        )
    );

CREATE POLICY "mentor_invites_insert" ON mentor_invites
    FOR INSERT WITH CHECK (mentor_id = public.auth_uid());

CREATE POLICY "mentor_invites_update" ON mentor_invites
    FOR UPDATE USING (mentor_id = public.auth_uid() OR mentee_id = public.auth_uid());

CREATE POLICY "mentor_invites_delete" ON mentor_invites
    FOR DELETE USING (mentor_id = public.auth_uid());

-- ============================================
-- 14. TRADE COMMENTS
-- ============================================

SELECT temp_drop_all_policies('trade_comments');

CREATE POLICY "trade_comments_select" ON trade_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_comments.trade_id
            AND trades.user_id = public.auth_uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM trades t
            JOIN mentor_invites mi ON mi.mentee_id = t.user_id
            WHERE t.id = trade_comments.trade_id
            AND mi.mentor_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "trade_comments_insert" ON trade_comments
    FOR INSERT WITH CHECK (
        user_id = public.auth_uid()
        AND (
            EXISTS (
                SELECT 1 FROM trades
                WHERE trades.id = trade_comments.trade_id
                AND trades.user_id = public.auth_uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM trades t
                JOIN mentor_invites mi ON mi.mentee_id = t.user_id
                WHERE t.id = trade_comments.trade_id
                AND mi.mentor_id = public.auth_uid()
                AND mi.status = 'accepted'
                AND mi.permission = 'comment'
            )
        )
    );

CREATE POLICY "trade_comments_delete" ON trade_comments
    FOR DELETE USING (user_id = public.auth_uid());

-- ============================================
-- 15. MENTOR REVIEWS
-- ============================================

SELECT temp_drop_all_policies('mentor_reviews');

CREATE POLICY "mentor_reviews_select" ON mentor_reviews
    FOR SELECT USING (
        public.auth_uid() = mentor_id
        OR
        public.auth_uid() = mentee_id
    );

CREATE POLICY "mentor_reviews_insert" ON mentor_reviews
    FOR INSERT WITH CHECK (
        public.auth_uid() = mentor_id 
        AND EXISTS (
            SELECT 1 FROM mentor_invites
            WHERE mentor_invites.mentor_id = public.auth_uid()
            AND mentor_invites.mentee_id = mentor_reviews.mentee_id
            AND mentor_invites.status = 'accepted'
        )
    );

CREATE POLICY "mentor_reviews_update" ON mentor_reviews
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

CREATE POLICY "mentor_reviews_delete" ON mentor_reviews
    FOR DELETE USING (public.auth_uid() = mentor_id);

-- ============================================
-- 16. MENTOR ACCOUNT PERMISSIONS
-- ============================================

SELECT temp_drop_all_policies('mentor_account_permissions');

CREATE POLICY "mentor_account_permissions_select" ON mentor_account_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND (mi.mentee_id = public.auth_uid() OR mi.mentor_id = public.auth_uid())
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_insert" ON mentor_account_permissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_update" ON mentor_account_permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

CREATE POLICY "mentor_account_permissions_delete" ON mentor_account_permissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mentor_invites mi
            WHERE mi.id = mentor_account_permissions.invite_id
            AND mi.mentee_id = public.auth_uid()
            AND mi.status = 'accepted'
        )
    );

-- ============================================
-- 17. SHARED PLAYBOOKS
-- ============================================

SELECT temp_drop_all_policies('shared_playbooks');

CREATE POLICY "shared_playbooks_select" ON shared_playbooks
    FOR SELECT USING (
        is_public = true
        OR
        public.auth_uid() = user_id
    );

CREATE POLICY "shared_playbooks_insert" ON shared_playbooks
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_playbooks_update" ON shared_playbooks
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "shared_playbooks_delete" ON shared_playbooks
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 18. PLAYBOOK STARS
-- ============================================

SELECT temp_drop_all_policies('playbook_stars');

CREATE POLICY "playbook_stars_select" ON playbook_stars
    FOR SELECT USING (public.auth_uid() IS NOT NULL);

CREATE POLICY "playbook_stars_insert" ON playbook_stars
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "playbook_stars_delete" ON playbook_stars
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 19. LEADERBOARD OPT-IN
-- ============================================

SELECT temp_drop_all_policies('leaderboard_opt_in');

CREATE POLICY "leaderboard_opt_in_select" ON leaderboard_opt_in
    FOR SELECT USING (true);

CREATE POLICY "leaderboard_opt_in_insert" ON leaderboard_opt_in
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "leaderboard_opt_in_update" ON leaderboard_opt_in
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "leaderboard_opt_in_delete" ON leaderboard_opt_in
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- STORAGE POLICIES (Journal Images Bucket)
-- ============================================

DROP POLICY IF EXISTS "Public Select Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Journal Images" ON storage.objects;

CREATE POLICY "Public Select Journal Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'journal-images' );

CREATE POLICY "Authenticated Insert Journal Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'journal-images' );

CREATE POLICY "Authenticated Update Journal Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'journal-images' );

CREATE POLICY "Authenticated Delete Journal Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'journal-images' );

-- ============================================
-- CLEANUP
-- ============================================

DROP FUNCTION IF EXISTS temp_drop_all_policies(TEXT);

-- ============================================
-- ALL GRANTS
-- ============================================

GRANT ALL ON accounts TO authenticated;
GRANT ALL ON trades TO authenticated;
GRANT ALL ON journal_entries TO authenticated;
GRANT ALL ON journal_entry_trades TO authenticated;
GRANT ALL ON journal_images TO authenticated;
GRANT ALL ON daily_routines TO authenticated;
GRANT ALL ON settings TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON playbooks TO authenticated;
GRANT ALL ON shared_journals TO authenticated;
GRANT ALL ON users_extended TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON mentor_invites TO authenticated;
GRANT ALL ON trade_comments TO authenticated;
GRANT ALL ON mentor_reviews TO authenticated;
GRANT ALL ON mentor_account_permissions TO authenticated;
GRANT ALL ON shared_playbooks TO authenticated;
GRANT ALL ON playbook_stars TO authenticated;
GRANT ALL ON leaderboard_opt_in TO authenticated;
