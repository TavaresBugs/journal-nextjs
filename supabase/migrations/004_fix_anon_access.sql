-- ============================================
-- FIX: Permitir acesso anônimo para links compartilhados
-- ============================================
-- Execute este script no SQL Editor do Supabase.
-- 
-- O problema é que as políticas RLS permitem acesso público,
-- mas o role 'anon' não tem permissão de SELECT nas tabelas.
-- ============================================

-- Dar permissão de SELECT para usuários anônimos nas tabelas necessárias
GRANT SELECT ON shared_journals TO anon;
GRANT SELECT ON journal_entries TO anon;
GRANT SELECT ON journal_images TO anon;
GRANT SELECT ON users_extended TO anon;

-- Verificar se o bucket de imagens está público
-- (Isso já deve estar configurado, mas vamos garantir)
-- No Supabase Dashboard: Storage > journal-images > Settings > Make bucket public

-- ============================================
-- PRONTO! Agora links compartilhados funcionarão para terceiros.
-- ============================================
