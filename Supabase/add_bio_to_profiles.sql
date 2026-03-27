-- ==========================================
-- ADD BIO TO PROFILES
-- ==========================================
-- Problem: The 'bio' column is missing from the profiles table,
-- causing a schema cache error on the settings page.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
