-- Patch course_enrollments table to support completion tracking
-- Safe to run multiple times

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS completed_at timestamp WITH TIME ZONE;

-- Update status check constraint to allow 'completed'
-- (Only needed if there's an existing CHECK constraint — safe to run even if not)
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_status_check;
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_status_check
  CHECK (status IN ('active', 'completed', 'dropped', 'pending'));

NOTIFY pgrst, 'reload schema';
