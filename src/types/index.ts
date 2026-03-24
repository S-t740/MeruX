export type UserRole = 'admin' | 'instructor' | 'student' | 'mentor' | 'researcher' | 'reviewer' | 'super_admin';

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
