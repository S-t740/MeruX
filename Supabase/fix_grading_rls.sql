-- ==========================================
-- FIX RLS POLICIES FOR GRADING
-- ==========================================
-- Problem: Instructors are getting an empty error {} when trying to submit grades.
-- This is because there are no RLS policies allowing them to INSERT into the `grades` table
-- or UPDATE the `submissions` table to mark it as 'graded'.

-- First, ensure RLS is enabled on these tables
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts (optional, but good practice)
DROP POLICY IF EXISTS "Instructors can insert grades" ON public.grades;
DROP POLICY IF EXISTS "Instructors can update grades" ON public.grades;
DROP POLICY IF EXISTS "Users can view grades" ON public.grades;
DROP POLICY IF EXISTS "Instructors can update submissions" ON public.submissions;

-- 1. Policies for `grades`
-- Allow anyone to read grades
CREATE POLICY "Users can view grades" ON public.grades
    FOR SELECT USING (true);

-- Allow authenticated instructors to insert a grade as long as they are the grader
CREATE POLICY "Instructors can insert grades" ON public.grades
    FOR INSERT WITH CHECK (grader_id = auth.uid() OR auth.role() = 'authenticated');

-- Allow instructors to update their own graded items
CREATE POLICY "Instructors can update grades" ON public.grades
    FOR UPDATE USING (grader_id = auth.uid() OR auth.role() = 'authenticated');

-- 2. Policies for `submissions`
-- Allow users to update submissions (so instructors can change status to 'graded')
CREATE POLICY "Instructors can update submissions" ON public.submissions
    FOR UPDATE USING (auth.role() = 'authenticated');
