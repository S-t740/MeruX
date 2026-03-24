-- ==========================================
-- SCHEMA ADDITIONS for Modules 2-5
-- ==========================================

-- Project Milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending', -- pending, in-progress, completed
  due_date timestamp WITH TIME ZONE,
  completed_at timestamp WITH TIME ZONE,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Project Deliverables
CREATE TABLE IF NOT EXISTS public.project_deliverables (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  submitted_by uuid REFERENCES public.profiles(id),
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Course Resources
CREATE TABLE IF NOT EXISTS public.course_resources (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text DEFAULT 'document', -- document, video, slide, link
  url text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select" ON public.project_milestones FOR SELECT USING (true);
CREATE POLICY "milestones_manage" ON public.project_milestones FOR ALL USING (
  EXISTS(SELECT 1 FROM public.project_members pm WHERE pm.project_id = public.project_milestones.project_id AND pm.user_id = auth.uid())
  OR public.is_admin()
);

CREATE POLICY "deliverables_select" ON public.project_deliverables FOR SELECT USING (true);
CREATE POLICY "deliverables_manage" ON public.project_deliverables FOR ALL USING (
  EXISTS(SELECT 1 FROM public.project_members pm WHERE pm.project_id = public.project_deliverables.project_id AND pm.user_id = auth.uid())
  OR public.is_admin()
);

CREATE POLICY "resources_select" ON public.course_resources FOR SELECT USING (true);
CREATE POLICY "resources_manage" ON public.course_resources FOR ALL USING (
  EXISTS(SELECT 1 FROM public.courses c WHERE c.id = public.course_resources.course_id AND c.instructor_id = auth.uid())
  OR public.is_admin()
);
