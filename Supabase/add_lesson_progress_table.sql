-- ==========================================
-- CREATE LESSON PROGRESS TRACKING TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- RLS Policies
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_lesson_progress_select" ON public.user_lesson_progress
FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_lesson_progress_insert" ON public.user_lesson_progress
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_lesson_progress_delete" ON public.user_lesson_progress
FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Force PostgREST to reload the schema cache so the UI can detect the new table instantly
NOTIFY pgrst, 'reload schema';
