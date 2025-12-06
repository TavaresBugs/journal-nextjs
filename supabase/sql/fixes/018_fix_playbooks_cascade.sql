-- Migration: Fix playbooks cascade delete issue
-- Remove CASCADE so playbooks are NOT deleted when account is deleted
-- Instead, set account_id to NULL (since it's nullable now)

-- First, find and drop the existing foreign key constraint
ALTER TABLE public.playbooks 
DROP CONSTRAINT IF EXISTS playbooks_account_id_fkey;

-- Re-add the foreign key with SET NULL instead of CASCADE
-- This way, when an account is deleted, the playbook remains but with account_id = NULL
ALTER TABLE public.playbooks 
ADD CONSTRAINT playbooks_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES public.accounts(id) 
ON DELETE SET NULL;

-- Also update any existing playbooks that still have account_id set
-- to make them truly global (optional - uncomment if desired)
-- UPDATE public.playbooks SET account_id = NULL WHERE account_id IS NOT NULL;

COMMENT ON COLUMN public.playbooks.account_id IS 'Optional account link. Playbooks are global to user, not tied to account deletion.';
