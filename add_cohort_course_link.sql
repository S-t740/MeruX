-- ==========================================
-- COHORT TO COURSE LINKAGE MIGRATION
-- Adds course_id to cohorts so classes are tied to specific learning paths
-- ==========================================

-- 1. Add course_id to cohorts table
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- 2. Update RLS Policies for Cohorts (Instructors manage cohorts for their courses)
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cohorts_select" ON public.cohorts;
-- Anyone can see cohorts (or you can restrict to enrolled users, but public visibility of cohorts is often fine)
CREATE POLICY "cohorts_select" ON public.cohorts FOR SELECT USING (true);

DROP POLICY IF EXISTS "cohorts_manage" ON public.cohorts;
-- Instructors can manage cohorts linked to courses they teach
CREATE POLICY "cohorts_manage" ON public.cohorts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = public.cohorts.course_id 
    AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = public.cohorts.course_id 
    AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- 3. Update RLS Policies for Cohort Members
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cohort_members_select" ON public.cohort_members;
-- Members can check who else is in the cohort, and instructors can view all members
CREATE POLICY "cohort_members_select" ON public.cohort_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "cohort_members_manage" ON public.cohort_members;
-- Instructors can add/remove members for their cohorts
CREATE POLICY "cohort_members_manage" ON public.cohort_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cohorts ch 
    JOIN public.courses c ON c.id = ch.course_id 
    WHERE ch.id = public.cohort_members.cohort_id 
    AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cohorts ch 
    JOIN public.courses c ON c.id = ch.course_id 
    WHERE ch.id = public.cohort_members.cohort_id 
    AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- Force cache reload for JS clients
NOTIFY pgrst, 'reload schema';
