-- =============================================
-- Migration: Fix laboratory_experiment_trades RLS duplicate policies
-- Description: Remove "Service role bypass" policy as it's redundant -
--              service_role already bypasses RLS by default in Supabase
-- =============================================

-- Drop the redundant "Service role bypass" policy
-- The service_role already bypasses RLS automatically in Supabase
DROP POLICY IF EXISTS "Service role bypass" ON laboratory_experiment_trades;
