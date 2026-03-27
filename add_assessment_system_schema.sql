-- =====================================================================
-- CISCO-STYLE MULTI-LAYERED ASSESSMENT & CERTIFICATION SCHEMA
-- Fully idempotent — safe to re-run at any time
-- Assessment layers: Practice → Module Quiz → Skills → Final Exam → Cert
-- =====================================================================

-- =====================================================================
-- PART 1: EXTEND EXISTING QUIZZES TABLE
-- =====================================================================

-- Extend quiz type to support all assessment layers
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_type_check;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS randomize_questions boolean DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_answers boolean DEFAULT false; -- for practice mode
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_type_check' AND conrelid = 'public.quizzes'::regclass
  ) THEN
    ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_type_check CHECK (type IN ('practice', 'module', 'skills', 'final'));
  END IF;
END $$;

-- Add attempt_number to quiz_attempts for limit enforcement
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;
-- Add bank_question_ids used in this attempt (to avoid repeating)
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS questions_snapshot jsonb DEFAULT '[]';

-- Add bank question link to quiz_questions
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS bank_question_id uuid;

-- =====================================================================
-- PART 2: QUESTION BANK
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.question_bank (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at  timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at  timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS course_id      uuid REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS created_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS topic          text NOT NULL DEFAULT '';
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS difficulty     text NOT NULL DEFAULT 'medium';
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS question_type  text NOT NULL DEFAULT 'mcq';
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS question_text  text NOT NULL DEFAULT '';
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS explanation    text; -- shown after attempt
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS is_active      boolean DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_difficulty_check' AND conrelid = 'public.question_bank'::regclass
  ) THEN
    ALTER TABLE public.question_bank ADD CONSTRAINT question_bank_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_bank_type_check' AND conrelid = 'public.question_bank'::regclass
  ) THEN
    ALTER TABLE public.question_bank ADD CONSTRAINT question_bank_type_check CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'scenario'));
  END IF;
END $$;

-- =====================================================================
-- PART 3: QUESTION OPTIONS (for question_bank)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.question_options (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at  timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS question_id  uuid REFERENCES public.question_bank(id) ON DELETE CASCADE;
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS option_text  text NOT NULL DEFAULT '';
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS is_correct   boolean DEFAULT false;
ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS position     integer DEFAULT 0;

-- =====================================================================
-- PART 4: SKILLS ASSESSMENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.skills_assessments (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at  timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at  timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS course_id     uuid REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS module_id     uuid REFERENCES public.modules(id) ON DELETE SET NULL;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS title         text NOT NULL DEFAULT '';
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS description   text;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS rubric        jsonb DEFAULT '[]'; -- [{criterion, max_points, description}]
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS grading_type  text DEFAULT 'manual';
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS max_score     integer DEFAULT 100;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 60;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS due_date      timestamp WITH TIME ZONE;
ALTER TABLE public.skills_assessments ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_assessments_grading_check' AND conrelid = 'public.skills_assessments'::regclass
  ) THEN
    ALTER TABLE public.skills_assessments ADD CONSTRAINT skills_assessments_grading_check CHECK (grading_type IN ('manual', 'hybrid', 'auto'));
  END IF;
END $$;

-- =====================================================================
-- PART 5: SKILLS SUBMISSIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.skills_submissions (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  submitted_at timestamp WITH TIME ZONE DEFAULT NOW(),
  graded_at    timestamp WITH TIME ZONE
);
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS assessment_id   uuid REFERENCES public.skills_assessments(id) ON DELETE CASCADE;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS student_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS submission_url  text;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS submission_text text;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS score           integer;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS feedback        text;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS rubric_scores   jsonb DEFAULT '[]'; -- per-criterion scores
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS graded_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.skills_submissions ADD COLUMN IF NOT EXISTS status          text DEFAULT 'submitted';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_submissions_status_check' AND conrelid = 'public.skills_submissions'::regclass
  ) THEN
    ALTER TABLE public.skills_submissions ADD CONSTRAINT skills_submissions_status_check CHECK (status IN ('submitted', 'under_review', 'graded', 'returned'));
  END IF;
