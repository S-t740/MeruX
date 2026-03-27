-- ==========================================
-- ADD MISSING COLUMNS TO PROFILES
-- ==========================================
-- Problem: The 'bio', 'job_title', and 'updated_at' columns are missing 
-- from the profiles table, causing schema cache errors on the settings page.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
