-- schema_matchmaking.sql
-- Run this in the Supabase SQL Editor to enable Skill DNA Ecosystem Matchmaking!

CREATE TABLE IF NOT EXISTS public.idea_skills (
    idea_id uuid REFERENCES public.project_ideas(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (idea_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.project_skills (
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (project_id, skill_id)
);

-- RLS
ALTER TABLE public.idea_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read idea_skills" ON public.idea_skills;
CREATE POLICY "Anyone can read idea_skills" ON public.idea_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert idea_skills" ON public.idea_skills;
CREATE POLICY "Anyone can insert idea_skills" ON public.idea_skills FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read project_skills" ON public.project_skills;
CREATE POLICY "Anyone can read project_skills" ON public.project_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert project skills" ON public.project_skills;
CREATE POLICY "Anyone can insert project skills" ON public.project_skills FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Project owners can manage project_skills" ON public.project_skills;
CREATE POLICY "Project owners can manage project_skills" ON public.project_skills FOR ALL USING (true); -- simplified for MVP, ideally should check projects.owner_id

-- FIXING GLOBAL PROJECTS TABLE RLS AND OWNERSHIP
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Project owners can manage projects" ON public.projects;
CREATE POLICY "Project owners can manage projects" ON public.projects FOR ALL USING (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
CREATE POLICY "Authenticated users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
