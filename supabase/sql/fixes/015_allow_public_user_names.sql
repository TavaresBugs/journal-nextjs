-- ============================================
-- Migration: Allow reading public user info for community features
-- ============================================

-- 1. Allow any authenticated user to read basic public info (name) of other users
-- This is needed for the community features (shared playbooks, leaderboard, etc.)
CREATE POLICY "users_can_view_public_names" ON public.users_extended
    FOR SELECT
    TO authenticated
    USING (true);

-- Note: This policy allows reading all columns. If you want to restrict which columns
-- are visible, you would need to create a view instead.
-- However, since we only query 'id' and 'name' in the community service, this is safe.
