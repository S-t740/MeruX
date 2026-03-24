-- Add job_title column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
