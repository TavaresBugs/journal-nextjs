-- ============================================
-- Migration: Fix mentee RLS policies
-- Remove expires_at from RLS check (handled in code)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "mentees_can_view_pending_invites" ON public.mentor_invites;
DROP POLICY IF EXISTS "mentees_can_accept_invites" ON public.mentor_invites;

-- Recreate with simpler check (no expires_at in RLS)
CREATE POLICY "mentees_can_view_pending_invites" ON public.mentor_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
        )
        AND status = 'pending'
    );

-- Mentorado pode atualizar convites pendentes para aceitar/rejeitar
CREATE POLICY "mentees_can_accept_invites" ON public.mentor_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
        )
        AND status = 'pending'
    )
    WITH CHECK (
        mentee_id = auth.uid()
        AND status IN ('accepted', 'rejected')
    );
