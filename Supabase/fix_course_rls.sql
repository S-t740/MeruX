-- ==========================================
-- FIX COURSE BUILDER RLS POLICIES
-- ==========================================
-- Problem: The previous policies used table qualifiers (e.g., `public.modules.course_id`).
-- During INSERT, table qualifiers refer to the existing row (which is NULL), 
-- causing inserts to automatically fail RLS checks.
-- Fix: Drop existing policies and recreate using unqualified column names (e.g., `course_id`).

-- 1. Modules
DROP POLICY IF EXISTS "modules_manage" ON public.modules;
CREATE POLICY "modules_manage" ON public.modules 
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.courses c 
        WHERE c.id = course_id AND c.instructor_id = auth.uid()
    ) OR public.is_admin()
);

-- 2. Lessons
DROP POLICY IF EXISTS "lessons_manage" ON public.lessons;
CREATE POLICY "lessons_manage" ON public.lessons 
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.modules m 
        JOIN public.courses c ON c.id = m.course_id 
        WHERE m.id = module_id AND c.instructor_id = auth.uid()
    ) OR public.is_admin()
);

-- 3. Assignments
DROP POLICY IF EXISTS "assignments_manage" ON public.assignments;
CREATE POLICY "assignments_manage" ON public.assignments 
FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.courses c 
        WHERE c.id = course_id AND c.instructor_id = auth.uid()
    ) OR public.is_admin()
);
