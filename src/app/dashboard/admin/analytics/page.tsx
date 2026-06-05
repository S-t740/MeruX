"use client"

import { useState } from "react";
import {
    TrendingUp, Users, Video, Award, BarChart3, Activity, BookOpen,
    Sparkles, GraduationCap, Clock, ArrowUp, ArrowDown, Minus,
    CalendarDays, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const engagementData = [
    { date: "May 6",  active_learners: 84,  sessions_held: 4,  completions: 12, ai_queries: 230 },
    { date: "May 13", active_learners: 97,  sessions_held: 6,  completions: 18, ai_queries: 310 },
    { date: "May 20", active_learners: 112, sessions_held: 8,  completions: 25, ai_queries: 420 },
    { date: "May 27", active_learners: 108, sessions_held: 7,  completions: 22, ai_queries: 380 },
    { date: "Jun 2",  active_learners: 131, sessions_held: 10, completions: 32, ai_queries: 510 },
    { date: "Jun 5",  active_learners: 145, sessions_held: 12, completions: 38, ai_queries: 580 },
];

const attendanceData = [
    { week: "Week 1", attended: 142, absent: 18, late: 8  },
    { week: "Week 2", attended: 156, absent: 12, late: 5  },
    { week: "Week 3", attended: 148, absent: 20, late: 10 },
    { week: "Week 4", attended: 163, absent: 9,  late: 4  },
    { week: "Week 5", attended: 171, absent: 7,  late: 3  },
];

const coursePerformance = [
    { course: "Full Stack Eng.", enrolled: 65, completed: 38, avg_score: 82 },
    { course: "AI & ML",         enrolled: 48, completed: 31, avg_score: 79 },
    { course: "Data Science",    enrolled: 39, completed: 28, avg_score: 85 },
    { course: "UX Design",       enrolled: 27, completed: 19, avg_score: 88 },
];

const tutorLeaderboard = [
    { name: "Dr. Kemi Adeyemi",  learners: 32, sessions: 28, completion_rate: 91, avg_progress: 76 },
    { name: "Prof. James Osei",  learners: 24, sessions: 22, completion_rate: 87, avg_progress: 71 },
    { name: "Tutor Sarah Mbeki", learners: 18, sessions: 16, completion_rate: 83, avg_progress: 68 },
    { name: "Dr. Akin Bello",    learners: 15, sessions: 14, completion_rate: 79, avg_progress: 65 },
];

const assessmentDist = [
    { range: "90–100%", count: 28, fill: "#4f46e5" },
    { range: "80–89%",  count: 45, fill: "#0d9488" },
    { range: "70–79%",  count: 37, fill: "#9333ea" },
    { range: "60–69%",  count: 22, fill: "#d97706" },
    { range: "<60%",    count: 12, fill: "#e11d48" },
];

const kpis = [
    { label: "Total Learners",      value: "312",  change: +14,   icon: Users,       color: "text-hub-indigo", bg: "bg-hub-indigo/10"  },
    { label: "Active Sessions",     value: "12",   change: +3,    icon: Video,       color: "text-hub-rose",   bg: "bg-hub-rose/10"    },
    { label: "Avg. Completion",     value: "76%",  change: +5,    icon: TrendingUp,  color: "text-hub-teal",   bg: "bg-hub-teal/10"    },
    { label: "Certifications",      value: "89",   change: +21,   icon: Award,       color: "text-hub-amber",  bg: "bg-hub-amber/10"   },
    { label: "AI Queries / Week",   value: "580",  change: +13.7, icon: Sparkles,    color: "text-hub-purple", bg: "bg-hub-purple/10"  },
    { label: "Avg. Attendance",     value: "88%",  change: +2,    icon: CalendarDays,color: "text-hub-teal",   bg: "bg-hub-teal/10"    },
];

const PIE_COLORS = ["#4f46e5", "#0d9488", "#9333ea", "#d97706", "#e11d48"];

type Range = '7d' | '30d' | '90d';

export default function ExecutiveAnalytics() {
    const [range, setRange] = useState<Range>('30d');

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <BarChart3 className="w-4 h-4" /> Institution
                    </div>
                    <h1 className="page-title">Executive Analytics</h1>
                    <p className="page-description">Comprehensive institutional performance intelligence. Understand engagement, outcomes, and opportunities.</p>
                </div>
                <div className="flex gap-1 p-1 bg-accent/30 rounded-xl border border-border/50">
                    {(['7d', '30d', '90d'] as Range[]).map(r => (
                        <button key={r} onClick={() => setRange(r)}
                            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                range === r ? "bg-card shadow-sm border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}>
                            {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpis.map((kpi, i) => (
                    <div key={i} className="premium-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.bg)}>
                                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                            </div>
                            <div className={cn("flex items-center gap-0.5 text-[10px] font-bold",
                                kpi.change > 0 ? "text-hub-teal" : kpi.change < 0 ? "text-hub-rose" : "text-muted-foreground"
                            )}>
                                {kpi.change > 0 ? <ArrowUp className="w-3 h-3" /> : kpi.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {Math.abs(kpi.change)}{typeof kpi.change === 'number' && kpi.change % 1 !== 0 ? '' : '%'}
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-outfit font-bold">{kpi.value}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">{kpi.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learner Engagement */}
                <div className="premium-card p-5 space-y-4">
                    <div>
                        <h3 className="font-outfit font-bold">Learner Engagement</h3>
                        <p className="text-xs text-muted-foreground">Active learners & AI queries over time</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={engagementData}>
                            <defs>
                                <linearGradient id="learnerGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                            <Area type="monotone" dataKey="active_learners" stroke="#4f46e5" strokeWidth={2} fill="url(#learnerGrad)" name="Active Learners" />
                            <Area type="monotone" dataKey="ai_queries"      stroke="#9333ea" strokeWidth={2} fill="url(#aiGrad)"      name="AI Queries" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Trends */}
                <div className="premium-card p-5 space-y-4">
                    <div>
                        <h3 className="font-outfit font-bold">Attendance Trends</h3>
                        <p className="text-xs text-muted-foreground">Weekly session participation breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={attendanceData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                            <Bar dataKey="attended" fill="#0d9488" radius={[4, 4, 0, 0]} name="Attended" />
                            <Bar dataKey="late"     fill="#d97706" radius={[4, 4, 0, 0]} name="Late" />
                            <Bar dataKey="absent"   fill="#e11d48" radius={[4, 4, 0, 0]} name="Absent" />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course Performance */}
                <div className="lg:col-span-2 premium-card p-5 space-y-4">
                    <div>
                        <h3 className="font-outfit font-bold">Course Performance</h3>
                        <p className="text-xs text-muted-foreground">Enrollment, completion, and scores by course</p>
                    </div>
                    <div className="space-y-4">
                        {coursePerformance.map((c, i) => {
                            const completionRate = Math.round((c.completed / c.enrolled) * 100);
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-sm font-bold">{c.course}</span>
                                        </div>
                                        <div className="flex gap-6 text-xs text-muted-foreground">
                                            <span>{c.enrolled} enrolled</span>
                                            <span className="font-bold text-foreground">{completionRate}% done</span>
                                            <span>Avg {c.avg_score}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                            style={{ width: `${completionRate}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Assessment Distribution */}
                <div className="premium-card p-5 space-y-4">
                    <div>
                        <h3 className="font-outfit font-bold">Assessment Scores</h3>
                        <p className="text-xs text-muted-foreground">Score distribution across all assessments</p>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={assessmentDist} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="range">
                                {assessmentDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                        {assessmentDist.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                                    <span className="text-muted-foreground">{d.range}</span>
                                </div>
                                <span className="font-bold">{d.count} learners</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tutor Leaderboard */}
            <div className="premium-card p-5 space-y-4">
                <div>
                    <h3 className="font-outfit font-bold">Tutor Effectiveness Leaderboard</h3>
                    <p className="text-xs text-muted-foreground">Ranked by learner completion rate and average progress</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-border/50">
                                <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rank</th>
                                <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tutor</th>
                                <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Learners</th>
                                <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sessions</th>
                                <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion Rate</th>
                                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {tutorLeaderboard.map((tutor, i) => (
                                <tr key={i} className="hover:bg-accent/30 transition-colors">
                                    <td className="py-3 pr-4">
                                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-outfit font-bold text-sm",
                                            i === 0 ? "bg-hub-amber/20 text-hub-amber" :
                                            i === 1 ? "bg-muted text-muted-foreground" :
                                            i === 2 ? "bg-hub-amber/10 text-hub-amber/70" :
                                            "bg-accent text-muted-foreground text-xs"
                                        )}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 font-bold">{tutor.name}</td>
                                    <td className="py-3 pr-4 text-muted-foreground">{tutor.learners}</td>
                                    <td className="py-3 pr-4 text-muted-foreground">{tutor.sessions}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden max-w-[80px]">
                                                <div className="h-full bg-hub-teal rounded-full" style={{ width: `${tutor.completion_rate}%` }} />
                                            </div>
                                            <span className="font-bold text-hub-teal">{tutor.completion_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden max-w-[80px]">
                                                <div className="h-full bg-hub-indigo rounded-full" style={{ width: `${tutor.avg_progress}%` }} />
                                            </div>
                                            <span className="font-bold text-hub-indigo">{tutor.avg_progress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: "AI Teaching Assistant Queries", value: "3,240", sub: "This month", icon: Sparkles, color: "text-hub-purple", bg: "bg-hub-purple/10", trend: "+18% vs last month" },
                    { label: "AI Lesson Generations",         value: "127",   sub: "Content pieces", icon: BookOpen, color: "text-hub-indigo", bg: "bg-hub-indigo/10", trend: "+34% vs last month" },
                    { label: "AI-Suggested Interventions",    value: "45",    sub: "At-risk learners", icon: Activity, color: "text-hub-amber", bg: "bg-hub-amber/10", trend: "12 acted upon" },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-5 space-y-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                            <s.icon className={cn("w-5 h-5", s.color)} />
                        </div>
                        <div>
                            <p className="text-3xl font-outfit font-bold">{s.value}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-hub-teal">
                            <ArrowUp className="w-3 h-3" />{s.trend}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
