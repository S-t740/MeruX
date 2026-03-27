-- ==========================================
-- ADD COURSE-THUMBNAILS STORAGE BUCKET
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Thumbnail" ON storage.objects;
CREATE POLICY "Public Access Thumbnail" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Auth Insert Thumbnail" ON storage.objects;
CREATE POLICY "Auth Insert Thumbnail" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');
