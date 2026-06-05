-- ============================================================
-- MERUX ENTERPRISE EXTENSION — DATABASE SCHEMA MIGRATION
-- Run this in the Supabase SQL Editor after the base LMS schema
--
-- ⚠️  IMPORTANT: Run this file in TWO separate steps:
--
--   STEP 1 ─ Run only the block below (lines up to the STEP 2 marker).
--             This commits the new enum value in its own transaction.
--
--   STEP 2 ─ Run the remainder of this file (everything after the marker).
--             PostgreSQL requires the enum value to be committed before it
--             can be referenced in CHECK constraints or policies.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- STEP 1 — Run this block FIRST, on its own, then click Run.
-- ════════════════════════════════════════════════════════════

-- ─── 0. Extend user_role enum ─────────────────────────────────────────────────
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tutor';

-- ════════════════════════════════════════════════════════════
-- STOP HERE after running Step 1.
-- Then delete or comment out Step 1 above and run Step 2 below.
-- ════════════════════════════════════════════════════════════

-- ─── 1. TUTOR ASSIGNMENTS ─────────────────────────────────────────────────────
-- Links tutors to specific learners (optionally within a course)
CREATE TABLE IF NOT EXISTS public.tutor_assignments (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    learner_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id   uuid REFERENCES public.courses(id)  ON DELETE SET NULL,
    group_id    uuid,  -- FK added after group table created
    status      text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    assigned_at timestamp WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, learner_id, course_id)
);

-- ─── 2. MENTORSHIP GROUPS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tutor_groups (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        text NOT NULL,
    description text,
    tutor_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id   uuid REFERENCES public.courses(id)  ON DELETE SET NULL,
    max_members integer DEFAULT 10,
    status      text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    goals       text[], -- Array of goal strings
    created_at  timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tutor_group_members (
    id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id   uuid REFERENCES public.tutor_groups(id) ON DELETE CASCADE,
    learner_id uuid REFERENCES public.profiles(id)     ON DELETE CASCADE,
    joined_at  timestamp WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, learner_id)
);

-- Add FK from tutor_assignments to tutor_groups
ALTER TABLE public.tutor_assignments
    ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.tutor_groups(id) ON DELETE SET NULL;

-- ─── 3. LEARNING SESSIONS (Virtual Classroom) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title               text NOT NULL,
    description         text,
    host_id             uuid REFERENCES public.profiles(id),
    course_id           uuid REFERENCES public.courses(id)     ON DELETE SET NULL,
    module_id           uuid REFERENCES public.modules(id)     ON DELETE SET NULL,
    group_id            uuid REFERENCES public.tutor_groups(id) ON DELETE SET NULL,
    scheduled_at        timestamp WITH TIME ZONE NOT NULL,
    started_at          timestamp WITH TIME ZONE,
    ended_at            timestamp WITH TIME ZONE,
    duration_minutes    integer,
    status              text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    access_type         text DEFAULT 'enrollment' CHECK (access_type IN ('code', 'invite', 'enrollment', 'group', 'open')),
    session_code        text UNIQUE,
    invite_token        text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    max_participants    integer DEFAULT 50,
    is_recorded         boolean DEFAULT true,
    recording_url       text,
    created_at          timestamp WITH TIME ZONE DEFAULT NOW(),
    updated_at          timestamp WITH TIME ZONE DEFAULT NOW()
);

-- ─── 4. SESSION PARTICIPANTS (Attendance Tracking) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_participants (
    id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id       uuid REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    user_id          uuid REFERENCES public.profiles(id)           ON DELETE CASCADE,
    joined_at        timestamp WITH TIME ZONE DEFAULT NOW(),
    left_at          timestamp WITH TIME ZONE,
    duration_seconds integer,
    is_host          boolean DEFAULT false,
    is_muted         boolean DEFAULT true,
    is_video_on      boolean DEFAULT false,
    hand_raised      boolean DEFAULT false,
    reaction         text,
    UNIQUE(session_id, user_id)
);

-- ─── 5. SESSION MESSAGES (Live Chat) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_messages (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id  uuid REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    sender_id   uuid REFERENCES public.profiles(id),
    content     text NOT NULL,
    type        text DEFAULT 'chat' CHECK (type IN ('chat', 'question', 'announcement', 'system')),
    is_answered boolean DEFAULT false,
    created_at  timestamp WITH TIME ZONE DEFAULT NOW()
);

