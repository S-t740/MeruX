-- ==========================================
-- QUIZ, FINAL EXAM & CERTIFICATION SCHEMA
-- Fully idempotent: safe to re-run at any time
-- ==========================================

-- 1. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);
-- Patch any pre-existing quizzes table with all required columns
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_id  uuid REFERENCES public.courses(id)  ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS module_id  uuid REFERENCES public.modules(id)  ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title      text;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS type       text;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit integer;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS total_marks  integer DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS max_attempts  integer DEFAULT 1;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS updated_at timestamp WITH TIME ZONE DEFAULT NOW();
-- Add check constraint only if it does not already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_type_check' AND conrelid = 'public.quizzes'::regclass
  ) THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_type_check CHECK (type IN ('module', 'final'));
  END IF;
END $$;

-- 2. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS quiz_id       uuid REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_text text;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_type text;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS points        integer DEFAULT 1;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS position      integer DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_type_check' AND conrelid = 'public.quiz_questions'::regclass
  ) THEN
    ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_type_check CHECK (question_type IN ('mcq', 'true_false', 'short_answer'));
  END IF;
END $$;

-- 3. QUIZ OPTIONS
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS option_text text;
ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS is_correct  boolean DEFAULT false;

-- 4. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  started_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS quiz_id      uuid REFERENCES public.quizzes(id)   ON DELETE CASCADE;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS student_id   uuid REFERENCES public.profiles(id)  ON DELETE CASCADE;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS score        integer DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS status       text DEFAULT 'in_progress';
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS submitted_at timestamp WITH TIME ZONE;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_status_check' AND conrelid = 'public.quiz_attempts'::regclass
  ) THEN
    ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_status_check CHECK (status IN ('in_progress', 'submitted', 'graded'));
  END IF;
END $$;

-- 5. QUIZ ANSWERS
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS attempt_id        uuid REFERENCES public.quiz_attempts(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS question_id       uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES public.quiz_options(id)  ON DELETE SET NULL;
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS answer_text        text;
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS is_correct         boolean DEFAULT false;
ALTER TABLE public.quiz_answers ADD COLUMN IF NOT EXISTS points_awarded     integer DEFAULT 0;
-- Unique constraint: one answer per question per attempt
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_answers_attempt_question_unique' AND conrelid = 'public.quiz_answers'::regclass
  ) THEN
    ALTER TABLE public.quiz_answers ADD CONSTRAINT quiz_answers_attempt_question_unique UNIQUE (attempt_id, question_id);
  END IF;
END $$;

-- 6. COURSE PROGRESS
CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  updated_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS student_id          uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS course_id           uuid REFERENCES public.courses(id)  ON DELETE CASCADE;
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS modules_completed    integer[] DEFAULT '{}';
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS quizzes_completed    integer[] DEFAULT '{}';
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS final_exam_completed boolean   DEFAULT false;
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS overall_score        integer   DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_progress_student_course_unique' AND conrelid = 'public.course_progress'::regclass
  ) THEN
    ALTER TABLE public.course_progress ADD CONSTRAINT course_progress_student_course_unique UNIQUE (student_id, course_id);
  END IF;
END $$;

-- 7. COURSE CERTIFICATES
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  issued_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.course_certificates ADD COLUMN IF NOT EXISTS student_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.course_certificates ADD COLUMN IF NOT EXISTS course_id        uuid REFERENCES public.courses(id)  ON DELETE CASCADE;
ALTER TABLE public.course_certificates ADD COLUMN IF NOT EXISTS final_score      integer;
ALTER TABLE public.course_certificates ADD COLUMN IF NOT EXISTS certificate_url  text;
ALTER TABLE public.course_certificates ADD COLUMN IF NOT EXISTS certificate_code text;
-- Unique constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_certificates_code_unique' AND conrelid = 'public.course_certificates'::regclass
  ) THEN
    ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_code_unique UNIQUE (certificate_code);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_certificates_student_course_unique' AND conrelid = 'public.course_certificates'::regclass
  ) THEN
    ALTER TABLE public.course_certificates ADD CONSTRAINT course_certificates_student_course_unique UNIQUE (student_id, course_id);
  END IF;
