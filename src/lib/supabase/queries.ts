import { createClient } from "./client";

// Reusable database query helpers (browser-side)
// These use the browser Supabase client and are safe for use in client components.

export const db = {
  // Courses
  async getCourses() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*, profiles!instructor_id(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCourseById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles!instructor_id(name, full_name, avatar_url),
        modules (
          *,
          lessons (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getModulesByCourseId(courseId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("modules")
      .select("*, lessons(*)")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLessonById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lessons")
      .select("*, modules(*, courses(*))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCourse(course: any) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert([course])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // Cohorts
  async getCohorts() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cohorts")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCohortById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cohorts")
      .select("*, cohort_members(user_id)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Research Projects
  async getResearchProjects() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("research_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createResearchProject(project: any) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("research_projects")
      .insert([project])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // User Profile
  async getUserProfile(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, profile: any) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", userId)
      .select();

    if (error) throw error;
    return data?.[0];
  },

  // Assignments
  async getAssignments(courseId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("course_id", courseId)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Submissions
  async getSubmissions(assignmentId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", assignmentId);

    if (error) throw error;
    return data;
  },

  async submitAssignment(submission: any) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("submissions")
      .insert([submission])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Dashboard Stats
  async getStudentStats(userId: string) {
    const supabase = createClient();

    const [courses, certifications, submissions] = await Promise.all([
      supabase.from("enrollments").select("*", { count: 'exact' }).eq("user_id", userId),
      supabase.from("certifications").select("*", { count: 'exact' }).eq("user_id", userId),
      supabase.from("submissions").select("*").eq("user_id", userId)
    ]);

    return {
      activeCourses: courses.count || 0,
      certifications: certifications.count || 0,
      averageScore: 0
    };
  },

  async getInstructorStats(instructorId: string) {
    const supabase = createClient();

    const [courses, pendingSubmissions] = await Promise.all([
      supabase.from("courses").select("*", { count: 'exact' }).eq("instructor_id", instructorId),
      supabase.from("submissions").select("*").eq("status", "submitted")
    ]);

    return {
      managedCourses: courses.count || 0,
      pendingReviews: pendingSubmissions.data?.length || 0
    };
  },

  async getAdminStats() {
    const supabase = createClient();

    const [users, courses, enrollments] = await Promise.all([
      supabase.from("profiles").select("*", { count: 'exact' }),
      supabase.from("courses").select("*", { count: 'exact' }),
      supabase.from("enrollments").select("*", { count: 'exact' })
    ]);

    return {
      totalUsers: users.count || 0,
      totalCourses: courses.count || 0,
      systemHealth: "Optimal"
    };
  }
};
