-- ==========================================
-- PRODUCTION-READY LMS MVP - COMPREHENSIVE SCHEMA
-- Built for Institutional Scalability
-- ==========================================

-- 0. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'super_admin',
            'admin',
            'instructor',
            'mentor',
            'student',
            'researcher',
            'reviewer'
        );
    END IF;
END
$$;

-- 2. CORE USERS & PROFILES
-- Profiles linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role public.user_role DEFAULT 'student',
  bio text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- 3. COURSES, MODULES & LESSONS
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  instructor_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'draft', -- draft, published, archived
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  updated_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text, -- Markdown or JSON for rich text
  video_url text,
  order_index integer DEFAULT 0,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENROLLMENTS & COHORTS
CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  enrolled_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.cohort_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'student',
  joined_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cohort_id, user_id)
);

-- 5. ASSIGNMENTS & GRADING
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamp WITH TIME ZONE,
  max_score integer DEFAULT 100,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  file_url text,
  status text DEFAULT 'submitted',
  submitted_at timestamp WITH TIME ZONE DEFAULT NOW(),
  graded_at timestamp WITH TIME ZONE,
  UNIQUE(assignment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.grades (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  grader_id uuid REFERENCES public.profiles(id),
  score integer NOT NULL,
  feedback text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id)
);

-- 6. PROJECTS (Innovation Hub)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text DEFAULT 'proposal', -- proposal, approved, in-progress, completed
  mentor_id uuid REFERENCES public.profiles(id),
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 7. RESEARCH COLLABORATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_projects') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='research_projects' AND column_name='supervisor_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='research_projects' AND column_name='principal_investigator_id') THEN
            ALTER TABLE public.research_projects RENAME COLUMN supervisor_id TO principal_investigator_id;
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.research_projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  principal_investigator_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'draft',
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.research_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'researcher',
  UNIQUE(project_id, user_id)
);

-- 8. MENTORSHIP
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id uuid REFERENCES public.profiles(id),
  mentee_id uuid REFERENCES public.profiles(id),
  scheduled_at timestamp WITH TIME ZONE NOT NULL,
  duration_minutes integer DEFAULT 60,
  notes text,
  status text DEFAULT 'scheduled',
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- 9. CERTIFICATIONS & BADGES
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  issue_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  certificate_url text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon_url text,
  awarded_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- 10. SYSTEM SERVICES (Events, Notifications, Messages)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_time timestamp WITH TIME ZONE NOT NULL,
  end_time timestamp WITH TIME ZONE NOT NULL,
  location text,
  organizer_id uuid REFERENCES public.profiles(id),
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text, -- deadline, announcement, message, research
  is_read boolean DEFAULT false,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id),
  receiver_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 11. HELPER FUNCTIONS for RLS
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
-- 12. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Drop all existing policies to make script re-runnable
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- POLICIES

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- COURSES
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_manage" ON public.courses FOR ALL USING (instructor_id = auth.uid() OR public.is_admin());

-- MODULES & LESSONS (Viewable if course is viewable)
CREATE POLICY "modules_select" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules_manage" ON public.modules FOR ALL USING (EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.modules.course_id AND c.instructor_id = auth.uid()) OR public.is_admin());

CREATE POLICY "lessons_select" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "lessons_manage" ON public.lessons FOR ALL USING (EXISTS(SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = public.lessons.module_id AND c.instructor_id = auth.uid()) OR public.is_admin());

-- ENROLLMENTS
CREATE POLICY "enrollments_select" ON public.course_enrollments FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "enrollments_insert" ON public.course_enrollments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ASSIGNMENTS
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_manage" ON public.assignments FOR ALL USING (EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.assignments.course_id AND c.instructor_id = auth.uid()) OR public.is_admin());

-- SUBMISSIONS & GRADES
CREATE POLICY "submissions_owner" ON public.submissions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "submissions_instructor" ON public.submissions FOR SELECT USING (EXISTS(SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id WHERE a.id = public.submissions.assignment_id AND c.instructor_id = auth.uid()));
CREATE POLICY "grades_select" ON public.grades FOR SELECT USING (EXISTS(SELECT 1 FROM public.submissions s WHERE s.id = public.grades.submission_id AND s.user_id = auth.uid()) OR public.is_admin());

-- PROJECTS & RESEARCH
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "research_select" ON public.research_projects FOR SELECT USING (principal_investigator_id = auth.uid() OR public.is_admin());

-- MENTORSHIP
CREATE POLICY "mentorship_select" ON public.mentorship_sessions FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- NOTIFICATIONS & MESSAGES
CREATE POLICY "notifications_owner" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "messages_owner" ON public.messages FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());
-- COHORTS & MEMBERS
CREATE POLICY "cohorts_select" ON public.cohorts FOR SELECT USING (true);
CREATE POLICY "cohort_members_select" ON public.cohort_members FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- PROJECT & RESEARCH MEMBERS
CREATE POLICY "project_members_select" ON public.project_members FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "research_members_select" ON public.research_members FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- CERTIFICATIONS & BADGES
CREATE POLICY "certifications_select" ON public.certifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- EVENTS
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_manage" ON public.events FOR ALL USING (public.is_admin());
