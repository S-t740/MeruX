"use client"

import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    TrendingUp,
    Plus,
    Search,
    Filter,
    Calendar,
    ArrowUpRight,
    Loader2,
    X,
    CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        activeStudents: 0,
        publishedCourses: 0,
        activeCohorts: 0,
        completionRate: "0%"
    });
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCohortModal, setShowCohortModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cohortForm, setCohortForm] = useState({
        name: "",
        start_date: "",
        end_date: "",
        description: ""
    });

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes, cohortsRes, membersRes, enrollmentsRes] = await Promise.all([
                supabase.from("profiles").select("id", { count: 'exact', head: true }).eq("role", "student"),
                supabase.from("courses").select("id", { count: 'exact', head: true }).eq("status", "published"),
                supabase.from("cohorts").select("*").order("created_at", { ascending: false }).limit(4),
                supabase.from("cohort_members").select("cohort_id, user_id"),
                supabase.from("course_enrollments").select("course_id, user_id, status"),
            ]);

            const membersByCohort = (membersRes.data || []).reduce((acc: any, row) => {
                acc[row.cohort_id] = (acc[row.cohort_id] || 0) + 1;
                return acc;
            }, {});

            const enrollments = enrollmentsRes.data || [];
            const completionRate = enrollments.length > 0
                ? `${Math.round((enrollments.filter((item: any) => item.status === "completed").length / enrollments.length) * 100)}%`
                : "0%";

            setStats({
                activeStudents: studentsRes.count || 0,
                publishedCourses: coursesRes.count || 0,
                activeCohorts: (cohortsRes.data || []).filter((cohort: any) => !cohort.end_date || new Date(cohort.end_date) >= new Date()).length,
                completionRate,
            });

            const enrichedCohorts = (cohortsRes.data || []).map(c => {
                const cohortMembers = (membersRes.data || []).filter((member: any) => member.cohort_id === c.id).map((member: any) => member.user_id);
                const relevantEnrollments = enrollments.filter((en: any) => cohortMembers.includes(en.user_id) && (!c.course_id || en.course_id === c.course_id));
                const cohortProgress = relevantEnrollments.length > 0
                    ? Math.round((relevantEnrollments.filter((en: any) => en.status === "completed").length / relevantEnrollments.length) * 100)
                    : 0;

                return {
                    ...c,
                    students: membersByCohort[c.id] || 0,
                    progress: cohortProgress,
                    status: c.end_date && new Date(c.end_date) < new Date() ? "Closed" : "Active"
                };
            });

            setCohorts(enrichedCohorts);
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData() }, [supabase]);

    const handleCreateCohort = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from("cohorts").insert({
                name: cohortForm.name,
                description: cohortForm.description,
                start_date: cohortForm.start_date || null,
                end_date: cohortForm.end_date || null
            });
            if (error) throw error;
            setShowCohortModal(false);
            setCohortForm({ name: "", start_date: "", end_date: "", description: "" });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to create cohort.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase text-xs tracking-widest">Loading metrics...</div>;

    return (
        <div className="space-y-12 pb-20">
            {showCohortModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold">New Cohort</h2>
                            <button onClick={() => setShowCohortModal(false)} className="p-2 hover:bg-accent rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCohort} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Cohort Name *</label>
                                <input
                                    required
                                    value={cohortForm.name}
                                    onChange={e => setCohortForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Fall 2026 Innovators"
                                    className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={cohortForm.start_date}
                                        onChange={e => setCohortForm(p => ({ ...p, start_date: e.target.value }))}
                                        className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-[10px] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={cohortForm.end_date}
                                        onChange={e => setCohortForm(p => ({ ...p, end_date: e.target.value }))}
                                        className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-[10px] transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={cohortForm.description}
                                    onChange={e => setCohortForm(p => ({ ...p, description: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm resize-none transition-all"
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 bg-hub-indigo text-white rounded-xl font-bold text-sm hover:bg-hub-indigo/90 transition-all flex items-center justify-center gap-2 mt-4">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {submitting ? "Creating..." : "Create Cohort"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Operational Center
                    </div>
                    <h1 className="page-title">Institutional Overview</h1>
                    <p className="page-description">Manage academic programs, oversee cohort progression, and monitor enrollment metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowCohortModal(true)} className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Cohort
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Students", value: stats.activeStudents, icon: Users, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Published Courses", value: stats.publishedCourses, icon: BookOpen, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Live Cohorts", value: stats.activeCohorts, icon: Calendar, color: "text-hub-amber", bg: "bg-hub-amber/10" },
                    { label: "Completion Hub", value: stats.completionRate, icon: TrendingUp, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-6 flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-2xl font-outfit font-bold">{stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cohort Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-hub-indigo" />
                            Live Cohorts
                        </h2>
                        <button className="text-xs font-bold text-hub-indigo hover:underline">View All Programs</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cohorts.length > 0 ? cohorts.map((cohort, i) => (
                            <div key={cohort.id} className="premium-card p-6 space-y-4 group hover:border-hub-indigo/30 transition-all cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{cohort.name}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{cohort.students} Students • {cohort.status}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-muted-foreground">Progression</span>
                                        <span className="text-foreground">{cohort.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                                        <div className="h-full bg-hub-indigo" style={{ width: `${cohort.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full premium-card p-12 text-center text-muted-foreground">No cohorts found. Create one to get started.</div>
                        )}
                    </div>
                </div>

                {/* System Reports */}
                <div className="space-y-8">
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-hub-rose" />
                            Report Engine
                        </h2>
                        <div className="space-y-4">
                            {[
                                { title: "Monthly Growth", format: "PDF", size: "2.4MB" },
                                { title: "Research Output", format: "CSV", size: "1.1MB" },
                                { title: "Instructor Performance", format: "Excel", size: "450KB" },
                            ].map((report, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-border/30 hover:bg-accent/40 transition-all cursor-pointer group">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold font-outfit group-hover:text-hub-rose transition-colors">{report.title}</p>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{report.format} • {report.size}</p>
                                    </div>
                                    <button className="p-2 bg-background border border-border/50 rounded-lg text-hub-rose hover:bg-hub-rose hover:text-white transition-all">
                                        <TrendingUp className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 bg-accent text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/80 transition-all border border-border/50 flex items-center justify-center gap-2">
                            Generate Custom Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
