-- ============================================
-- STORAGE SETUP (CONSOLIDATED)
-- ============================================

-- 1. Criar bucket 'journal-images' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Select Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Journal Images" ON storage.objects;

-- 3. Criar novas políticas (Permissivas para facilitar uso inicial, mas idealmente restritas por user_id)
-- Como as imagens são públicas nos journals compartilhados, SELECT público é ok.
-- INSERT/UPDATE/DELETE deve ser autenticado.

-- SELECT: Público (necessário para journals compartilhados)
CREATE POLICY "Public Select Journal Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'journal-images' );

-- INSERT: Apenas autenticado
CREATE POLICY "Authenticated Insert Journal Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'journal-images' );

-- UPDATE: Apenas autenticado (e dono do objeto - simplificado aqui para authenticated)
CREATE POLICY "Authenticated Update Journal Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'journal-images' );

-- DELETE: Apenas autenticado
CREATE POLICY "Authenticated Delete Journal Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'journal-images' );