END $$;

-- Add certificates storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DROP EXISTING POLICIES (makes script re-runnable)
-- ==========================================
DROP POLICY IF EXISTS "quizzes_select"        ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_manage"        ON public.quizzes;
DROP POLICY IF EXISTS "questions_select"      ON public.quiz_questions;
DROP POLICY IF EXISTS "questions_manage"      ON public.quiz_questions;
DROP POLICY IF EXISTS "options_select"        ON public.quiz_options;
DROP POLICY IF EXISTS "options_manage"        ON public.quiz_options;
DROP POLICY IF EXISTS "attempts_student"      ON public.quiz_attempts;
DROP POLICY IF EXISTS "attempts_instructor"   ON public.quiz_attempts;
DROP POLICY IF EXISTS "answers_student"       ON public.quiz_answers;
DROP POLICY IF EXISTS "answers_instructor"    ON public.quiz_answers;
DROP POLICY IF EXISTS "progress_student"      ON public.course_progress;
DROP POLICY IF EXISTS "progress_instructor"   ON public.course_progress;
DROP POLICY IF EXISTS "certificates_select"   ON public.course_certificates;
DROP POLICY IF EXISTS "certificates_insert"   ON public.course_certificates;
DROP POLICY IF EXISTS "certificates_update"   ON public.course_certificates;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- QUIZZES: everyone can read, only course instructors/admins can manage
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_manage" ON public.quizzes FOR ALL USING (
  EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.quizzes.course_id AND c.instructor_id = auth.uid()) 
  OR public.is_admin()
);

-- QUIZ QUESTIONS
CREATE POLICY "questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_manage" ON public.quiz_questions FOR ALL USING (
  EXISTS(
    SELECT 1 FROM public.quizzes q 
    JOIN public.courses c ON c.id = q.course_id 
    WHERE q.id = public.quiz_questions.quiz_id AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- QUIZ OPTIONS
CREATE POLICY "options_select" ON public.quiz_options FOR SELECT USING (true);
CREATE POLICY "options_manage" ON public.quiz_options FOR ALL USING (
  EXISTS(
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    JOIN public.courses c ON c.id = q.course_id
    WHERE qq.id = public.quiz_options.question_id AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- QUIZ ATTEMPTS: students manage their own, instructors can read for their courses
CREATE POLICY "attempts_student" ON public.quiz_attempts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "attempts_instructor" ON public.quiz_attempts FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM public.quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = public.quiz_attempts.quiz_id AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- QUIZ ANSWERS
CREATE POLICY "answers_student" ON public.quiz_answers FOR ALL USING (
  EXISTS(SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = public.quiz_answers.attempt_id AND qa.student_id = auth.uid())
);
CREATE POLICY "answers_instructor" ON public.quiz_answers FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON q.id = qa.quiz_id
    JOIN public.courses c ON c.id = q.course_id
    WHERE qa.id = public.quiz_answers.attempt_id AND c.instructor_id = auth.uid()
  ) OR public.is_admin()
);

-- COURSE PROGRESS
CREATE POLICY "progress_student" ON public.course_progress FOR ALL USING (student_id = auth.uid());
CREATE POLICY "progress_instructor" ON public.course_progress FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.course_progress.course_id AND c.instructor_id = auth.uid()) 
  OR public.is_admin()
);

-- CERTIFICATES: publicly readable for verification, restricted insert/update
CREATE POLICY "certificates_select" ON public.course_certificates FOR SELECT USING (true);
CREATE POLICY "certificates_insert" ON public.course_certificates FOR INSERT WITH CHECK (
  student_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "certificates_update" ON public.course_certificates FOR UPDATE USING (
  student_id = auth.uid() OR public.is_admin()
);
