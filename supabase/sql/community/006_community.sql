-- ============================================
-- Migration: Community Features
-- Tabelas: shared_playbooks, leaderboard_opt_in
-- ============================================

-- ============================================
-- 1. SHARED_PLAYBOOKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.shared_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    description TEXT,
    stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playbook_id) -- Um playbook só pode ter um share
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_user ON public.shared_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_public ON public.shared_playbooks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_shared_playbooks_stars ON public.shared_playbooks(stars DESC);

-- ============================================
-- 2. PLAYBOOK_STARS (para controle de quem deu star)
-- ============================================

CREATE TABLE IF NOT EXISTS public.playbook_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_playbook_id UUID NOT NULL REFERENCES public.shared_playbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shared_playbook_id, user_id) -- Um usuário só pode dar 1 star
);

-- ============================================
-- 3. LEADERBOARD_OPT_IN
-- ============================================

CREATE TABLE IF NOT EXISTS public.leaderboard_opt_in (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    show_win_rate BOOLEAN DEFAULT true,
    show_profit_factor BOOLEAN DEFAULT true,
    show_total_trades BOOLEAN DEFAULT true,
    show_pnl BOOLEAN DEFAULT false, -- PnL desabilitado por padrão (sensível)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. RLS POLICIES - SHARED_PLAYBOOKS
-- ============================================

ALTER TABLE public.shared_playbooks ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver playbooks públicos
CREATE POLICY "anyone_can_view_public_playbooks" ON public.shared_playbooks
    FOR SELECT USING (is_public = true);

-- Dono pode gerenciar seus shares
CREATE POLICY "owner_can_manage_shares" ON public.shared_playbooks
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 5. RLS POLICIES - PLAYBOOK_STARS
-- ============================================

ALTER TABLE public.playbook_stars ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver stars
CREATE POLICY "anyone_can_view_stars" ON public.playbook_stars
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Usuário pode dar/remover star
CREATE POLICY "users_can_manage_own_stars" ON public.playbook_stars
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 6. RLS POLICIES - LEADERBOARD
-- ============================================

ALTER TABLE public.leaderboard_opt_in ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver participantes do leaderboard
CREATE POLICY "anyone_can_view_leaderboard" ON public.leaderboard_opt_in
    FOR SELECT USING (true);

-- Usuário pode gerenciar própria participação
CREATE POLICY "users_can_manage_leaderboard" ON public.leaderboard_opt_in
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 7. PLAYBOOKS - Allow public read for shared
-- ============================================

-- Playbooks públicos podem ser lidos por qualquer um
DROP POLICY IF EXISTS "anyone_can_view_shared_playbooks" ON public.playbooks;
CREATE POLICY "anyone_can_view_shared_playbooks" ON public.playbooks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shared_playbooks
            WHERE shared_playbooks.playbook_id = playbooks.id
            AND shared_playbooks.is_public = true
        )
    );

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Função para dar/remover star (toggle)
CREATE OR REPLACE FUNCTION toggle_playbook_star(p_shared_playbook_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verificar se já deu star
    SELECT EXISTS (
        SELECT 1 FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid()
    ) INTO v_exists;

    IF v_exists THEN
        -- Remover star
        DELETE FROM public.playbook_stars
        WHERE shared_playbook_id = p_shared_playbook_id
        AND user_id = auth.uid();

        -- Decrementar contador
        UPDATE public.shared_playbooks
        SET stars = GREATEST(0, stars - 1)
        WHERE id = p_shared_playbook_id;

        RETURN FALSE; -- Não tem mais star
    ELSE
        -- Adicionar star
        INSERT INTO public.playbook_stars (shared_playbook_id, user_id)
        VALUES (p_shared_playbook_id, auth.uid());

        -- Incrementar contador
        UPDATE public.shared_playbooks
        SET stars = stars + 1
        WHERE id = p_shared_playbook_id;

        RETURN TRUE; -- Tem star agora
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para leaderboard com estatísticas calculadas
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    l.user_id,
    l.display_name,
    l.show_win_rate,
    l.show_profit_factor,
    l.show_total_trades,
    l.show_pnl,
    -- Estatísticas calculadas
    CASE WHEN l.show_total_trades THEN (
        SELECT COUNT(*) FROM public.trades WHERE user_id = l.user_id
    ) END AS total_trades,
    CASE WHEN l.show_win_rate THEN (
        SELECT ROUND(
            COUNT(*) FILTER (WHERE outcome = 'win')::numeric / NULLIF(COUNT(*), 0) * 100,
            1
        ) FROM public.trades WHERE user_id = l.user_id
    ) END AS win_rate,
    CASE WHEN l.show_pnl THEN (
        SELECT COALESCE(SUM(pnl), 0) FROM public.trades WHERE user_id = l.user_id
    ) END AS total_pnl,
    l.created_at
FROM public.leaderboard_opt_in l
ORDER BY
    (SELECT COUNT(*) FILTER (WHERE outcome = 'win')::numeric / NULLIF(COUNT(*), 0) FROM public.trades WHERE user_id = l.user_id) DESC NULLS LAST;

-- ============================================
-- 9. GRANTS
-- ============================================

GRANT ALL ON public.shared_playbooks TO authenticated;
GRANT ALL ON public.playbook_stars TO authenticated;
GRANT ALL ON public.leaderboard_opt_in TO authenticated;
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_playbook_star TO authenticated;

-- Comments
COMMENT ON TABLE public.shared_playbooks IS 'Playbooks compartilhados publicamente';
COMMENT ON TABLE public.playbook_stars IS 'Stars/Likes em playbooks compartilhados';
COMMENT ON TABLE public.leaderboard_opt_in IS 'Usuários que optaram por aparecer no ranking';
COMMENT ON VIEW public.leaderboard_view IS 'View com estatísticas para o leaderboard';
