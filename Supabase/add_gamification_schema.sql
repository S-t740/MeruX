-- ==========================================
-- GAMIFICATION & QUIZ ENGINE SCHEMA
-- Tracking Quizzes, Points, and Badges
-- ==========================================

-- 1. QUIZ TABLES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer DEFAULT 80, -- percentage
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- We only allow one quiz per module right now, so unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_module_quiz ON public.quizzes (module_id);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  points integer DEFAULT 10,
  order_index integer DEFAULT 0,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean DEFAULT false,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL, -- percentage
  passed boolean NOT NULL,
  earned_tokens integer DEFAULT 0,
  submitted_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- 2. TOKEN ECONOMY
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_balance integer DEFAULT 0,
  last_updated timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Note: The `badges` table already exists in lms_mvp_schema.sql.
-- CREATE TABLE IF NOT EXISTS public.badges (
--   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
--   user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
--   name text NOT NULL,
--   icon_url text,
--   awarded_at timestamp WITH TIME ZONE DEFAULT NOW()
-- );

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- QUIZZES (Read by all, Managed by instructors/admins)
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_manage" ON public.quizzes FOR ALL USING (
  EXISTS(SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id WHERE m.id = public.quizzes.module_id AND c.instructor_id = auth.uid()) OR public.is_admin()
);

-- QUESTIONS
CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz_questions_manage" ON public.quiz_questions FOR ALL USING (
  EXISTS(SELECT 1 FROM public.quizzes q JOIN public.modules m ON q.module_id = m.id JOIN public.courses c ON m.course_id = c.id WHERE q.id = public.quiz_questions.quiz_id AND c.instructor_id = auth.uid()) OR public.is_admin()
);

-- OPTIONS
CREATE POLICY "quiz_options_select" ON public.quiz_options FOR SELECT USING (true);
CREATE POLICY "quiz_options_manage" ON public.quiz_options FOR ALL USING (
  EXISTS(SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON qq.quiz_id = q.id JOIN public.modules m ON q.module_id = m.id JOIN public.courses c ON m.course_id = c.id WHERE qq.id = public.quiz_options.question_id AND c.instructor_id = auth.uid()) OR public.is_admin()
);

-- SUBMISSIONS (Users can see their own and insert their own)
CREATE POLICY "quiz_submissions_select" ON public.quiz_submissions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "quiz_submissions_insert" ON public.quiz_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

-- USER TOKENS
CREATE POLICY "user_tokens_select" ON public.user_tokens FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_tokens_insert" ON public.user_tokens FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_tokens_update" ON public.user_tokens FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- TOKEN TRANSACTIONS
CREATE POLICY "token_transactions_select" ON public.token_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "token_transactions_insert" ON public.token_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Force PostgREST to reload the schema cache so the UI can detect the new tables instantly
NOTIFY pgrst, 'reload schema';