END $$;

-- One submission per student per assessment (upsert on resubmit)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_submissions_unique' AND conrelid = 'public.skills_submissions'::regclass
  ) THEN
    ALTER TABLE public.skills_submissions ADD CONSTRAINT skills_submissions_unique UNIQUE (assessment_id, student_id);
  END IF;
END $$;

-- =====================================================================
-- PART 6: COURSE RESULTS (Aggregated weighted scores per student)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.course_results (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS student_id        uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS course_id         uuid REFERENCES public.courses(id)  ON DELETE CASCADE;
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS quiz_average      numeric(5,2) DEFAULT 0; -- avg of all module quiz scores
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS skills_score      numeric(5,2) DEFAULT 0; -- score from skills assessment
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS final_exam_score  numeric(5,2) DEFAULT 0;
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS overall_score     numeric(5,2) DEFAULT 0;
-- (quiz_average * 0.3) + (skills_score * 0.2) + (final_exam_score * 0.5)
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS status            text DEFAULT 'in_progress';
ALTER TABLE public.course_results ADD COLUMN IF NOT EXISTS grade             text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_results_status_check' AND conrelid = 'public.course_results'::regclass
  ) THEN
    ALTER TABLE public.course_results ADD CONSTRAINT course_results_status_check CHECK (status IN ('in_progress','pass','fail'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_results_grade_check' AND conrelid = 'public.course_results'::regclass
  ) THEN
    ALTER TABLE public.course_results ADD CONSTRAINT course_results_grade_check CHECK (grade IN ('distinction','credit','pass','fail') OR grade IS NULL);
  END IF;
END $$;

-- Unique: one result row per student per course
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_results_student_course_unique' AND conrelid = 'public.course_results'::regclass
  ) THEN
    ALTER TABLE public.course_results ADD CONSTRAINT course_results_student_course_unique UNIQUE (student_id, course_id);
  END IF;
END $$;

-- =====================================================================
-- PART 7: CERTIFICATES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  issued_at    timestamp WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_id        uuid REFERENCES public.courses(id)  ON DELETE CASCADE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS final_score      numeric(5,2);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS grade            text; -- distinction | credit | pass
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_code text UNIQUE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_url  text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS is_valid         boolean DEFAULT true;

-- One cert per student per course
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certificates_student_course_unique' AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates ADD CONSTRAINT certificates_student_course_unique UNIQUE (student_id, course_id);
  END IF;
END $$;

-- =====================================================================
-- PART 8: ENABLE RLS
-- =====================================================================

ALTER TABLE public.question_bank        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates         ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- PART 9: DROP OLD POLICIES (idempotent)
-- =====================================================================

DROP POLICY IF EXISTS "qb_select_enrolled"    ON public.question_bank;
DROP POLICY IF EXISTS "qb_manage_instructor"  ON public.question_bank;
DROP POLICY IF EXISTS "qo_select_enrolled"    ON public.question_options;
DROP POLICY IF EXISTS "qo_manage_instructor"  ON public.question_options;
DROP POLICY IF EXISTS "sa_select_enrolled"    ON public.skills_assessments;
DROP POLICY IF EXISTS "sa_manage_instructor"  ON public.skills_assessments;
DROP POLICY IF EXISTS "ss_select_own"         ON public.skills_submissions;
DROP POLICY IF EXISTS "ss_insert_own"         ON public.skills_submissions;
DROP POLICY IF EXISTS "ss_update_instructor"  ON public.skills_submissions;
DROP POLICY IF EXISTS "cr_select_own"         ON public.course_results;
DROP POLICY IF EXISTS "cr_update_service"     ON public.course_results;
DROP POLICY IF EXISTS "cert_select_own"       ON public.certificates;
DROP POLICY IF EXISTS "cert_select_public"    ON public.certificates;
DROP POLICY IF EXISTS "cert_insert_service"   ON public.certificates;

