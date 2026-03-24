"use client"

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Book, CheckCircle, Loader2, Users, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CourseManagement() {
    const { user } = useAuth();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [userEnrollments, setUserEnrollments] = useState<string[]>([]);
    const [userRole, setUserRole] = useState<string>("student");
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    // Create course modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [courseForm, setCourseForm] = useState({ title: "", description: "", level: "Beginner" });

    const fetchData = async () => {
        try {
            const [coursesRes, enrollmentsRes, profileRes] = await Promise.all([
                supabase.from("courses").select("*").order("created_at", { ascending: false }),
                user ? supabase.from("course_enrollments").select("course_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
                user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null })
            ]);

            // Fetch instructor names separately since the FK join doesn't work
            const courseList = coursesRes.data || [];
            const instructorIds = [...new Set(courseList.map((c: any) => c.instructor_id).filter(Boolean))];
            if (instructorIds.length > 0) {
                const { data: instructors } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name")
                    .in("id", instructorIds);
                const instructorMap = new Map((instructors || []).map((i: any) => [i.id, i]));
                courseList.forEach((c: any) => {
                    c.instructor = instructorMap.get(c.instructor_id) || null;
                });
            }

            setCourses(courseList);
            setUserEnrollments(enrollmentsRes.data?.map((e: any) => e.course_id) || []);
            if (profileRes.data) setUserRole(profileRes.data.role);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, supabase]);

    const handleEnroll = async (courseId: string) => {
        if (!user) return;
        setEnrollingId(courseId);
        try {
            const { error } = await supabase.from("course_enrollments").insert({
                user_id: user.id,
                course_id: courseId,
                status: 'active'
            });
            if (error) throw error;
            setUserEnrollments(prev => [...prev, courseId]);
        } catch (error) {
            console.error("Enrollment failed:", error);
            alert("Enrollment failed. Please try again.");
        } finally {
            setEnrollingId(null);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setCreating(true);
        try {
            const { error } = await supabase.from("courses").insert({
                title: courseForm.title,
                description: courseForm.description,
                instructor_id: user.id,
                status: 'Published' // Auto-publish for MVP
            });
            if (error) throw error;
            setShowCreateModal(false);
            setCourseForm({ title: "", description: "", level: "Beginner" });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to create course");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Loading innovation curriculum...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold">Create New Course</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-accent rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Course Title *</label>
                                <input required value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Advanced AI Integration" className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description *</label>
                                <textarea required value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide an overview of the curriculum..." rows={4} className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm resize-none transition-all" />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-accent rounded-xl font-bold text-sm hover:bg-accent/80 transition-all">Cancel</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 bg-hub-indigo text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-hub-indigo/90 transition-all disabled:opacity-60">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {creating ? "Creating..." : "Publish Course"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Curriculum Hub</h1>
                    <p className="page-description">Explore our industry-led courses and join the next cohort of innovators.</p>
                </div>
                {(userRole === 'admin' || userRole === 'instructor' || user?.user_metadata?.role === 'admin') && (
                    <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20 active:scale-95">
                        <Plus className="w-4 h-4" />
                        Create Course
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses or topics..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <CourseListItem
                        key={course.id}
                        course={course}
                        isEnrolled={userEnrollments.includes(course.id)}
                        onEnroll={() => handleEnroll(course.id)}
                        isEnrolling={enrollingId === course.id}
                        userRole={userRole}
                        userId={user?.id}
                    />
                ))}
                {courses.length === 0 && (
                    <div className="col-span-full premium-card p-20 text-center text-muted-foreground font-medium">
                        No courses available at the moment. Check back soon!
                    </div>
                )}
            </div>
        </div>
    );
}


function CourseListItem({ course, isEnrolled, onEnroll, isEnrolling, userRole, userId }: any) {
    const instructorName = course.instructor?.first_name ? `${course.instructor.first_name} ${course.instructor.last_name || ''}`.trim() : "Instructor";
    const navRouter = useRouter();

    const isInstructor = userId && course.instructor_id === userId;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    const canManage = isInstructor || isAdmin;
    const isStudent = !canManage;

    return (
        <div className="premium-card group flex flex-col h-full">
            <Link href={`/courses/${course.id}`} className="block h-40 bg-accent/50 relative overflow-hidden">
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm text-white z-10"
                    style={{ background: course.status === 'Published' ? 'rgba(16,185,129,0.3)' : 'rgba(100,100,100,0.3)' }}>
                    {course.status || 'Draft'}
                </div>
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {course.level || 'All Levels'}
                </div>
            </Link>
            <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">
                            By {instructorName}
                        </span>
                        {isEnrolled && isStudent && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-hub-teal uppercase tracking-widest">
                                <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                        )}
                        {canManage && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">
                                {isInstructor ? 'Your Course' : 'Admin View'}
                            </span>
                        )}
                    </div>
                    <Link href={`/courses/${course.id}`}>
                        <h3 className="font-outfit font-bold text-lg leading-tight group-hover:text-hub-indigo transition-colors line-clamp-2 cursor-pointer">
                            {course.title}
                        </h3>
                    </Link>
                    {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Book className="w-3.5 h-3.5" />
                        <span>Course</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        <Users className="w-3.5 h-3.5" /> Students
                    </div>
                </div>

                {canManage ? (
                    <button
                        onClick={() => navRouter.push(`/courses/manage?id=${course.id}`)}
                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-hub-indigo/10 text-hub-indigo hover:bg-hub-indigo/20 border border-hub-indigo/20 active:scale-95"
                    >
                        <Settings className="w-4 h-4" />
                        {isInstructor ? 'Edit Curriculum' : 'Manage Course'}
                    </button>
                ) : (
                    <button
                        onClick={onEnroll}
                        disabled={isEnrolled || isEnrolling}
                        className={cn(
                            "w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            isEnrolled
                                ? "bg-hub-teal/10 text-hub-teal cursor-default"
                                : "bg-hub-indigo text-white hover:bg-hub-indigo/90 active:scale-95 shadow-lg shadow-hub-indigo/10"
                        )}
                    >
                        {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : isEnrolled ? "Joined" : "Enroll Now"}
                    </button>
                )}
            </div>
        </div>
    );
}
