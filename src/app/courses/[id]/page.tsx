"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    BookOpen,
    PlayCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    Clock,
    Users,
    ArrowLeft,
    CheckCircle2,
    Lock,
    Award,
    Settings
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

export default function CourseDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuth();
    const [course, setCourse] = useState<any>(null);
    const [instructor, setInstructor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [hasActiveEnrollment, setHasActiveEnrollment] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [enrolledCount, setEnrolledCount] = useState(0);
    const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data: courseData, error: courseError } = await supabase
                    .from("courses")
                    .select("*, modules(*, quizzes(*), lessons(*)), assignments(*)")
                    .eq("id", id)
                    .single();

                if (courseError) throw courseError;

                let authorized = false;
                let activeEnrollment = false;

                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (currentUser) {
                    if (currentUser.id === courseData.instructor_id) {
                        authorized = true;
                    } else {
                        // Check admin
                        const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single();
                        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                            authorized = true;
                        }

                        // Check enrollment
                        const { data: enrollment } = await supabase
                            .from("course_enrollments")
                            .select("*")
                            .eq("course_id", id)
                            .eq("user_id", currentUser.id)
                            .in("status", ["active", "completed"])
                            .maybeSingle();

                        if (enrollment) {
                            authorized = true;
                            activeEnrollment = true;
                        }
                    }
                }

                setHasActiveEnrollment(activeEnrollment);
                setIsAuthorized(authorized);

                // Fetch total enrolled count
                const { count: enrollCount } = await supabase
                    .from("course_enrollments")
                    .select("*", { count: 'exact', head: true })
                    .eq("course_id", id);
                setEnrolledCount(enrollCount || 0);

                if (currentUser) {
                    const { data: progressData } = await supabase
                        .from("user_lesson_progress")
                        .select("lesson_id")
                        .eq("course_id", id)
                        .eq("user_id", currentUser.id);

                    const { data: qData } = await supabase
                        .from("quiz_attempts")
                        .select("quiz_id, score, quizzes!inner(passing_score)")
                        .eq("student_id", currentUser.id)
                        .eq("status", "graded");
                    
                    if (qData) {
                        setCompletedQuizzes(qData.filter((q: any) => q.score >= q.quizzes.passing_score).map((q: any) => q.quiz_id));
                    }

                    let totalLessons = 0;
                    if (courseData.modules) {
                        courseData.modules.forEach((m: any) => {
                            if (m.lessons) totalLessons += m.lessons.length;
                        });
                    }

                    const completedLessonsCount = progressData?.length || 0;
                    const calculatedProgress = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

                    const { data: enrollmentData } = await supabase
                        .from("course_enrollments")
                        .select("status")
                        .eq("course_id", id)
                        .eq("user_id", currentUser.id)
                        .maybeSingle();

                    setProgress(enrollmentData?.status === 'completed' || calculatedProgress === 100 ? 100 : calculatedProgress);
                }

                // Sort modules and lessons
                if (courseData.modules) {
                    courseData.modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    courseData.modules.forEach((m: any) => {
                        if (m.lessons) m.lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                    });
                }

                setCourse(courseData);
                if (courseData.instructor_id) {
                    const { data: instrData } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, job_title').eq('id', courseData.instructor_id).single();
                    setInstructor(instrData || null);
                }
                if (courseData.modules?.length > 0) {
                    setExpandedModules([courseData.modules[0].id]);
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourse();

            const channel = supabase.channel('course_updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'modules', filter: `course_id=eq.${id}` }, () => {
                    fetchCourse();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
                    fetchCourse();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id, supabase]);

    const handleEnroll = async () => {
        if (!user) {
            alert("Please log in to enroll.");
            return;
        }
        setEnrolling(true);
        try {
            const { error } = await supabase.from("course_enrollments").insert({
                user_id: user.id,
                course_id: id as string,
                status: 'active'
            });
            if (error) throw error;
            setIsAuthorized(true);
            setHasActiveEnrollment(true);
            alert("Successfully enrolled in the course!");
        } catch (error) {
            console.error("Enrollment failed:", error);
            alert("Enrollment failed. Please try again.");
        } finally {
            setEnrolling(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(m => m !== moduleId)
                : [...prev, moduleId]
        );
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground font-medium">Loading syllabus...</div>;
    }

    if (!course) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">Course not found.</p>
                <button onClick={() => router.back()} className="text-hub-indigo font-bold hover:underline">Go back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/courses')}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-hub-indigo transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Catalog
                </button>
                {user?.id === course.instructor_id && (
                    <button
                        onClick={() => router.push(`/courses/manage?id=${id}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-hub-indigo text-white rounded-xl font-bold text-sm hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20 active:scale-95"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Course
                    </button>
                )}
            </div>

            <div className="relative overflow-hidden rounded-3xl premium-card p-0">
                <div className="h-48 bg-hub-indigo/10 relative">
                    {course.thumbnail_url ? (
                        <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-50"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-hub-indigo/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="p-8 -mt-12 relative z-10 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-hub-teal/10 text-hub-teal border border-hub-teal/20">
                                {course.status}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {enrolledCount} {enrolledCount === 1 ? "Enrolled" : "Enrolled"}
                            </span>
                        </div>
                        <h1 className="text-4xl font-outfit font-bold tracking-tight">{course.title}</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">{course.description}</p>
                    </div>

                    <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-hub-indigo">
                            {instructor?.avatar_url ? (
                                <img src={instructor.avatar_url} alt={instructor.first_name} className="w-full h-full rounded-full" />
                            ) : (
                                (instructor?.first_name?.charAt(0) || "I")
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Instructor</p>
                            <p className="text-sm font-bold font-outfit">{instructor?.first_name ? `${instructor.first_name} ${instructor.last_name || ''}`.trim() : "Nexus Instructor"}</p>
                            {instructor?.job_title && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{instructor.job_title}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-outfit font-bold">Course Content</h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            {course.modules?.length || 0} Modules • {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} Lessons
                        </p>
                    </div>

                    <div className="space-y-4">                        {course.modules?.map((module: any, idx: number) => {
                            const prevModule = idx > 0 ? course.modules[idx - 1] : null;
                            const isModuleLocked = hasActiveEnrollment && prevModule?.quizzes?.[0] && !completedQuizzes.includes(prevModule.quizzes[0].id);
                            
                            return (
                            <div key={module.id} className={cn("premium-card overflow-hidden p-0 transition-opacity", isModuleLocked && "opacity-60")}>
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-accent/30 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm", isModuleLocked ? "bg-accent text-muted-foreground" : "bg-hub-indigo/10 text-hub-indigo")}>
                                            {isModuleLocked ? <Lock className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors flex items-center gap-2">
                                                {module.title}
                                                {isModuleLocked && <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest font-bold">Locked</span>}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-medium">{module.lessons?.length || 0} Lessons</p>
                                        </div>
                                    </div>
                                    {expandedModules.includes(module.id) ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>

                                {expandedModules.includes(module.id) && (
                                    <div className="border-t border-border/50 divide-y divide-border/30 bg-accent/10">
                                        {module.lessons?.map((lesson: any) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    if (isModuleLocked) {
                                                        alert("Complete the previous module's Knowledge Check to unlock this module.");
                                                        return;
                                                    }
                                                    if (isAuthorized) {
                                                        router.push(`/courses/${id}/lessons/${lesson.id}`);
                                                    } else {
                                                        alert("Please enroll in the course to access lessons.");
                                                    }
                                                }}
                                                className={cn("w-full flex items-center justify-between p-5 transition-all text-left pl-14 group",
                                                    (isAuthorized && !isModuleLocked) ? "hover:bg-accent/50 cursor-pointer" : "opacity-75 cursor-not-allowed hover:bg-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {!isAuthorized || isModuleLocked ? (
                                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                                    ) : lesson.video_url ? (
                                                        <PlayCircle className="w-4 h-4 text-hub-rose" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-hub-teal" />
                                                    )}
                                                    <span className={cn("text-sm font-medium transition-colors", isAuthorized && !isModuleLocked && "group-hover:text-hub-indigo")}>
                                                        {lesson.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground font-medium">--</span>
                                                    {isAuthorized && (
                                                        <div className="p-1 rounded-full bg-accent text-muted-foreground border border-border/50">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {module.quizzes?.[0] && (
                                            <button
                                                onClick={() => {
                                                    if (isModuleLocked) {
                                                        alert("Complete the previous module's Knowledge Check to unlock this module.");
                                                        return;
                                                    }
                                                    if (isAuthorized) {
                                                        router.push(`/courses/${id}/lessons/quiz?quizId=${module.quizzes[0].id}`);
                                                    } else {
                                                        alert("Please enroll in the course to take the quiz.");
                                                    }
                                                }}
                                                className={cn("w-full flex items-center justify-between p-5 transition-all text-left pl-14 group border-t border-border/50",
                                                    (isAuthorized && !isModuleLocked) ? "hover:bg-hub-rose/5 cursor-pointer" : "opacity-75 cursor-not-allowed hover:bg-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {!isAuthorized || isModuleLocked ? (
                                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-sm bg-hub-rose/20 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 bg-hub-rose rounded-full" />
                                                        </div>
                                                    )}
                                                    <span className={cn("text-sm font-bold transition-colors", isAuthorized && !isModuleLocked && "group-hover:text-hub-rose")}>
                                                        Knowledge Check
                                                    </span>
                                                </div>
                                                {completedQuizzes.includes(module.quizzes[0].id) && (
                                                    <CheckCircle2 className="w-4 h-4 text-hub-rose" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="premium-card p-8 space-y-6 sticky top-24">
                        <div className="space-y-4">
                            <h3 className="text-xl font-outfit font-bold">Your Progress</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold font-outfit uppercase tracking-widest">
                                    <span className="text-muted-foreground">Completion</span>
                                    <span className="text-hub-indigo">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                                    <div className="h-full bg-hub-indigo transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            {!isAuthorized ? (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 active:scale-95 disabled:opacity-50"
                                >
                                    {enrolling ? "Enrolling..." : "Enroll Now"}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => {
                                        if (course.modules?.[0]?.lessons?.[0]) {
                                            router.push(`/courses/${id}/lessons/${course.modules[0].lessons[0].id}`);
                                        }
                                    }} className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 active:scale-95">
                                        {progress === 100 ? "Revisit Course" : "Continue Lesson"}
                                    </button>
                                    <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                                        {progress === 100 ? "Review Material" : "Jump back in"}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-border/50">
                            {[
                                { icon: Clock, label: "Certificate included" },
                                { icon: Award, label: "Accredited program" },
                                { icon: Lock, label: "Lifetime access" },
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                    <feature.icon className="w-4 h-4 text-hub-teal" />
                                    {feature.label}
                                </div>
                            ))}
                        </div>

                        {/* Assignments Section in Sidebar */}
                        {isAuthorized && (
                            <div className="pt-6 border-t border-border/50 space-y-4">
                                <h3 className="text-sm font-bold font-outfit uppercase tracking-widest text-hub-indigo">Required Tasks</h3>
                                <div className="space-y-3">
                                    {course.assignments?.length > 0 ? course.assignments.map((a: any) => (
                                        <button
                                            key={a.id}
                                            onClick={() => router.push(`/courses/${id}/assignments/${a.id}`)}
                                            className="w-full text-left p-3 rounded-xl bg-accent/30 border border-border/50 hover:bg-accent/50 transition-all group"
                                        >
                                            <p className="text-xs font-bold group-hover:text-hub-indigo transition-colors">{a.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                                        </button>
                                    )) : (
                                        <p className="text-xs text-muted-foreground italic">No assignments yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
