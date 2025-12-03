-- Drop potentially conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow Public Access to Journal Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Journal Images" ON storage.objects;

-- Create explicit, separate policies for each operation to ensure maximum compatibility
-- 1. SELECT (Download/View)
CREATE POLICY "Public Select Journal Images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'journal-images' );

-- 2. INSERT (Upload)
CREATE POLICY "Public Insert Journal Images"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'journal-images' );

-- 3. UPDATE (Replace)
CREATE POLICY "Public Update Journal Images"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'journal-images' );

-- 4. DELETE (Remove)
CREATE POLICY "Public Delete Journal Images"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'journal-images' );

-- Ensure the bucket is definitely public (redundancy check)
UPDATE storage.buckets
SET public = true
WHERE id = 'journal-images';
