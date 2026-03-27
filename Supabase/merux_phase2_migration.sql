-- ==========================================
-- MERUX PLATFORM EXPANSION SCHEMA (PHASE 2)
-- 70+ TABLE ARCHITECTURE
-- ==========================================

-- MODULE 5 & 7: INNOVATION & STARTUP INCUBATION
CREATE TABLE IF NOT EXISTS public.startup_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  pitch_deck_url text,
  funding_stage text DEFAULT 'pre-seed',
  tags text[],
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE TABLE IF NOT EXISTS public.funding_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id uuid REFERENCES public.startup_profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  justification text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 6: RESEARCH COLLABORATION HUB
CREATE TABLE IF NOT EXISTS public.research_datasets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  research_id uuid REFERENCES public.research_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  visibility text DEFAULT 'private', -- private, internal, public
  doi text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_publications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  research_id uuid REFERENCES public.research_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  journal text,
  publication_date date,
  url text,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 8: MENTORSHIP PLATFORM
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise_areas text[] NOT NULL,
  availability_schedule jsonb,
  max_mentees integer DEFAULT 5,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  goals text NOT NULL,
  status text DEFAULT 'pending', -- pending, accepted, declined
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Make mentorship_sessions.meeting_url nullable text instead of assuming it exists. We modify existing table.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mentorship_sessions' AND column_name='meeting_url') THEN
        ALTER TABLE public.mentorship_sessions ADD COLUMN meeting_url text;
    END IF;
END $$;


-- MODULE 9: CERTIFICATIONS & BADGES WALLET
CREATE TABLE IF NOT EXISTS public.user_certifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  cert_id uuid REFERENCES public.certifications(id) ON DELETE CASCADE,
  issued_at timestamp WITH TIME ZONE DEFAULT NOW(),
  expires_at timestamp WITH TIME ZONE,
  credential_url text,
  UNIQUE(user_id, cert_id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- MODULE 10: EVENTS
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'registered', -- registered, attended, cancelled
  registered_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- MODULE 3: COHORTS (Enhancements)
CREATE TABLE IF NOT EXISTS public.cohort_discussions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) EXPANSION
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE public.startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_discussions ENABLE ROW LEVEL SECURITY;

-- NEW RLS POLICIES

-- Startups (Viewable by all, editable by project members)
CREATE POLICY "startup_select" ON public.startup_profiles FOR SELECT USING (true);
CREATE POLICY "startup_manage" ON public.startup_profiles FOR ALL USING (EXISTS(SELECT 1 FROM public.project_members pm WHERE pm.project_id = public.startup_profiles.project_id AND pm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "funding_select" ON public.funding_requests FOR SELECT USING (true);
CREATE POLICY "funding_manage" ON public.funding_requests FOR ALL USING (public.is_admin());

-- Research Datasets/Pubs (Public see public visibility, members see all)
CREATE POLICY "datasets_select" ON public.research_datasets FOR SELECT USING (visibility = 'public' OR EXISTS(SELECT 1 FROM public.research_members rm WHERE rm.project_id = public.research_datasets.research_id AND rm.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "datasets_manage" ON public.research_datasets FOR ALL USING (EXISTS(SELECT 1 FROM public.research_members rm WHERE rm.project_id = public.research_datasets.research_id AND rm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "publications_select" ON public.research_publications FOR SELECT USING (true);
CREATE POLICY "publications_manage" ON public.research_publications FOR ALL USING (EXISTS(SELECT 1 FROM public.research_members rm WHERE rm.project_id = public.research_publications.research_id AND rm.user_id = auth.uid()) OR public.is_admin());

-- Mentorship
CREATE POLICY "mentor_profiles_select" ON public.mentor_profiles FOR SELECT USING (true);
CREATE POLICY "mentor_profiles_manage" ON public.mentor_profiles FOR ALL USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "mentorship_requests_select" ON public.mentorship_requests FOR SELECT USING (mentee_id = auth.uid() OR mentor_id = auth.uid() OR public.is_admin());
CREATE POLICY "mentorship_requests_insert" ON public.mentorship_requests FOR INSERT WITH CHECK (mentee_id = auth.uid());
CREATE POLICY "mentorship_requests_update" ON public.mentorship_requests FOR UPDATE USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_admin());

-- Certifications/Wallet (Public validation via URL lookup, so select is true)
CREATE POLICY "user_certifications_select" ON public.user_certifications FOR SELECT USING (true);
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (true);

-- Events
CREATE POLICY "event_attendees_select" ON public.event_attendees FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "event_attendees_insert" ON public.event_attendees FOR INSERT WITH CHECK (user_id = auth.uid());

-- Cohorts
CREATE POLICY "cohort_discussions_select" ON public.cohort_discussions FOR SELECT USING (EXISTS(SELECT 1 FROM public.cohort_members cm WHERE cm.cohort_id = public.cohort_discussions.cohort_id AND cm.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "cohort_discussions_insert" ON public.cohort_discussions FOR INSERT WITH CHECK (user_id = auth.uid());
