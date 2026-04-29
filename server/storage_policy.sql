-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy"

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('clips', 'clips', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow Public Uploads (INSERT)
CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'clips' );

-- 3. Allow Public Downloads (SELECT)
CREATE POLICY "Public Downloads" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'clips' );

-- 4. Allow Updates (for overwriting)
CREATE POLICY "Public Updates" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'clips' );
