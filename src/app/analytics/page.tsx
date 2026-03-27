"use client"

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Award, Clock, Activity, PieChart, ChevronUp, Zap, CheckCircle2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AnalyticsPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState<"week" | "month">("week");
    const [activity, setActivity] = useState({ weekBars: [] as number[], monthBars: [] as number[] });
    const [skills, setSkills] = useState<{ skill: string; level: number; color: string }[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [enrollRes, certRes, profileRes, progressRes, skillRes] = await Promise.all([
                    supabase.from("course_enrollments").select("*, courses(title)").eq("user_id", user.id),
                    supabase.from("certifications").select("*").eq("user_id", user.id),
                    supabase.from("profiles").select("*").eq("id", user.id).single(),
                    supabase.from("user_lesson_progress").select("created_at").eq("user_id", user.id),
                    supabase.from("user_skills").select("level_score, skills(name)").eq("user_id", user.id),
                ]);

                const enrollments = enrollRes.data || [];
                const certs = certRes.data || [];

                setStats({
                    totalEnrollments: enrollments.length,
                    completedCerts: certs.length,
                    activeCourses: enrollments.filter(e => e.status === "active").length,
                    profile: profileRes.data,
                    courses: enrollments.map(e => e.courses?.title).filter(Boolean),
                });

                const progressRows = progressRes.data || [];
                const buildBars = (days: number) => {
                    const now = new Date();
                    const dayKeys = Array.from({ length: days }, (_, index) => {
                        const date = new Date(now);
                        date.setDate(now.getDate() - (days - 1 - index));
                        return date.toISOString().slice(0, 10);
                    });

                    const counts = dayKeys.map((key) =>
                        progressRows.filter((row: any) => (row.created_at || "").slice(0, 10) === key).length
                    );
                    const max = Math.max(...counts, 1);
                    return counts.map((count) => Math.max(8, Math.round((count / max) * 100)));
                };

                setActivity({
                    weekBars: buildBars(7),
                    monthBars: buildBars(14),
                });

                const palette = ["bg-hub-indigo", "bg-hub-teal", "bg-hub-amber", "bg-hub-rose", "bg-hub-purple"];
                const mappedSkills = (skillRes.data || [])
                    .map((item: any, index: number) => ({
                        skill: item.skills?.name || `Skill ${index + 1}`,
                        level: Math.max(0, Math.min(100, item.level_score || 0)),
                        color: palette[index % palette.length],
                    }))
                    .sort((a: any, b: any) => b.level - a.level)
                    .slice(0, 6);

                setSkills(mappedSkills);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [supabase]);

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Processing data clusters...</div>;
    }

    // Dynamic bar heights based on week or month
    const bars = chartPeriod === "week" ? activity.weekBars : activity.monthBars;

    const statCards = [
        { label: "Enrolled Courses", value: stats?.totalEnrollments ?? 0, icon: BookOpen, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
        { label: "Completion Rate", value: stats?.totalEnrollments > 0 ? `${Math.round((stats.completedCerts / stats.totalEnrollments) * 100)}%` : "0%", icon: CheckCircle2, color: "text-hub-teal", bg: "bg-hub-teal/10" },
        { label: "Certifications", value: stats?.completedCerts ?? 0, icon: Award, color: "text-hub-amber", bg: "bg-hub-amber/10" },
        { label: "Active Courses", value: stats?.activeCourses ?? 0, icon: Activity, color: "text-hub-rose", bg: "bg-hub-rose/10" },
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="page-header">
                <h1 className="page-title">Insight & Analytics</h1>
                <p className="page-description">Deep-dive into your learning trajectory, engagement metrics, and skill-level distribution.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="premium-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className={cn("p-2 rounded-xl border border-white/5", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <span className="text-[10px] font-bold text-hub-teal flex items-center gap-1">
                                <ChevronUp className="w-3 h-3" /> Live
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-outfit font-bold">{stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Bar Chart */}
                    <div className="premium-card p-8 h-72 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-hub-indigo" /> Growth Trajectory
                            </h2>
                            <div className="flex bg-accent/30 rounded-lg p-1">
                                {(["week", "month"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setChartPeriod(p)}
                                        className={cn(
                                            "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded transition-all capitalize",
                                            chartPeriod === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex items-end justify-between gap-2 pb-4">
                            {bars.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div
                                        className="w-full bg-hub-indigo/20 rounded-t-lg group-hover:bg-hub-indigo transition-all relative cursor-pointer"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-hub-indigo text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {h}%
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">
                                        {chartPeriod === "week" ? ["M", "T", "W", "T", "F", "S", "S"][i] : i + 1}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skill Proficiency */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-hub-rose" /> Skill Proficiency
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skills.length > 0 ? skills.map((s, i) => (
                                <div key={i} className="premium-card p-5 space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-muted-foreground">{s.skill}</span>
                                        <span className="text-foreground">{s.level}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                                        <div className={cn("h-full transition-all duration-1000", s.color)} style={{ width: `${s.level}%` }} />
                                    </div>
                                </div>
                            )) : (
                                <div className="md:col-span-2 premium-card p-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    No skill analytics available yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    {/* Time Allocation */}
                    <div className="premium-card p-6 space-y-5">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-hub-teal" /> My Courses
                        </h2>
                        <div className="space-y-3">
                            {stats?.courses && stats.courses.length > 0 ? (
                                stats.courses.slice(0, 5).map((course: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-hub-indigo shrink-0" />
                                        <span className="text-xs font-medium flex-1 truncate">{course}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No courses enrolled yet.</p>
                            )}
                        </div>
                        <Link href="/courses">
                            <button className="w-full py-3 bg-hub-indigo text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20">
                                Browse Courses
                            </button>
                        </Link>
                    </div>

                    {/* Recommendation */}
                    <div className="premium-card p-6 bg-hub-indigo/5 border-hub-indigo/20 space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-hub-indigo" />
                            <h3 className="font-outfit font-bold text-sm">Nexus Recommendation</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            Based on your engagement, we recommend exploring the <span className="text-foreground font-bold">Research Hub</span> to unlock the{" "}
                            <span className="text-hub-indigo font-bold uppercase tracking-widest text-[10px]">Senior Investigator</span> badge.
                        </p>
                        <Link href="/research">
                            <button className="w-full py-3 bg-hub-indigo text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20">
                                Explore Research Hub
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
