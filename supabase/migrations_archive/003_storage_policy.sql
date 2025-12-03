-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on objects if not already enabled (standard practice, though usually enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access (Select, Insert, Update, Delete) for the journal-images bucket
-- We use DO block to avoid error if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow Public Access to Journal Images'
    ) THEN
        CREATE POLICY "Allow Public Access to Journal Images"
        ON storage.objects FOR ALL
        USING ( bucket_id = 'journal-images' )
        WITH CHECK ( bucket_id = 'journal-images' );
    END IF;
END
$$;