-- =====================================================================
-- PART 10: RLS POLICIES
-- =====================================================================

-- QUESTION BANK
CREATE POLICY "qb_select_enrolled" ON public.question_bank
  FOR SELECT USING (
    -- Students enrolled in the course can view questions (options WITHOUT is_correct exposed via view)
    course_id IN (
      SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid() AND status IN ('active','completed')
    )
    OR
    -- Instructors for the course
    course_id IN (
      SELECT id FROM public.courses WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "qb_manage_instructor" ON public.question_bank
  FOR ALL USING (
    course_id IN (
      SELECT id FROM public.courses WHERE instructor_id = auth.uid()
    )
  );

-- QUESTION OPTIONS
CREATE POLICY "qo_select_enrolled" ON public.question_options
  FOR SELECT USING (
    question_id IN (
      SELECT id FROM public.question_bank WHERE course_id IN (
        SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid()
      )
      UNION
      SELECT id FROM public.question_bank WHERE course_id IN (
        SELECT id FROM public.courses WHERE instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "qo_manage_instructor" ON public.question_options
  FOR ALL USING (
    question_id IN (
      SELECT id FROM public.question_bank WHERE course_id IN (
        SELECT id FROM public.courses WHERE instructor_id = auth.uid()
      )
    )
  );

-- SKILLS ASSESSMENTS — viewable by enrolled students and course instructor
CREATE POLICY "sa_select_enrolled" ON public.skills_assessments
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid()
    )
    OR course_id IN (
      SELECT id FROM public.courses WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "sa_manage_instructor" ON public.skills_assessments
  FOR ALL USING (
    course_id IN (
      SELECT id FROM public.courses WHERE instructor_id = auth.uid()
    )
  );

-- SKILLS SUBMISSIONS
CREATE POLICY "ss_select_own" ON public.skills_submissions
  FOR SELECT USING (
    student_id = auth.uid()
    OR assessment_id IN (
      SELECT sa.id FROM public.skills_assessments sa
      JOIN public.courses c ON c.id = sa.course_id
      WHERE c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "ss_insert_own" ON public.skills_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "ss_update_instructor" ON public.skills_submissions
  FOR UPDATE USING (
    -- students can update their own ungraded submission
    (student_id = auth.uid() AND status = 'submitted')
    OR
    -- instructors can grade
    assessment_id IN (
      SELECT sa.id FROM public.skills_assessments sa
      JOIN public.courses c ON c.id = sa.course_id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- COURSE RESULTS
CREATE POLICY "cr_select_own" ON public.course_results
  FOR SELECT USING (
    student_id = auth.uid()
    OR course_id IN (
      SELECT id FROM public.courses WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "cr_update_service" ON public.course_results
  FOR ALL USING (true); -- managed by service role in server actions only

-- CERTIFICATES
CREATE POLICY "cert_select_own" ON public.certificates
  FOR SELECT USING (student_id = auth.uid());

-- Public route: /certificate/[code] — anyone can verify
CREATE POLICY "cert_select_public" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "cert_insert_service" ON public.certificates
  FOR INSERT WITH CHECK (true); -- service role only in server actions

-- =====================================================================
-- PART 11: PERFORMANCE INDEXES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_question_bank_course    ON public.question_bank(course_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_topic     ON public.question_bank(topic);
CREATE INDEX IF NOT EXISTS idx_question_options_qid    ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_skills_subs_assessment  ON public.skills_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skills_subs_student     ON public.skills_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_course_results_student  ON public.course_results(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code       ON public.certificates(certificate_code);

-- =====================================================================
-- PART 12: GRANT PERMISSIONS
-- =====================================================================

GRANT ALL ON public.question_bank        TO authenticated, service_role;
GRANT ALL ON public.question_options     TO authenticated, service_role;
GRANT ALL ON public.skills_assessments   TO authenticated, service_role;
GRANT ALL ON public.skills_submissions   TO authenticated, service_role;
GRANT ALL ON public.course_results       TO authenticated, service_role;
GRANT ALL ON public.certificates         TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
