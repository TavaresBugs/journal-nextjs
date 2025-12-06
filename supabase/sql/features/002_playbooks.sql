-- ============================================
-- PLAYBOOKS TABLE
-- ============================================

-- Create playbooks table
CREATE TABLE IF NOT EXISTS public.playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📈',
    color TEXT DEFAULT '#3B82F6',
    rule_groups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, name)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_playbooks_user_id ON public.playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_account_id ON public.playbooks(account_id);

-- Enable Row Level Security
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own playbooks"
    ON public.playbooks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playbooks"
    ON public.playbooks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playbooks"
    ON public.playbooks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playbooks"
    ON public.playbooks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.playbooks IS 'User-defined trading strategies (playbooks) with custom rules and styling';
