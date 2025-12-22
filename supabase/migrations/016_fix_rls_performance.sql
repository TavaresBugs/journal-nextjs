-- ============================================
-- MIGRATION 016: Fix RLS Performance Issues
-- ============================================
-- This migration fixes two types of RLS performance issues:
-- 1. auth_rls_initplan: Wrap auth.uid() and auth.role() with (select ...)
-- 2. multiple_permissive_policies: Consolidate duplicate policies
--
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX laboratory_recap_trades POLICIES
-- ============================================
-- Wrap auth.uid() with (select auth.uid()) for performance

DROP POLICY IF EXISTS "Users can view their own recap trades" ON laboratory_recap_trades;
DROP POLICY IF EXISTS "Users can insert their own recap trades" ON laboratory_recap_trades;
DROP POLICY IF EXISTS "Users can delete their own recap trades" ON laboratory_recap_trades;

CREATE POLICY "Users can view their own recap trades" ON laboratory_recap_trades
  FOR SELECT USING (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert their own recap trades" ON laboratory_recap_trades
  FOR INSERT WITH CHECK (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own recap trades" ON laboratory_recap_trades
  FOR DELETE USING (
    recap_id IN (SELECT id FROM laboratory_recaps WHERE user_id = (select auth.uid()))
  );

-- ============================================
-- 2. FIX economic_events POLICIES
-- ============================================
-- Wrap auth.role() with (select auth.role()) for performance

DROP POLICY IF EXISTS "Apenas service role pode inserir" ON economic_events;
DROP POLICY IF EXISTS "Apenas service role pode atualizar" ON economic_events;

CREATE POLICY "Apenas service role pode inserir"
  ON economic_events FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Apenas service role pode atualizar"
  ON economic_events FOR UPDATE
  USING ((select auth.role()) = 'service_role');

-- ============================================
-- 3. FIX profiles POLICIES
-- ============================================
-- Fix auth.uid() wrapping AND consolidate duplicate SELECT policies

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Open SELECT policy: everyone can see all profiles (avatars, names, etc.)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 4. FIX users_extended POLICIES
-- ============================================
-- Consolidate duplicate UPDATE policies

-- Drop duplicate update policies
DROP POLICY IF EXISTS "Users can update their own extended profile" ON users_extended;
DROP POLICY IF EXISTS "users_extended_update" ON users_extended;

-- Check if users_extended_update already exists (from 003_rls_policies.sql)
-- If so, we just need to ensure it uses (select auth.uid())
-- Let's recreate the standard policy with proper wrapping

CREATE POLICY "users_extended_update" ON users_extended
    FOR UPDATE USING (id = (select public.auth_uid()) OR public.is_admin())
    WITH CHECK (id = (select public.auth_uid()) OR public.is_admin());

-- ============================================
-- DONE
-- ============================================
-- After running this migration, re-check the Supabase Linter
-- to verify all warnings are resolved.
