-- ==========================================
-- ADD THUMBNAIL_URL TO COURSES
-- ==========================================
-- Problem: The courses table is missing the thumbnail_url column, 
-- causing the "Edit Course Details" save function to fail.

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
