-- ============================================
-- Migration: Add 'mentor' role to users_extended
-- ============================================

-- Drop old constraint and add new one with 'mentor' included
ALTER TABLE public.users_extended
DROP CONSTRAINT IF EXISTS users_extended_role_check;

ALTER TABLE public.users_extended
ADD CONSTRAINT users_extended_role_check
CHECK (role IN ('admin', 'user', 'guest', 'mentor'));
