-- =============================================
-- Migration: Create trade_arguments table
-- Description: Store PDArray pro/contra arguments for journal entries
-- =============================================

CREATE TABLE trade_arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pro', 'contra')),
  argument TEXT NOT NULL CHECK (
    char_length(argument) > 0 AND 
    char_length(argument) <= 500
  ),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_trade_arguments_journal_id ON trade_arguments(journal_entry_id);
CREATE INDEX idx_trade_arguments_type ON trade_arguments(type);

-- =============================================
-- RLS Policies (granulares por operação)
-- Using (select auth.uid()) for performance optimization
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =============================================
ALTER TABLE trade_arguments ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own trade arguments
CREATE POLICY "Users can view own trade arguments"
  ON trade_arguments FOR SELECT
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );

-- INSERT: Users can create arguments for their own journal entries
CREATE POLICY "Users can create own trade arguments"
  ON trade_arguments FOR INSERT
  WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );

-- DELETE: Users can delete their own trade arguments
CREATE POLICY "Users can delete own trade arguments"
  ON trade_arguments FOR DELETE
  USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE user_id = (select auth.uid())
    )
  );
