-- ==========================================
-- GAMIFICATION SCHEMA FIXES
-- Run this if quiz submission fails
-- ==========================================

-- 1. Add missing columns to badges table
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS description text;

-- 2. Add missing RLS policies for badges (in case they don't exist)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select" ON public.badges;
DROP POLICY IF EXISTS "badges_insert" ON public.badges;

CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "badges_insert" ON public.badges FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "badges_delete" ON public.badges FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- 3. Make sure quiz_submissions allows insert by authenticated users
DROP POLICY IF EXISTS "quiz_submissions_insert" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_insert" ON public.quiz_submissions 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 4. Make sure user_tokens allows insert/update by the owner
DROP POLICY IF EXISTS "user_tokens_insert" ON public.user_tokens;
DROP POLICY IF EXISTS "user_tokens_update" ON public.user_tokens;
CREATE POLICY "user_tokens_insert" ON public.user_tokens 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
CREATE POLICY "user_tokens_update" ON public.user_tokens 
  FOR UPDATE USING (auth.role() = 'authenticated' AND (user_id = auth.uid() OR public.is_admin()));

-- 5. Make sure token_transactions allows insert by owner
DROP POLICY IF EXISTS "token_transactions_insert" ON public.token_transactions;
CREATE POLICY "token_transactions_insert" ON public.token_transactions 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
