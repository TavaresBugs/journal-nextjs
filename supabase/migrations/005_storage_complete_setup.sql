-- ============================================
-- STORAGE BUCKET & RLS POLICIES SETUP
-- ============================================
-- Execute este script no SQL Editor do Supabase para permitir uploads

-- 1. Criar bucket se não existir e garantir que é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Habilitar RLS na tabela storage.objects (geralmente já está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow Public Access to Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Journal Images" ON storage.objects;

-- 4. Criar políticas separadas para cada operação (melhor compatibilidade)

-- SELECT: Permite visualizar/baixar imagens
CREATE POLICY "Public Select Journal Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'journal-images' );

-- INSERT: Permite fazer upload de novas imagens
CREATE POLICY "Public Insert Journal Images"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'journal-images' );

-- UPDATE: Permite atualizar imagens existentes
CREATE POLICY "Public Update Journal Images"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'journal-images' )
WITH CHECK ( bucket_id = 'journal-images' );

-- DELETE: Permite deletar imagens
CREATE POLICY "Public Delete Journal Images"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'journal-images' );

-- 5. Verificar se as políticas foram criadas (retorna 4 linhas)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%Journal Images%'
ORDER BY cmd;
