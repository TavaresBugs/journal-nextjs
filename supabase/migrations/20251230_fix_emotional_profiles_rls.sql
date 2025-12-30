-- =============================================
-- Migration: Enable RLS on emotional_profiles table
-- Description: Fix security error - table was exposed without RLS
-- =============================================

-- Enable RLS
ALTER TABLE emotional_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own profiles
CREATE POLICY "Users can view own emotional profile"
  ON emotional_profiles FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own emotional profile"
  ON emotional_profiles FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own emotional profile"
  ON emotional_profiles FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own emotional profile"
  ON emotional_profiles FOR DELETE
  USING (user_id = (select auth.uid()));
