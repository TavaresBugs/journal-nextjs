-- ============================================
-- SHARED JOURNALS TABLE
-- ============================================

-- Create shared_journals table
CREATE TABLE IF NOT EXISTS public.shared_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    view_count INTEGER DEFAULT 0
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_shared_journals_token ON public.shared_journals(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_journals_journal_entry ON public.shared_journals(journal_entry_id);

-- Enable Row Level Security
ALTER TABLE public.shared_journals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own shares"
    ON public.shared_journals
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares for their journals"
    ON public.shared_journals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
    ON public.shared_journals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Public read access for valid tokens
CREATE POLICY "Anyone can view non-expired shared journals"
    ON public.shared_journals
    FOR SELECT
    USING (
        expires_at > now()
    );

-- Also need to update journal_entries RLS to allow public reads via share token
DROP POLICY IF EXISTS "Public can view shared journal entries" ON public.journal_entries;

CREATE POLICY "Public can view shared journal entries"
    ON public.journal_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shared_journals
            WHERE shared_journals.journal_entry_id = journal_entries.id
            AND shared_journals.expires_at > now()
        )
    );

-- Update journal_images RLS to allow public reads via share token
DROP POLICY IF EXISTS "Public can view images from shared journals" ON public.journal_images;

CREATE POLICY "Public can view images from shared journals"
    ON public.journal_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shared_journals
            WHERE shared_journals.journal_entry_id = journal_images.journal_entry_id
            AND shared_journals.expires_at > now()
        )
    );

-- Add comment
COMMENT ON TABLE public.shared_journals IS 'Public share links for journal entries with expiration dates';
