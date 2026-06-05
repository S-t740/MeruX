export type UserRole = 'admin' | 'instructor' | 'student' | 'mentor' | 'tutor' | 'researcher' | 'reviewer' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  bio?: string;
  avatar_url?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface StudentProfile extends UserProfile {
  role: 'student';
  cohort_id?: string;
  learning_hours?: number;
  certifications?: number;
  grade_point_average?: number;
}

export interface InstructorProfile extends UserProfile {
  role: 'instructor';
  courses: string[]; // course IDs
  students_taught?: number;
  specialization?: string;
}

export interface TutorProfile extends UserProfile {
  role: 'tutor';
  assigned_learners?: string[];
  specialization?: string;
  max_learners?: number;
  sessions_hosted?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  cohort_id?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  program: string;
  start_date: string;
  end_date: string;
  mentor_id?: string;
  max_students: number;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  team_members: string[];
  mentor_id?: string;
  status: 'proposal' | 'approved' | 'development' | 'review' | 'completed';
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  supervisor_id: string;
  researcher_ids: string[];
  status: 'proposal' | 'approved' | 'active' | 'completed';
  created_at: string;
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  founder_id: string;
  team_members: string[];
  stage: 'idea' | 'prototype' | 'seed' | 'funded';
  created_at: string;
}

// ─── Learning Studio (Virtual Classroom) ─────────────────────────────────────

export type SessionAccessType = 'code' | 'invite' | 'enrollment' | 'group' | 'open';
export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface LearningSession {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  host_name?: string;
  course_id?: string;
  course_title?: string;
  module_id?: string;
  group_id?: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  status: SessionStatus;
  access_type: SessionAccessType;
  session_code?: string;
  invite_link?: string;
  max_participants?: number;
  participant_count?: number;
  is_recorded: boolean;
  recording_url?: string;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  avatar_url?: string;
  joined_at: string;
  left_at?: string;
  duration_seconds?: number;
  is_muted: boolean;
  is_video_on: boolean;
  hand_raised: boolean;
  reaction?: string;
  is_host: boolean;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'chat' | 'question' | 'announcement' | 'system';
  is_answered?: boolean;
  created_at: string;
}

export interface Poll {
  id: string;
  session_id: string;
  question: string;
  options: PollOption[];
  is_active: boolean;
  total_responses: number;
  created_at: string;
  ends_at?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
}

export interface SessionRecording {
  id: string;
  session_id: string;
  session_title: string;
  host_name: string;
  course_title?: string;
  duration_seconds: number;
  file_url: string;
  thumbnail_url?: string;
  file_size_mb?: number;
  participant_count: number;
  recorded_at: string;
  is_public: boolean;
  created_at: string;
}

// ─── Tutor Mode ───────────────────────────────────────────────────────────────

export interface TutorAssignment {
  id: string;
  tutor_id: string;
  learner_id: string;
  course_id?: string;
  group_id?: string;
  assigned_at: string;
  status: 'active' | 'completed' | 'paused';
}

export interface MentorshipGroup {
  id: string;
  name: string;
  description?: string;
  tutor_id: string;
  course_id?: string;
  member_ids: string[];
  max_members: number;
  status: 'active' | 'archived';
  goals?: string[];
  created_at: string;
}

export interface LearnerProgress {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  avatar_url?: string;
  course_id: string;
  course_title: string;
  overall_progress: number;    // 0–100
  modules_completed: number;
  total_modules: number;
  last_active: string;
  attendance_rate: number;     // 0–100
  assessment_avg: number;      // 0–100
  engagement_score: number;    // 0–100
  status: 'on_track' | 'at_risk' | 'ahead' | 'inactive';
  sessions_attended: number;
  total_sessions: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface EngagementDataPoint {
  date: string;
  active_learners: number;
  sessions_held: number;
  completions: number;
  ai_queries: number;
}

export interface CoursePerformance {
  course_id: string;
  course_title: string;
  enrolled: number;
  completed: number;
  avg_score: number;
  completion_rate: number;
  avg_engagement: number;
}

export interface TutorEffectiveness {
  tutor_id: string;
  tutor_name: string;
  learners_assigned: number;
  sessions_hosted: number;
  avg_learner_progress: number;
  completion_rate: number;
  satisfaction_score?: number;
}

export interface AttendanceDataPoint {
  week: string;
  attended: number;
  absent: number;
  late: number;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  price_monthly?: number;
  limits: {
    max_learners: number;
    max_tutors: number;
    max_session_participants: number;
    recording_storage_gb: number;
    ai_queries_monthly: number;
    analytics_access: boolean;
    custom_branding: boolean;
  };
}

export interface InstitutionSettings {
  id: string;
  institution_name: string;
  plan_tier: PlanTier;
  current_usage: {
    learners: number;
    tutors: number;
    storage_used_gb: number;
    ai_queries_used: number;
  };
  settings: {
    require_session_approval: boolean;
    allow_guest_viewers: boolean;
    recording_enabled: boolean;
    ai_assistant_enabled: boolean;
  };
}
