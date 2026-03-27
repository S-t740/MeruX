-- ==========================================
-- PHASE 3: AI-POWERED ECOSYSTEM SCHEMA
-- ==========================================
-- This migration script creates the core tracking tables for:
-- 1. Skill DNA System
-- 2. Learning Heatmap Analytics
-- 3. Innovation Engine (Projects)
-- 4. Reputation System
-- 5. Auto Portfolio Generator

-- Ensure the UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. SKILL DNA SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    category text NOT NULL, -- e.g., 'technical', 'soft_skill', 'leadership'
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_skills (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    level_score integer DEFAULT 0 NOT NULL,         -- 0 to 100 actual skill
    confidence_score integer DEFAULT 0 NOT NULL,    -- 0 to 100 system confidence
    last_assessed_at timestamp with time zone,
    UNIQUE(user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.skill_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL, -- e.g., 'course_completion', 'assignment_score', 'peer_collaboration'
    points_awarded integer DEFAULT 0 NOT NULL,
    reference_id uuid, -- Optional link to course/assignment modifying the skill
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. LEARNING HEATMAP ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.lesson_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    time_spent_seconds integer DEFAULT 0 NOT NULL,
    video_duration_watched integer DEFAULT 0,
    drop_off_second integer DEFAULT 0,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. INNOVATION ENGINE (PROJECT GENERATOR)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_ideas (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    problem_statement text NOT NULL,
    suggested_tech_stack text[],
    difficulty_level text, -- 'Beginner', 'Intermediate', 'Advanced'
    source_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL, -- What course triggered this idea
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_projects (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    idea_id uuid REFERENCES public.project_ideas(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'idea', -- 'idea', 'proposal', 'approved', 'development', 'completed'
    github_url text,
    demo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_members (
    project_id uuid REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member', -- 'owner', 'member', 'mentor'
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- ==========================================
-- 4. REPUTATION SYSTEM (ACADEMIC GITHUB)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    total_score integer DEFAULT 0 NOT NULL,
    rank_title text DEFAULT 'Novice',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reputation_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL, -- 'course_mastery', 'project_built', 'peer_help'
    points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. AUTO PORTFOLIO GENERATOR
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_portfolios (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE NOT NULL, -- Used for /portfolio/[username]
    theme_color text DEFAULT '#6366f1', -- Default hub-indigo
    custom_bio text,
    is_public boolean DEFAULT true,
    featured_project_id uuid REFERENCES public.user_projects(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- ROW LEVEL SECURITY RULES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- 1. Skills (Global read)
DROP POLICY IF EXISTS "Anyone can read skills" ON public.skills;
CREATE POLICY "Anyone can read skills" ON public.skills FOR SELECT USING (true);

-- 2. User Skills & Events (Owner read/update)
DROP POLICY IF EXISTS "Users can read their own skills" ON public.user_skills;
CREATE POLICY "Users can read their own skills" ON public.user_skills FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can read own skill events" ON public.skill_events;
CREATE POLICY "Users can read own skill events" ON public.skill_events FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');

-- 3. Lesson Analytics (System / Owner read)
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.lesson_analytics;
CREATE POLICY "Users can insert own analytics" ON public.lesson_analytics FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view own analytics" ON public.lesson_analytics;
CREATE POLICY "Users can view own analytics" ON public.lesson_analytics FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');

-- 4. Projects (Public read, Owner mutate)
DROP POLICY IF EXISTS "Anyone can read project ideas" ON public.project_ideas;
CREATE POLICY "Anyone can read project ideas" ON public.project_ideas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can read user projects" ON public.user_projects;
CREATE POLICY "Anyone can read user projects" ON public.user_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Project owners can insert/update projects" ON public.user_projects;
CREATE POLICY "Project owners can insert/update projects" ON public.user_projects FOR ALL USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Project members can read project members" ON public.project_members;
CREATE POLICY "Project members can read project members" ON public.project_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Project members can manage their own membership" ON public.project_members;
CREATE POLICY "Project members can manage their own membership" ON public.project_members FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- 5. Reputation (Public read)
DROP POLICY IF EXISTS "Anyone can read user reputation" ON public.user_reputation;
CREATE POLICY "Anyone can read user reputation" ON public.user_reputation FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can read reputation events" ON public.reputation_events;
CREATE POLICY "Anyone can read reputation events" ON public.reputation_events FOR SELECT USING (true);

-- 6. Portfolios (Public route enabled)
DROP POLICY IF EXISTS "Public portfolios are viewable by everyone" ON public.user_portfolios;
CREATE POLICY "Public portfolios are viewable by everyone" ON public.user_portfolios FOR SELECT USING (is_public = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own portfolio" ON public.user_portfolios;
CREATE POLICY "Users can update own portfolio" ON public.user_portfolios FOR ALL USING (user_id = auth.uid());


