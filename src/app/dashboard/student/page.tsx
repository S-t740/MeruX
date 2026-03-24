"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen, Award, Clock, CheckCircle2, PlayCircle, TrendingUp,
    Calendar, ArrowRight, Star, ClipboardCheck, Gamepad2, BrainCircuit, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SkillRadar } from "@/components/dashboard/SkillRadar";

export default function StudentDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [skillData, setSkillData] = useState<{ subject: string; A: number; fullMark: number }[]>([]);
    const [stats, setStats] = useState({ activeCourses: 0, completedCerts: 0, avgScore: "—" });
    const [loading, setLoading] = useState(true);

    // Map badge name → image path
    const BADGE_MAP: Record<string, { img: string; color: string; desc: string }> = {
        "Module Master": { img: "/badges/badge_module_master.png", color: "text-hub-indigo", desc: "Passed a module knowledge check" },
        "Course Completed": { img: "/badges/badge_course_completed.png", color: "text-hub-teal", desc: "Finished an entire course" },
        "Knowledge Champion": { img: "/badges/badge_knowledge_champion.png", color: "text-hub-rose", desc: "Top performer across quizzes" },
    };

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [enrollRes, certRes, progressRes, badgesRes, tokenRes, skillsRes] = await Promise.all([
                    supabase.from("course_enrollments").select("*, courses(*, modules(lessons(id)))").eq("user_id", user.id),
                    supabase.from("certifications").select("*").eq("user_id", user.id),
                    supabase.from("user_lesson_progress").select("course_id, lesson_id").eq("user_id", user.id),
                    supabase.from("badges").select("*").eq("user_id", user.id).order("awarded_at", { ascending: false }),
                    supabase.from("user_tokens").select("total_balance").eq("user_id", user.id).single(),
                    supabase.from("user_skills").select("level_score, skills(name, category)").eq("user_id", user.id)
                ]);
                setBadges(badgesRes.data || []);
                setTokenBalance(tokenRes.data?.total_balance || 0);

                // Format Skills for Radar Chart
                if (skillsRes.data) {
                    const formattedSkills = skillsRes.data.map((item: any) => {
                        const s = item.skills as any;
                        const subjectName = Array.isArray(s) ? s[0]?.name : s?.name;
                        return {
                            subject: subjectName || 'Unknown',
                            A: item.level_score || 0,
                            fullMark: 100
                        };
                    });
                    setSkillData(formattedSkills);
                }

                const enrollments = enrollRes.data || [];
                const progressData = progressRes.data || [];

                const coursesWithProgress = await Promise.all(enrollments.map(async (enrollment: any) => {
                    const course = enrollment.courses;
                    let totalLessons = 0;
                    if (course?.modules) {
                        course.modules.forEach((m: any) => {
                            if (m.lessons) totalLessons += m.lessons.length;
                        });
                    }
                    const completedLessonsCount = progressData.filter(p => p.course_id === course?.id).length;
                    const progressPercent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

                    // A course is effectively completed if all lessons done OR enrollment status is 'completed'
                    const isEffectivelyCompleted = progressPercent === 100 || enrollment.status === 'completed';

                    // Auto-sync the enrollment status in Supabase if lessons are all done but status wasn't updated
                    if (progressPercent === 100 && enrollment.status === 'active') {
                        supabase.from('course_enrollments')
                            .update({ status: 'completed', completed_at: new Date().toISOString() })
                            .eq('id', enrollment.id)
                            .then(() => { }); // fire-and-forget
                    }

                    return {
                        ...enrollment,
                        progressPercent: isEffectivelyCompleted ? 100 : progressPercent,
                        completedLessons: completedLessonsCount,
                        totalLessons,
                        status: isEffectivelyCompleted ? 'completed' : enrollment.status
                    };
                }));

                setCourses(coursesWithProgress);

                // Fetch upcoming deadlines from enrolled courses
                const courseIds = enrollments.map((e: any) => e.course_id).filter(Boolean);
                if (courseIds.length > 0) {
                    const { data: assignmentsData } = await supabase
                        .from("assignments")
                        .select("*, courses(title)")
                        .in("course_id", courseIds)
                        .gte("due_date", new Date().toISOString())
                        .order("due_date")
                        .limit(5);
                    setDeadlines(assignmentsData || []);
                }

                // Build grade summary (submissions table not in schema yet — placeholder)
                const subs: any[] = [];
                const gradedSubs = subs.filter((s: any) => s.grades && s.grades.length > 0);
                setGrades(gradedSubs);

                const avgScore = null; // Will be populated when assignment submissions table is added

                setStats({
                    activeCourses: enrollments.length,
                    completedCerts: certRes.data?.length || 0,
                    avgScore: avgScore ? `${avgScore}%` : "—"
                });
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [supabase]);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <Star className="w-4 h-4" /> Scholar Hub
                    </div>
                    <h1 className="page-title">My Learning Journey</h1>
                    <p className="page-description">Track your academic progress, access your learning materials, and view your institutional certifications.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/courses')}
                        className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20 active:scale-95 flex items-center gap-2">
                        Explore Catalog <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Courses", value: courses.filter(e => e.status !== 'completed').length, icon: BookOpen, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Completed Courses", value: courses.filter(e => e.status === 'completed').length, icon: Award, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Avg. Score", value: stats.avgScore, icon: TrendingUp, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-8 flex flex-col justify-between h-36 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <p className="text-3xl font-outfit font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Courses */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Skill DNA Visualization */}
                    <div className="premium-card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-hub-indigo" /> Skill DNA Profile
                            </h2>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-hub-indigo bg-hub-indigo/10 px-3 py-1 rounded-full">
                                AI Analyzed
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <SkillRadar data={skillData} />
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Top Identified Strengths</h3>
                                {skillData.length > 0 ? (
                                    <div className="space-y-3">
                                        {skillData.sort((a, b) => b.A - a.A).slice(0, 4).map((skill, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold font-outfit">
                                                    <span>{skill.subject}</span>
                                                    <span className="text-hub-indigo">{skill.A}/100</span>
                                                </div>
                                                <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
                                                    <div className="h-full bg-hub-indigo transition-all duration-1000" style={{ width: `${skill.A}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground border border-dashed border-border/50 p-4 rounded-xl bg-accent/10">Complete courses and assignments to start building your Skill DNA profile.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Project Incubator CTA */}
                    <div className="bg-gradient-to-r from-hub-indigo to-hub-purple p-8 rounded-2xl text-white relative overflow-hidden group">
                        <div className="relative z-10 space-y-4 max-w-lg">
                            <h2 className="text-2xl font-outfit font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-hub-teal" /> AI Project Incubator
                            </h2>
                            <p className="text-white/80 text-sm leading-relaxed">Ready to build your portfolio? Transform your Skill DNA into beautifully tailored, real-world project pitches designed perfectly and uniquely around your current learning milestones.</p>
                            <button
                                onClick={() => router.push('/dashboard/student/projects')}
                                className="px-6 py-2.5 bg-white text-hub-indigo rounded-xl font-bold flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"
                            >
                                Enter Incubator <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <BrainCircuit className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:text-white/10 transition-colors group-hover:rotate-12 duration-700" />
                    </div>

                    {/* Course Tracking List */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-hub-indigo" /> Continue Learning
                        </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.length > 0 ? (
                            courses.map((enrollment) => (
                                <div key={enrollment.id} className="premium-card p-0 flex flex-col group cursor-pointer hover:border-hub-indigo/30 transition-all overflow-hidden"
                                    onClick={() => router.push(`/courses/${enrollment.course_id}`)}>

                                    {/* Thumbnail Header */}
                                    <div className="h-32 bg-accent/50 relative overflow-hidden shrink-0">
                                        {enrollment.courses?.thumbnail_url ? (
                                            <img src={enrollment.courses.thumbnail_url} alt={enrollment.courses?.title || 'Course'} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 group-hover:scale-110 transition-transform duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white z-10">
                                            <p className="text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">
                                                {enrollment.status === 'completed' ? '✅ Finished' : 'In Progress'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-outfit font-bold group-hover:text-hub-indigo transition-colors line-clamp-2">{enrollment.courses?.title}</h3>
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                <span>Progress</span>
                                                <span className={enrollment.status === 'completed' ? 'text-hub-teal' : 'text-foreground'}>
                                                    {enrollment.status === 'completed' ? '100%' : `${enrollment.progressPercent}%`}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                                                <div
                                                    className={cn("h-full transition-all duration-500", enrollment.status === 'completed' ? 'bg-hub-teal' : 'bg-hub-indigo')}
                                                    style={{ width: enrollment.status === 'completed' ? '100%' : `${enrollment.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2 flex justify-end">
                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform",
                                                enrollment.status === 'completed' ? 'text-hub-teal' : 'text-hub-indigo')}>
                                                {enrollment.status === 'completed' ? 'Revisit Course' : 'Resume Lesson'}
                                                <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full premium-card p-12 text-center border-dashed bg-accent/10 border-border flex flex-col items-center justify-center space-y-4">
                                <BookOpen className="w-10 h-10 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">No active enrollments</p>
                                <button onClick={() => router.push('/courses')} className="text-hub-indigo text-xs font-bold hover:underline">Browse the Course Catalog</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Upcoming Deadlines */}
                    {grades.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-hub-teal" /> Recent Grades
                            </h2>
                            <div className="space-y-3">
                                {grades.slice(0, 5).map((s: any) => (
                                    <div key={s.id} className="premium-card p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold font-outfit">{s.assignments?.title}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{s.assignments?.courses?.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-lg font-outfit font-bold",
                                                (s.grades[0]?.score / (s.assignments?.max_score || 100)) >= 0.7 ? "text-hub-teal" : "text-hub-rose"
                                            )}>
                                                {s.grades[0]?.score}/{s.assignments?.max_score || 100}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Upcoming Deadlines (now real data) */}
                <div className="space-y-8">
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-hub-rose" /> Next Deadlines
                        </h2>
                        <div className="space-y-4">
                            {deadlines.length > 0 ? deadlines.map((a, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 hover:bg-accent/30 rounded-2xl transition-all cursor-pointer group"
                                    onClick={() => router.push(`/courses/${a.course_id}`)}>
                                    <div className="w-10 h-10 rounded-xl bg-hub-rose/10 border border-hub-rose/20 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-hub-rose" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold font-outfit group-hover:text-hub-rose transition-colors">{a.title}</p>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                            {a.courses?.title} • Due {new Date(a.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">No upcoming deadlines 🎉</p>
                            )}
                        </div>
                    </div>

                    {/* Badges & Tokens */}
                    <div className="premium-card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Award className="w-5 h-5 text-hub-amber" /> My Badges
                            </h2>
                            {tokenBalance > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-hub-amber/10 border border-hub-amber/20">
                                    <Gamepad2 className="w-3.5 h-3.5 text-hub-amber" />
                                    <span className="text-[11px] font-bold text-hub-amber">{tokenBalance} Tokens</span>
                                </div>
                            )}
                        </div>

                        {badges.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {badges.map((badge: any) => {
                                    const meta = BADGE_MAP[badge.name] || { img: null, color: "text-muted-foreground", desc: badge.description || "" };
                                    return (
                                        <div key={badge.id} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-accent/20 border border-border/50 hover:bg-accent/40 transition-all group" title={meta.desc}>
                                            {meta.img ? (
                                                <img
                                                    src={meta.img}
                                                    alt={badge.name}
                                                    className="w-16 h-16 object-contain drop-shadow-xl group-hover:scale-110 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                                                    <Award className="w-8 h-8 text-hub-teal" />
                                                </div>
                                            )}
                                            <p className={`text-[9px] font-bold text-center uppercase tracking-widest ${meta.color}`}>{badge.name}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-6 text-center">
                                <div className="relative opacity-30">
                                    <img src="/badges/badge_course_completed.png" alt="" className="w-14 h-14 grayscale" />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No badges yet</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">Complete lessons and pass quizzes to earn your first badge!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

