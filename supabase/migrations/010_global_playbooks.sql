-- Make account_id nullable in playbooks
ALTER TABLE public.playbooks ALTER COLUMN account_id DROP NOT NULL;

-- Remove valid unique constraint on (account_id, name) if exists
ALTER TABLE public.playbooks DROP CONSTRAINT IF EXISTS playbooks_account_id_name_key;

-- Add unique constraint on (user_id, name) so users can't have duplicate playbook names globally
ALTER TABLE public.playbooks DROP CONSTRAINT IF EXISTS playbooks_user_id_name_key;
ALTER TABLE public.playbooks ADD CONSTRAINT playbooks_user_id_name_key UNIQUE (user_id, name);

-- Simplify RLS policies to focus on user_id primarily
DROP POLICY IF EXISTS "Users can view their own playbooks" ON public.playbooks;
DROP POLICY IF EXISTS "Users can create their own playbooks" ON public.playbooks;
DROP POLICY IF EXISTS "Users can update their own playbooks" ON public.playbooks;
DROP POLICY IF EXISTS "Users can delete their own playbooks" ON public.playbooks;

CREATE POLICY "Users can view their own playbooks"
    ON public.playbooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playbooks"
    ON public.playbooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playbooks"
    ON public.playbooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playbooks"
    ON public.playbooks FOR DELETE
    USING (auth.uid() = user_id);
