-- ============================================
-- Migration: Mentor Account Permissions
-- Permite que mentorado escolha quais carteiras
-- o mentor pode visualizar
-- ============================================

-- ============================================
-- 1. MENTOR_ACCOUNT_PERMISSIONS TABLE
-- Controla acesso do mentor a carteiras específicas
-- ============================================

CREATE TABLE IF NOT EXISTS public.mentor_account_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Referência ao convite de mentoria
    invite_id UUID NOT NULL REFERENCES public.mentor_invites(id) ON DELETE CASCADE,
    -- Carteira que está sendo compartilhada
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    -- Permissões granulares
    can_view_trades BOOLEAN DEFAULT true,
    can_view_journal BOOLEAN DEFAULT true,
    can_view_routines BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Garantir unicidade: uma permissão por convite/carteira
    UNIQUE(invite_id, account_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mentor_account_permissions_invite 
    ON public.mentor_account_permissions(invite_id);
CREATE INDEX IF NOT EXISTS idx_mentor_account_permissions_account 
    ON public.mentor_account_permissions(account_id);

-- ============================================
-- 2. RLS POLICIES
-- ============================================

ALTER TABLE public.mentor_account_permissions ENABLE ROW LEVEL SECURITY;

-- Mentorado pode ver e gerenciar permissões de seus próprios convites
-- (convites onde ele é o mentee)
CREATE POLICY "mentee_can_manage_own_permissions" 
ON public.mentor_account_permissions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.mentor_invites mi
        WHERE mi.id = mentor_account_permissions.invite_id
        AND mi.mentee_id = auth.uid()
        AND mi.status = 'accepted'
    )
);

-- Mentor pode apenas VER as permissões (não modificar)
CREATE POLICY "mentor_can_view_permissions" 
ON public.mentor_account_permissions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.mentor_invites mi
        WHERE mi.id = mentor_account_permissions.invite_id
        AND mi.mentor_id = auth.uid()
        AND mi.status = 'accepted'
    )
);

-- ============================================
-- 3. UPDATE RLS ON TRADES
-- Mentor só pode ver trades de carteiras permitidas
-- ============================================

-- Remover política antiga (se existir)
DROP POLICY IF EXISTS "mentors_can_view_mentee_trades" ON public.trades;

-- Nova política com filtro por carteira permitida
CREATE POLICY "mentors_can_view_mentee_trades" ON public.trades
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.mentor_invites mi
        JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
        WHERE mi.mentee_id = trades.user_id
        AND mi.mentor_id = auth.uid()
        AND mi.status = 'accepted'
        AND map.account_id = trades.account_id
        AND map.can_view_trades = true
    )
);

-- ============================================
-- 4. UPDATE RLS ON JOURNAL_ENTRIES
-- Mentor só pode ver diário de carteiras permitidas
-- ============================================

-- Remover política antiga (se existir)
DROP POLICY IF EXISTS "mentors_can_view_mentee_journals" ON public.journal_entries;

-- Nova política com filtro por carteira permitida
CREATE POLICY "mentors_can_view_mentee_journals" ON public.journal_entries
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.mentor_invites mi
        JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
        WHERE mi.mentee_id = journal_entries.user_id
        AND mi.mentor_id = auth.uid()
        AND mi.status = 'accepted'
        AND map.account_id = journal_entries.account_id
        AND map.can_view_journal = true
    )
);

-- ============================================
-- 5. RLS ON DAILY_ROUTINES
-- Mentor só pode ver rotinas de carteiras permitidas
-- ============================================

-- Criar política para mentor ver rotinas
DROP POLICY IF EXISTS "mentors_can_view_mentee_routines" ON public.daily_routines;

CREATE POLICY "mentors_can_view_mentee_routines" ON public.daily_routines
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.mentor_invites mi
        JOIN public.mentor_account_permissions map ON map.invite_id = mi.id
        WHERE mi.mentee_id = daily_routines.user_id
        AND mi.mentor_id = auth.uid()
        AND mi.status = 'accepted'
        AND map.account_id = daily_routines.account_id
        AND map.can_view_routines = true
    )
);

-- ============================================
-- 6. HELPER FUNCTION
-- Verificar se mentor pode acessar carteira
-- ============================================

CREATE OR REPLACE FUNCTION can_mentor_access_account(
    p_mentor_id UUID, 
    p_account_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.mentor_account_permissions map
        JOIN public.mentor_invites mi ON mi.id = map.invite_id
        JOIN public.accounts a ON a.id = map.account_id
        WHERE mi.mentor_id = p_mentor_id
        AND mi.mentee_id = a.user_id
        AND mi.status = 'accepted'
        AND map.account_id = p_account_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. GRANTS
-- ============================================

GRANT ALL ON public.mentor_account_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION can_mentor_access_account TO authenticated;

-- Comments
COMMENT ON TABLE public.mentor_account_permissions IS 'Permissões de acesso do mentor a carteiras específicas do mentorado';
COMMENT ON FUNCTION can_mentor_access_account IS 'Verifica se mentor pode acessar uma carteira específica';
