-- =============================================
-- Migration: Fix trade_arguments RLS policies for performance
-- Description: Replace auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own trade arguments" ON trade_arguments;
DROP POLICY IF EXISTS "Users can create own trade arguments" ON trade_arguments;
DROP POLICY IF EXISTS "Users can delete own trade arguments" ON trade_arguments;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Users can view own trade arguments"
  ON trade_arguments FOR SELECT
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own trade arguments"
  ON trade_arguments FOR INSERT
  WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own trade arguments"
  ON trade_arguments FOR DELETE
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );
