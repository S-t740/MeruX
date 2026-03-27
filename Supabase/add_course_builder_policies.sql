-- ==========================================
-- ADD MISSING RLS POLICIES FOR COURSE BUILDER
-- ==========================================

-- 1. Modules
CREATE POLICY "modules_manage" ON public.modules FOR ALL USING (
    EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.modules.course_id AND c.instructor_id = auth.uid()) OR public.is_admin()
);

-- 2. Lessons
CREATE POLICY "lessons_manage" ON public.lessons FOR ALL USING (
    EXISTS(
        SELECT 1 FROM public.modules m 
        JOIN public.courses c ON c.id = m.course_id 
        WHERE m.id = public.lessons.module_id AND c.instructor_id = auth.uid()
    ) OR public.is_admin()
);

-- 3. Assignments
CREATE POLICY "assignments_manage" ON public.assignments FOR ALL USING (
    EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.assignments.course_id AND c.instructor_id = auth.uid()) OR public.is_admin()
);

-- Note: Ensure courses "courses_manage" policy also has a WITH CHECK if needed:
-- The existing policy is `FOR ALL USING (instructor_id = auth.uid() OR public.is_admin());` which implicitly covers WITH CHECK.