-- ─── 6. POLLS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_polls (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id  uuid REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    question    text NOT NULL,
    options     jsonb NOT NULL DEFAULT '[]',  -- [{id, text, votes}]
    is_active   boolean DEFAULT true,
    ends_at     timestamp WITH TIME ZONE,
    created_at  timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_poll_responses (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id     uuid REFERENCES public.session_polls(id)   ON DELETE CASCADE,
    session_id  uuid REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    user_id     uuid REFERENCES public.profiles(id)          ON DELETE CASCADE,
    option_id   text NOT NULL,
    created_at  timestamp WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- ─── 7. SESSION RECORDINGS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_recordings (
    id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id        uuid REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    file_url          text NOT NULL,
    thumbnail_url     text,
    duration_seconds  integer,
    file_size_mb      numeric(10, 2),
    participant_count integer DEFAULT 0,
    is_public         boolean DEFAULT false,
    recorded_at       timestamp WITH TIME ZONE DEFAULT NOW(),
    created_at        timestamp WITH TIME ZONE DEFAULT NOW()
);

-- ─── 8. LEARNER PROGRESS SNAPSHOTS ───────────────────────────────────────────
-- Daily snapshots for analytics and trend analysis
CREATE TABLE IF NOT EXISTS public.learner_progress_snapshots (
    id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    learner_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id        uuid REFERENCES public.courses(id)  ON DELETE CASCADE,
    snapshot_date    date DEFAULT CURRENT_DATE,
    overall_progress numeric(5,2) DEFAULT 0,
    modules_completed integer DEFAULT 0,
    assessment_avg   numeric(5,2),
    sessions_attended integer DEFAULT 0,
    engagement_score numeric(5,2),
    created_at       timestamp WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(learner_id, course_id, snapshot_date)
);

-- ─── 9. INSTITUTION SETTINGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institution_settings (
    id                         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    institution_name           text NOT NULL DEFAULT 'MeruX Institution',
    plan_tier                  text DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise')),
    max_learners               integer DEFAULT 25,
    max_tutors                 integer DEFAULT 2,
    max_session_participants   integer DEFAULT 10,
    recording_storage_gb       integer DEFAULT 1,
    ai_queries_monthly         integer DEFAULT 100,
    analytics_access           boolean DEFAULT false,
    custom_branding            boolean DEFAULT false,
    require_session_approval   boolean DEFAULT false,
    allow_guest_viewers        boolean DEFAULT false,
    recording_enabled          boolean DEFAULT true,
    ai_assistant_enabled       boolean DEFAULT true,
    created_at                 timestamp WITH TIME ZONE DEFAULT NOW(),
    updated_at                 timestamp WITH TIME ZONE DEFAULT NOW()
);

-- Insert default institution settings if none exist
INSERT INTO public.institution_settings (institution_name, plan_tier)
SELECT 'MeruX Institution', 'professional'
WHERE NOT EXISTS (SELECT 1 FROM public.institution_settings);

-- ─── 10. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE public.tutor_assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_group_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_polls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_poll_responses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_recordings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings      ENABLE ROW LEVEL SECURITY;

-- Tutor Assignments: tutors see their own assignments; admins see all
CREATE POLICY "tutor_assignments_select" ON public.tutor_assignments
    FOR SELECT USING (tutor_id = auth.uid() OR learner_id = auth.uid() OR public.is_admin());

CREATE POLICY "tutor_assignments_manage" ON public.tutor_assignments
    FOR ALL USING (public.is_admin() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tutor')
    ));

-- Groups: tutors manage their own groups
CREATE POLICY "tutor_groups_select" ON public.tutor_groups
    FOR SELECT USING (tutor_id = auth.uid() OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.tutor_group_members WHERE group_id = tutor_groups.id AND learner_id = auth.uid()));

CREATE POLICY "tutor_groups_manage" ON public.tutor_groups
    FOR ALL USING (tutor_id = auth.uid() OR public.is_admin());

-- Group Members
CREATE POLICY "tutor_group_members_select" ON public.tutor_group_members
    FOR SELECT USING (learner_id = auth.uid() OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.tutor_groups g WHERE g.id = tutor_group_members.group_id AND g.tutor_id = auth.uid()));

-- Learning Sessions: everyone can see scheduled/live sessions
CREATE POLICY "learning_sessions_select" ON public.learning_sessions
    FOR SELECT USING (
        status IN ('live', 'scheduled', 'ended') OR
        host_id = auth.uid() OR
        public.is_admin()
    );

CREATE POLICY "learning_sessions_manage" ON public.learning_sessions
    FOR ALL USING (host_id = auth.uid() OR public.is_admin());

-- Session Participants: participants see their own records
CREATE POLICY "session_participants_select" ON public.session_participants
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_participants.session_id AND s.host_id = auth.uid()));

CREATE POLICY "session_participants_insert" ON public.session_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_participants_update" ON public.session_participants
    FOR UPDATE USING (user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_participants.session_id AND s.host_id = auth.uid()));

-- Session Messages: participants in session can read/write
CREATE POLICY "session_messages_select" ON public.session_messages
    FOR SELECT USING (
        sender_id = auth.uid() OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_messages.session_id AND sp.user_id = auth.uid())
    );

CREATE POLICY "session_messages_insert" ON public.session_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Polls
CREATE POLICY "session_polls_select" ON public.session_polls
    FOR SELECT USING (true); -- all authenticated users can see polls

CREATE POLICY "session_poll_responses_insert" ON public.session_poll_responses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_poll_responses_select" ON public.session_poll_responses
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Recordings: available to participants who attended
CREATE POLICY "session_recordings_select" ON public.session_recordings
    FOR SELECT USING (
        is_public = true OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_recordings.session_id AND sp.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_recordings.session_id AND s.host_id = auth.uid())
    );

-- Progress Snapshots: learners see own, tutors see assigned
CREATE POLICY "progress_snapshots_select" ON public.learner_progress_snapshots
    FOR SELECT USING (
        learner_id = auth.uid() OR public.is_admin() OR
        EXISTS (SELECT 1 FROM public.tutor_assignments ta WHERE ta.learner_id = learner_progress_snapshots.learner_id AND ta.tutor_id = auth.uid())
    );

-- Institution Settings: only admins
CREATE POLICY "institution_settings_select" ON public.institution_settings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "institution_settings_update" ON public.institution_settings
    FOR UPDATE USING (public.is_admin());

-- ─── 11. REALTIME PUBLICATION ─────────────────────────────────────────────────
-- Enable realtime for live session features
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_sessions;

-- ─── 12. INDEXES FOR PERFORMANCE ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_tutor   ON public.tutor_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_assignments_learner ON public.tutor_assignments(learner_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_host    ON public.learning_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status  ON public.learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session  ON public.session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created  ON public.session_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_learner ON public.learner_progress_snapshots(learner_id, course_id);
