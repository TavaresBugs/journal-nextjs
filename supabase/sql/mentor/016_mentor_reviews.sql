-- ============================================
-- Migration: Mentor Reviews (Sistema de Correção)
-- Tabela: mentor_reviews
-- Objetivo: Armazenar correções e comentários de mentores
-- ============================================

-- ============================================
-- 1. TABELA MENTOR_REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.mentor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    review_type TEXT NOT NULL CHECK (review_type IN ('correction', 'comment', 'suggestion')),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_id ON public.mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentee_id ON public.mentor_reviews(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_trade_id ON public.mentor_reviews(trade_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_is_read ON public.mentor_reviews(is_read);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;

-- 3.1 Mentor pode criar reviews para seus mentees
-- Verifica se existe um convite aceito onde o usuário atual é o mentor e o mentee_id alvo é o mentee
CREATE POLICY "mentors_can_create_reviews" ON public.mentor_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = mentor_id AND
        EXISTS (
            SELECT 1 FROM public.mentor_invites
            WHERE mentor_invites.mentor_id = auth.uid()
            AND mentor_invites.mentee_id = mentor_reviews.mentee_id
            AND mentor_invites.status = 'accepted'
        )
    );

-- 3.2 Mentor pode ver e editar suas próprias reviews
CREATE POLICY "mentors_can_manage_own_reviews" ON public.mentor_reviews
    FOR ALL USING (
        auth.uid() = mentor_id
    );

-- 3.3 Mentee pode ver reviews direcionadas a ele
CREATE POLICY "mentees_can_view_own_reviews" ON public.mentor_reviews
    FOR SELECT USING (
        auth.uid() = mentee_id
    );

-- 3.4 Mentee pode marcar como lido (UPDATE)
-- Restrição idealmente seria apenas no campo is_read, mas RLS é a nível de linha.
-- Permitimos update se for o mentee. A validação de campos específicos pode ser feita via trigger ou application level,
-- mas aqui seguimos o padrão RLS.
CREATE POLICY "mentees_can_update_read_status" ON public.mentor_reviews
    FOR UPDATE USING (
        auth.uid() = mentee_id
    )
    WITH CHECK (
        auth.uid() = mentee_id
    );

-- ============================================
-- 4. GRANTS E COMMENTS
-- ============================================

GRANT ALL ON public.mentor_reviews TO authenticated;

COMMENT ON TABLE public.mentor_reviews IS 'Tabela de correções e feedbacks de mentores sobre trades dos alunos';
COMMENT ON COLUMN public.mentor_reviews.review_type IS 'Tipo de feedback: correction, comment ou suggestion';
COMMENT ON COLUMN public.mentor_reviews.rating IS 'Nota opcional de 1 a 5 dada pelo mentor';
