-- ============================================
-- Migration: Fix RLS using JWT email
-- Purpose: Allow mentees to see invites by checking email from JWT token
--          instead of querying auth.users (which is blocked)
-- ============================================

-- Drop existing policies that might use auth.users subqueries
DROP POLICY IF EXISTS "mentees_can_view_pending_invites" ON public.mentor_invites;
DROP POLICY IF EXISTS "mentees_can_accept_invites" ON public.mentor_invites;

-- 1. Policy for VIEWING pending invites
-- Using auth.jwt() ->> 'email' is secure and doesn't require table permissions
CREATE POLICY "mentees_can_view_pending_invites" ON public.mentor_invites
    FOR SELECT USING (
        -- Check if the invite email matches the current user's email
        LOWER(mentee_email) = LOWER((auth.jwt() ->> 'email'::text))
        AND status = 'pending'
    );

-- 2. Policy for ACCEPTING/REJECTING invites
CREATE POLICY "mentees_can_accept_invites" ON public.mentor_invites
    FOR UPDATE USING (
        -- Can only update if it's your email and pending
        LOWER(mentee_email) = LOWER((auth.jwt() ->> 'email'::text))
        AND status = 'pending'
    )
    WITH CHECK (
        -- Can claim the invite (set mentee_id to yourself)
        mentee_id = auth.uid()
        AND status IN ('accepted', 'rejected')
    );
