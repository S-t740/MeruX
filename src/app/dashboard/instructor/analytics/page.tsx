"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
    BarChart2, TrendingUp, Users, CheckCircle2,
    AlertTriangle, BookOpen, Award, Activity
} from "lucide-react";

interface ModuleStat { title: string; total: number; passed: number; failed: number; avg: number; }
interface CourseStat { quiz_average: number; skills_score: number; final_exam_score: number; overall_score: number; status: string; }

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
    return (
        <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
        </div>
    );
}

export default function InstructorAnalyticsPage() {
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [results, setResults] = useState<CourseStat[]>([]);
    const [quizStats, setQuizStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: coursesData } = await supabase.from("courses").select("id, title").eq("instructor_id", user.id);
            setCourses(coursesData || []);
            if (coursesData?.[0]) setSelectedCourse(coursesData[0].id);
            setLoading(false);
        };
        load();
    }, [supabase]);

    useEffect(() => {
        if (!selectedCourse) return;
        const loadStats = async () => {
            const [resData, attemptsData] = await Promise.all([
                supabase.from("course_results").select("*").eq("course_id", selectedCourse),
                supabase.from("quiz_attempts")
                    .select("score, status, quizzes!inner(title, type, course_id, passing_score)")
                    .eq("quizzes.course_id", selectedCourse)
                    .eq("status", "graded"),
            ]);

            setResults(resData.data || []);

            // Aggregate per quiz title
            const byQuiz: Record<string, { title: string; scores: number[]; passing: number }> = {};
            for (const a of attemptsData.data || []) {
                const quiz = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
                if (!quiz) continue;
                const t = quiz.title;
                if (!byQuiz[t]) byQuiz[t] = { title: t, scores: [], passing: quiz.passing_score };
                byQuiz[t].scores.push(a.score);
            }

            setQuizStats(Object.values(byQuiz));
        };
        loadStats();
    }, [selectedCourse, supabase]);

    const total = results.length;
    const passed = results.filter(r => r.status === "pass").length;
    const failed = results.filter(r => r.status === "fail").length;
    const inProgress = results.filter(r => r.status === "in_progress").length;
    const avgOverall = total ? +(results.reduce((s, r) => s + (r.overall_score || 0), 0) / total).toFixed(1) : 0;
    const avgFinal = total ? +(results.reduce((s, r) => s + (r.final_exam_score || 0), 0) / total).toFixed(1) : 0;
    const avgSkills = total ? +(results.reduce((s, r) => s + (r.skills_score || 0), 0) / total).toFixed(1) : 0;

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading…</div>;

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
                        <BarChart2 className="w-7 h-7 text-hub-indigo" /> Course Analytics
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Performance insights across assessments and students.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {courses.map(c => (
                        <button key={c.id} onClick={() => setSelectedCourse(c.id)}
                            className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all border",
                                selectedCourse === c.id ? "bg-hub-indigo text-white border-hub-indigo" : "border-border/50 text-muted-foreground hover:bg-accent")}>
                            {c.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Students", value: total, icon: Users, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Passed", value: passed, icon: CheckCircle2, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Failed", value: failed, icon: AlertTriangle, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                    { label: "In Progress", value: inProgress, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="premium-card p-6 space-y-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
                            <Icon className={cn("w-5 h-5", color)} />
                        </div>
                        <div>
                            <p className="text-3xl font-outfit font-bold">{value}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pass Rate Banner */}
            {total > 0 && (
                <div className="premium-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-outfit font-bold">Overall Pass Rate</h2>
                        <span className="font-outfit font-bold text-2xl text-hub-teal">{Math.round((passed / total) * 100)}%</span>
                    </div>
                    <div className="h-4 w-full bg-accent rounded-full overflow-hidden relative">
                        {/* stacked bar */}
                        <div className="h-full flex rounded-full overflow-hidden">
                            <div className="bg-hub-teal transition-all duration-700" style={{ width: `${(passed / total) * 100}%` }} />
                            <div className="bg-hub-rose/70 transition-all duration-700" style={{ width: `${(failed / total) * 100}%` }} />
                            <div className="bg-amber-400/50 transition-all duration-700" style={{ width: `${(inProgress / total) * 100}%` }} />
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs font-medium flex-wrap">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-hub-teal" /> Passed ({passed})</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-hub-rose/70" /> Failed ({failed})</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400/50" /> In Progress ({inProgress})</span>
                    </div>
                </div>
            )}

            {/* Score Averages */}
            <div className="grid md:grid-cols-3 gap-4">
                {[
                    { label: "Avg Quiz Score", value: avgOverall, color: "#6d5dfc" },
                    { label: "Avg Skills Score", value: avgSkills, color: "#00c4a7" },
                    { label: "Avg Final Exam", value: avgFinal, color: "#f59e0b" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="premium-card p-6 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-4xl font-outfit font-bold" style={{ color }}>{value}%</p>
                        <MiniBar value={value} color={color} />
                    </div>
                ))}
            </div>

            {/* Per-Quiz Breakdown */}
            {quizStats.length > 0 && (
                <div className="premium-card p-6 space-y-4">
                    <h2 className="font-outfit font-bold text-lg">Quiz Performance Breakdown</h2>
                    <div className="space-y-4">
                        {quizStats.map(q => {
                            const avg = q.scores.length ? Math.round(q.scores.reduce((a: number, b: number) => a + b, 0) / q.scores.length) : 0;
                            const pr = q.scores.length ? Math.round((q.scores.filter((s: number) => s >= q.passing).length / q.scores.length) * 100) : 0;
                            return (
                                <div key={q.title} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span className="font-bold">{q.title}</span>
                                        <span className="text-muted-foreground">{q.scores.length} attempts · Avg: <strong className="text-foreground">{avg}%</strong> · Pass rate: <strong className={pr >= 60 ? "text-hub-teal" : "text-hub-rose"}>{pr}%</strong></span>
                                    </div>
                                    <div className="h-3 w-full bg-accent rounded-full overflow-hidden flex">
                                        <div className="bg-hub-teal/70 transition-all" style={{ width: `${pr}%` }} />
                                        <div className="bg-hub-rose/40 transition-all" style={{ width: `${100 - pr}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {total === 0 && (
                <div className="premium-card p-10 text-center space-y-3">
                    <BarChart2 className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-muted-foreground font-medium">No student results yet for this course.</p>
                </div>
            )}
        </div>
    );
}
