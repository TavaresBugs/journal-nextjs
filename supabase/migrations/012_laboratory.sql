-- ============================================
-- LABORATORY FEATURE - SCHEMA & RLS
-- ============================================
-- Migration: 012_laboratory.sql
-- Tables: laboratory_experiments, laboratory_images, laboratory_recaps
-- ============================================

-- ============================================
-- 1. LABORATORY EXPERIMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS laboratory_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'em_aberto' 
        CHECK (status IN ('em_aberto', 'testando', 'validado', 'descartado')),
    category TEXT,
    expected_win_rate DECIMAL(5, 2),
    expected_risk_reward DECIMAL(5, 2),
    promoted_to_playbook BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laboratory_experiments_user_id 
    ON laboratory_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_experiments_status 
    ON laboratory_experiments(status);
CREATE INDEX IF NOT EXISTS idx_laboratory_experiments_created 
    ON laboratory_experiments(created_at DESC);

-- ============================================
-- 2. LABORATORY IMAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS laboratory_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES laboratory_experiments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laboratory_images_experiment 
    ON laboratory_images(experiment_id);

-- ============================================
-- 3. LABORATORY RECAPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS laboratory_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    what_worked TEXT,
    what_failed TEXT,
    emotional_state TEXT CHECK (emotional_state IS NULL OR emotional_state IN (
        'confiante', 'ansioso', 'fomo', 'disciplinado', 
        'frustrado', 'euforico', 'neutro'
    )),
    lessons_learned TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laboratory_recaps_user_id 
    ON laboratory_recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_recaps_trade_id 
    ON laboratory_recaps(trade_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_recaps_created 
    ON laboratory_recaps(created_at DESC);

-- ============================================
-- 4. STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('laboratory-images', 'laboratory-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE laboratory_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_recaps ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES - LABORATORY EXPERIMENTS
-- ============================================

CREATE POLICY "laboratory_experiments_select" ON laboratory_experiments
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "laboratory_experiments_insert" ON laboratory_experiments
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "laboratory_experiments_update" ON laboratory_experiments
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "laboratory_experiments_delete" ON laboratory_experiments
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 7. RLS POLICIES - LABORATORY IMAGES
-- ============================================

CREATE POLICY "laboratory_images_select" ON laboratory_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM laboratory_experiments
            WHERE laboratory_experiments.id = laboratory_images.experiment_id
            AND laboratory_experiments.user_id = public.auth_uid()
        )
    );

CREATE POLICY "laboratory_images_insert" ON laboratory_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM laboratory_experiments
            WHERE laboratory_experiments.id = laboratory_images.experiment_id
            AND laboratory_experiments.user_id = public.auth_uid()
        )
    );

CREATE POLICY "laboratory_images_delete" ON laboratory_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM laboratory_experiments
            WHERE laboratory_experiments.id = laboratory_images.experiment_id
            AND laboratory_experiments.user_id = public.auth_uid()
        )
    );

-- ============================================
-- 8. RLS POLICIES - LABORATORY RECAPS
-- ============================================

CREATE POLICY "laboratory_recaps_select" ON laboratory_recaps
    FOR SELECT USING (public.auth_uid() = user_id);

CREATE POLICY "laboratory_recaps_insert" ON laboratory_recaps
    FOR INSERT WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "laboratory_recaps_update" ON laboratory_recaps
    FOR UPDATE USING (public.auth_uid() = user_id)
    WITH CHECK (public.auth_uid() = user_id);

CREATE POLICY "laboratory_recaps_delete" ON laboratory_recaps
    FOR DELETE USING (public.auth_uid() = user_id);

-- ============================================
-- 9. STORAGE POLICIES - LABORATORY IMAGES BUCKET
-- ============================================

DROP POLICY IF EXISTS "Public Select Laboratory Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Laboratory Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Laboratory Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Laboratory Images" ON storage.objects;

CREATE POLICY "Public Select Laboratory Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'laboratory-images' );

CREATE POLICY "Authenticated Insert Laboratory Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'laboratory-images' );

CREATE POLICY "Authenticated Update Laboratory Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'laboratory-images' );

CREATE POLICY "Authenticated Delete Laboratory Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'laboratory-images' );

-- ============================================
-- 10. GRANTS
-- ============================================

GRANT ALL ON laboratory_experiments TO authenticated;
GRANT ALL ON laboratory_images TO authenticated;
GRANT ALL ON laboratory_recaps TO authenticated;
