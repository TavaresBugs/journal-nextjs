-- ============================================
-- Migration: FIX Mentor Mode Schema
-- Adiciona mentee_email para o novo fluxo
-- (Mentor convida Mentorado)
-- ============================================

-- 1. Adicionar coluna mentee_email se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mentor_invites' 
        AND column_name = 'mentee_email'
    ) THEN
        ALTER TABLE public.mentor_invites 
        ADD COLUMN mentee_email TEXT;
    END IF;
END $$;

-- 2. Tornar mentor_id NOT NULL (mentor é quem envia agora)
-- Primeiro, preencher mentor_id com um valor padrão para registros antigos
UPDATE public.mentor_invites 
SET mentor_id = mentee_id 
WHERE mentor_id IS NULL;

-- 3. Tornar mentee_id nullable (preenchido quando mentorado aceita)
ALTER TABLE public.mentor_invites 
ALTER COLUMN mentee_id DROP NOT NULL;

-- 4. Preencher mentee_email para registros existentes
UPDATE public.mentor_invites 
SET mentee_email = mentor_email 
WHERE mentee_email IS NULL;

-- 5. Adicionar índice para mentee_email
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentee_email 
ON public.mentor_invites(mentee_email);

-- 6. Atualizar políticas RLS para o novo fluxo
DROP POLICY IF EXISTS "mentees_can_manage_own_invites" ON public.mentor_invites;
DROP POLICY IF EXISTS "mentors_can_view_accepted_invites" ON public.mentor_invites;
DROP POLICY IF EXISTS "users_can_view_invites_by_token" ON public.mentor_invites;
DROP POLICY IF EXISTS "users_can_accept_invites" ON public.mentor_invites;

-- Mentor pode gerenciar seus convites enviados
CREATE POLICY "mentors_can_manage_own_invites" ON public.mentor_invites
    FOR ALL USING (mentor_id = auth.uid());

-- Mentorado pode ver convites aceitos onde é o mentorado
CREATE POLICY "mentees_can_view_accepted_invites" ON public.mentor_invites
    FOR SELECT USING (mentee_id = auth.uid() AND status = 'accepted');

-- Mentorado pode ver convites pendentes pelo email
CREATE POLICY "mentees_can_view_pending_invites" ON public.mentor_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
        )
        AND status = 'pending'
        AND expires_at > NOW()
    );

-- Mentorado pode aceitar/rejeitar convites pelo email
CREATE POLICY "mentees_can_accept_reject_invites" ON public.mentor_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
        )
        AND status = 'pending'
        AND expires_at > NOW()
    );

-- 7. Comentário atualizado
COMMENT ON TABLE public.mentor_invites IS 'Convites de mentoria - Mentor convida Mentorado para acompanhamento';
