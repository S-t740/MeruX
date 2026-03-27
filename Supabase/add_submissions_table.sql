-- ==========================================
-- ASSIGNMENT SUBMISSIONS TABLE
-- Fixes: "Submission failed" / "file_url column not found" errors
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- ==========================================

-- If the table already exists but is missing columns, patch it:
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS content text;
-- Note: status column uses submission_status enum ('Pending','Graded','Late') - do NOT alter
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS score integer;
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS submitted_at timestamp WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.submissions ADD COLUMN IF NOT EXISTS updated_at timestamp WITH TIME ZONE DEFAULT NOW();

-- Create the table fresh if it doesn't exist yet:
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url text,
  content text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  score integer,
  feedback text,
  submitted_at timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

-- RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow re-run
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_select_instructor" ON public.submissions;

-- Students can see and insert their own submissions
CREATE POLICY "submissions_select_own" ON public.submissions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "submissions_insert_own" ON public.submissions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "submissions_update_own" ON public.submissions
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Instructors can see submissions for their courses
CREATE POLICY "submissions_select_instructor" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE a.id = public.submissions.assignment_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

