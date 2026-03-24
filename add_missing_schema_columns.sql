-- ==========================================
-- ADD MISSING COLUMNS
-- ==========================================
-- This script adds missing columns to the database schema that were
-- causing the "Could not find column" errors during inserts.

ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 100;

-- Force PostgREST to reload the schema cache so the UI can detect the new columns instantly
NOTIFY pgrst, 'reload schema';
