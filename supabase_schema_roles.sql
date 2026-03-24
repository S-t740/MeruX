-- ==========================================
-- MTIH Learning Platform - Role-Based Dashboards & RBAC
-- ==========================================

-- 0. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create user_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'student', 
            'instructor', 
            'mentor', 
            'researcher', 
            'reviewer', 
            'admin', 
            'super_admin'
        );
    END IF;
END
$$;

-- 2. Clean up and standardise profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'student';

-- 3. Standardise Courses Table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'course';

-- ==========================================
-- 4. CREATE / UPDATE CORE TABLES (Migration Friendly)
-- ==========================================

-- Standardise Submissions (handle existing student_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        -- Rename student_id to user_id if student_id exists and user_id doesn't
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='student_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='user_id') THEN
            ALTER TABLE public.submissions RENAME COLUMN student_id TO user_id;
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  file_url text,
  status text DEFAULT 'Pending',
  score integer,
  feedback text,
  submitted_at timestamp WITH TIME ZONE DEFAULT NOW(),
  graded_at timestamp WITH TIME ZONE,
  UNIQUE(assignment_id, user_id)
);

-- Ensure user_id exists in submissions if table was created before
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Standardise Assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 100;

-- Standardise Startups
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS founder_id uuid REFERENCES auth.users(id);
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS description text;

-- Create course enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text DEFAULT 'Active',
  enrolled_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create research projects table
CREATE TABLE IF NOT EXISTS public.research_projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  supervisor_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'Proposal',
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Create research team members table
CREATE TABLE IF NOT EXISTS public.research_team (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'Researcher',
  joined_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create mentorship relationships table
CREATE TABLE IF NOT EXISTS public.mentorships (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.startups(id),
  status text DEFAULT 'active',
  started_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id, project_id)
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id),
  title text NOT NULL,
  issued_at timestamp WITH TIME ZONE DEFAULT NOW(),
  expires_at timestamp WITH TIME ZONE
);

-- ==========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==========================================

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'profiles', 'courses', 'enrollments', 'assignments', 
            'submissions', 'research_projects', 'research_team', 
            'startups', 'mentorships', 'certifications'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- ==========================================
-- 6. HELPER FUNCTIONS
-- ==========================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.check_user_role(target_role public.user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = target_role OR role IN ('admin', 'super_admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================

-- Drop all existing policies for these tables
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'courses', 'enrollments', 'assignments', 
            'submissions', 'research_projects', 'research_team', 
            'startups', 'mentorships', 'certifications'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- COURSES
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_manage" ON public.courses FOR ALL USING (instructor_id = auth.uid() OR public.is_admin());

-- ENROLLMENTS
CREATE POLICY "enrollments_select" ON public.enrollments FOR SELECT USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.courses WHERE id = public.enrollments.course_id AND instructor_id = auth.uid()));
CREATE POLICY "enrollments_insert" ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ASSIGNMENTS
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT USING (EXISTS(SELECT 1 FROM public.enrollments WHERE course_id = public.assignments.course_id AND user_id = auth.uid()) OR EXISTS(SELECT 1 FROM public.courses WHERE id = public.assignments.course_id AND instructor_id = auth.uid()));
CREATE POLICY "assignments_manage" ON public.assignments FOR ALL USING (EXISTS(SELECT 1 FROM public.courses WHERE id = public.assignments.course_id AND instructor_id = auth.uid()));

-- SUBMISSIONS
CREATE POLICY "submissions_owner" ON public.submissions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions_instructor" ON public.submissions FOR SELECT USING (EXISTS(SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = public.submissions.assignment_id AND c.instructor_id = auth.uid()));
CREATE POLICY "submissions_grade" ON public.submissions FOR UPDATE USING (EXISTS(SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = public.submissions.assignment_id AND c.instructor_id = auth.uid()));

-- RESEARCH
CREATE POLICY "research_select" ON public.research_projects FOR SELECT USING (supervisor_id = auth.uid() OR EXISTS(SELECT 1 FROM public.research_team WHERE project_id = public.research_projects.id AND user_id = auth.uid()));

-- STARTUPS
CREATE POLICY "startups_select" ON public.startups FOR SELECT USING (true);

-- MENTORSHIPS
CREATE POLICY "mentorships_select" ON public.mentorships FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- CERTIFICATIONS
CREATE POLICY "certifications_select" ON public.certifications FOR SELECT USING (user_id = auth.uid());
