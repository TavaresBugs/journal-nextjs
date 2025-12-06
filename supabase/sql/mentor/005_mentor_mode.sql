-- ============================================
-- Migration: Mentor Mode (ATUALIZADO)
-- Fluxo: MENTOR convida MENTORADO
-- Tabelas: mentor_invites, trade_comments
-- ============================================

-- ============================================
-- 1. MENTOR_INVITES
-- Mentor (quem analisa) convida Mentorado (quem é analisado)
-- ============================================

CREATE TABLE IF NOT EXISTS public.mentor_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Quem enviou o convite (o mentor)
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentor_email TEXT NOT NULL,
    -- Quem recebe o convite (o mentorado) - preenchido quando aceita
    mentee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    mentee_email TEXT NOT NULL,
    -- Configurações
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'comment')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
    invite_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentor ON public.mentor_invites(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentee ON public.mentor_invites(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_token ON public.mentor_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentor_email ON public.mentor_invites(mentor_email);
CREATE INDEX IF NOT EXISTS idx_mentor_invites_mentee_email ON public.mentor_invites(mentee_email);

-- ============================================
-- 2. TRADE_COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.trade_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trade_comments_trade ON public.trade_comments(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_user ON public.trade_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_created ON public.trade_comments(created_at DESC);

-- ============================================
-- 3. RLS POLICIES - MENTOR_INVITES
-- ============================================

ALTER TABLE public.mentor_invites ENABLE ROW LEVEL SECURITY;

-- Mentor pode ver e gerenciar seus convites enviados
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

-- Mentorado pode atualizar convites pendentes para aceitar/rejeitar
CREATE POLICY "mentees_can_accept_invites" ON public.mentor_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND LOWER(u.email) = LOWER(mentor_invites.mentee_email)
        )
        AND status = 'pending'
        AND expires_at > NOW()
    )
    WITH CHECK (
        mentee_id = auth.uid()
        AND status IN ('accepted', 'rejected')
    );

-- ============================================
-- 4. RLS POLICIES - TRADE_COMMENTS
-- ============================================

ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;

-- Dono do trade pode ver todos os comentários
CREATE POLICY "trade_owner_can_view_comments" ON public.trade_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trades
            WHERE trades.id = trade_comments.trade_id
            AND trades.user_id = auth.uid()
        )
    );

-- Mentor pode ver comentários de trades dos seus mentorados
CREATE POLICY "mentor_can_view_comments" ON public.trade_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trades t
            JOIN public.mentor_invites mi ON mi.mentee_id = t.user_id
            WHERE t.id = trade_comments.trade_id
            AND mi.mentor_id = auth.uid()
            AND mi.status = 'accepted'
        )
    );

-- Usuário pode criar comentários se for dono OU mentor com permissão
CREATE POLICY "users_can_create_comments" ON public.trade_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (
            -- É o dono do trade (mentorado)
            EXISTS (
                SELECT 1 FROM public.trades
                WHERE trades.id = trade_comments.trade_id
                AND trades.user_id = auth.uid()
            )
            OR
            -- É mentor com permissão de comentar
            EXISTS (
                SELECT 1 FROM public.trades t
                JOIN public.mentor_invites mi ON mi.mentee_id = t.user_id
                WHERE t.id = trade_comments.trade_id
                AND mi.mentor_id = auth.uid()
                AND mi.status = 'accepted'
                AND mi.permission = 'comment'
            )
        )
    );

-- Usuário pode deletar próprios comentários
CREATE POLICY "users_can_delete_own_comments" ON public.trade_comments
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Função para verificar se usuário é mentor de outro
CREATE OR REPLACE FUNCTION is_mentor_of(p_mentor_id UUID, p_mentee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mentor_invites
        WHERE mentor_id = p_mentor_id
        AND mentee_id = p_mentee_id
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. MENTOR ACCESS TO TRADES (RLS UPDATE)
-- ============================================

-- Mentores podem ver trades dos seus mentorados
DROP POLICY IF EXISTS "mentors_can_view_mentee_trades" ON public.trades;
CREATE POLICY "mentors_can_view_mentee_trades" ON public.trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mentor_invites
            WHERE mentor_invites.mentee_id = trades.user_id
            AND mentor_invites.mentor_id = auth.uid()
            AND mentor_invites.status = 'accepted'
        )
    );

-- Mentores podem ver journal entries dos seus mentorados
DROP POLICY IF EXISTS "mentors_can_view_mentee_journals" ON public.journal_entries;
CREATE POLICY "mentors_can_view_mentee_journals" ON public.journal_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trades t
            JOIN public.mentor_invites mi ON mi.mentee_id = t.user_id
            WHERE t.id = journal_entries.trade_id
            AND mi.mentor_id = auth.uid()
            AND mi.status = 'accepted'
        )
    );

-- ============================================
-- 7. GRANTS
-- ============================================

GRANT ALL ON public.mentor_invites TO authenticated;
GRANT ALL ON public.trade_comments TO authenticated;
GRANT EXECUTE ON FUNCTION is_mentor_of TO authenticated;

-- Comments
COMMENT ON TABLE public.mentor_invites IS 'Convites de mentoria - Mentor convida Mentorado';
COMMENT ON TABLE public.trade_comments IS 'Comentários de mentores em trades dos mentorados';
