-- ============================================
-- FIX: Security Warnings Complementar
-- Data: 2024-12-08
-- ============================================
-- Este script corrige os avisos restantes:
-- 1. accept_mentor_invite - search path mutable
-- 2. is_admin - search path mutable
-- 3. Verificar e limpar políticas duplicadas em accounts
-- ============================================

-- ============================================
-- PARTE 1: LISTAR POLÍTICAS ATUAIS EM ACCOUNTS
-- ============================================
-- Execute esta query primeiro para ver as políticas existentes:
-- SELECT policyname FROM pg_policies WHERE tablename = 'accounts';

-- ============================================
-- PARTE 2: REMOVER TODAS AS POLÍTICAS DE ACCOUNTS
-- (incluindo políticas legadas que podem não ter sido removidas)
-- ============================================

-- Primeiro, vamos tentar remover TODAS as políticas possíveis
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop através de todas as políticas da tabela accounts
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'accounts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.accounts', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Agora recriar apenas 4 políticas limpas
CREATE POLICY "accounts_select_own" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_own" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_own" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete_own" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PARTE 3: CORRIGIR accept_mentor_invite
-- ============================================
-- Se essa função existe, vamos atualizar com search_path seguro

-- Primeiro dropar a função existente
DROP FUNCTION IF EXISTS public.accept_mentor_invite(UUID);

-- Função típica para aceitar convite de mentoria
CREATE OR REPLACE FUNCTION public.accept_mentor_invite(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_invite_id UUID;
    v_mentee_email TEXT;
    v_user_email TEXT;
BEGIN
    -- Pegar email do usuário atual
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Encontrar o convite pelo token
    SELECT id, mentee_email INTO v_invite_id, v_mentee_email
    FROM public.mentor_invites
    WHERE invite_token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    -- Verificar se encontrou o convite
    IF v_invite_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o email corresponde
    IF LOWER(v_mentee_email) != LOWER(v_user_email) THEN
        RETURN FALSE;
    END IF;
    
    -- Aceitar o convite
    UPDATE public.mentor_invites
    SET 
        mentee_id = auth.uid(),
        status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.accept_mentor_invite TO authenticated;

-- ============================================
-- PARTE 4: CORRIGIR is_admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users_extended
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar as políticas após o script:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'accounts';
--
-- Execute para verificar as funções:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('accept_mentor_invite', 'is_admin');
