-- ==========================================
-- FIX COURSE UPDATE RLS POLICY
-- ==========================================
-- Problem: Instructors cannot update their own courses (Title, Description, Thumbnail) 
-- because the existing policy might only cover SELECT or lacks a defined UPDATE rule.
-- Fix: Explicitly grant UPDATE permissions to the course instructor.

DROP POLICY IF EXISTS "courses_update_instructor" ON public.courses;

CREATE POLICY "courses_update_instructor" 
ON public.courses 
FOR UPDATE 
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());
