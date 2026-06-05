"use client"

import { useState } from "react";
import {
    FileBarChart2, Download, Sparkles, TrendingUp, Users, Activity,
    CheckCircle, AlertTriangle, Star, BarChart3, Clock, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnerProgress } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const mockLearners: LearnerProgress[] = [
    { learner_id: "1", learner_name: "Amara Nwosu",      learner_email: "amara@edu.ng",  course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 78, modules_completed: 7, total_modules: 9, last_active: "2 hours ago",  attendance_rate: 92,  assessment_avg: 85, engagement_score: 88, status: "ahead",    sessions_attended: 11, total_sessions: 12 },
    { learner_id: "2", learner_name: "Kwame Asante",     learner_email: "kwame@edu.gh",  course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 45, modules_completed: 4, total_modules: 9, last_active: "3 days ago",   attendance_rate: 58,  assessment_avg: 62, engagement_score: 51, status: "at_risk",  sessions_attended: 7,  total_sessions: 12 },
    { learner_id: "3", learner_name: "Fatima Al-Hassan", learner_email: "fatima@edu.ke", course_id: "c2", course_title: "AI & Machine Learning",    overall_progress: 63, modules_completed: 5, total_modules: 8, last_active: "1 day ago",    attendance_rate: 83,  assessment_avg: 78, engagement_score: 74, status: "on_track", sessions_attended: 10, total_sessions: 12 },
    { learner_id: "4", learner_name: "Sipho Dlamini",    learner_email: "sipho@edu.za",  course_id: "c2", course_title: "AI & Machine Learning",    overall_progress: 91, modules_completed: 8, total_modules: 8, last_active: "Today",         attendance_rate: 100, assessment_avg: 94, engagement_score: 97, status: "ahead",    sessions_attended: 12, total_sessions: 12 },
    { learner_id: "5", learner_name: "Nneka Obi",        learner_email: "nneka@edu.ng",  course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 32, modules_completed: 3, total_modules: 9, last_active: "5 days ago",   attendance_rate: 42,  assessment_avg: 55, engagement_score: 38, status: "at_risk",  sessions_attended: 5,  total_sessions: 12 },
];

const statusConfig = {
    ahead:    { label: "Ahead",    color: "text-hub-indigo", bg: "bg-hub-indigo/10", icon: Star },
    on_track: { label: "On Track", color: "text-hub-teal",   bg: "bg-hub-teal/10",   icon: CheckCircle },
    at_risk:  { label: "At Risk",  color: "text-hub-amber",  bg: "bg-hub-amber/10",  icon: AlertTriangle },
    inactive: { label: "Inactive", color: "text-hub-rose",   bg: "bg-hub-rose/10",   icon: AlertTriangle },
};

const aiInsights: Record<string, string[]> = {
    "1": [
        "Amara is performing exceptionally well and is on track to complete the course ahead of schedule.",
        "Assessment scores are consistently above 80%, indicating strong conceptual understanding.",
        "Recommend introducing advanced optional modules to maintain engagement and stretch learning.",
    ],
    "2": [
        "Kwame's attendance rate of 58% is a significant concern — missed sessions correlate with slower progress.",
        "Assessment average has dropped 8 points in the last 2 weeks, suggesting knowledge gaps are forming.",
        "Recommend scheduling a 1-on-1 intervention session this week and providing catch-up resources.",
    ],
    "3": [
        "Fatima is progressing at a steady pace consistent with course expectations.",
        "Engagement score of 74% shows active participation but some inconsistency in Q&A involvement.",
        "Recommend encouraging Fatima to tackle the optional challenge exercises to deepen understanding.",
    ],
    "4": [
        "Sipho has achieved perfect attendance and is the highest-performing learner in this cohort.",
        "Assessment average of 94% suggests readiness for advanced certifications.",
        "Recommend nominating Sipho as a peer mentor to reinforce their learning while helping the cohort.",
    ],
    "5": [
        "Nneka is significantly behind with only 42% attendance and 55% average assessment score.",
        "The gap between completed modules (3/9) and the course timeline indicates an at-risk situation.",
        "Immediate intervention recommended: schedule an urgent 1-on-1 and review any personal barriers.",
    ],
};

const comparisonData = [
    { metric: "Progress",    Amara: 78,  Kwame: 45,  Fatima: 63, Sipho: 91, Nneka: 32  },
    { metric: "Attendance",  Amara: 92,  Kwame: 58,  Fatima: 83, Sipho: 100, Nneka: 42 },
    { metric: "Assessment",  Amara: 85,  Kwame: 62,  Fatima: 78, Sipho: 94, Nneka: 55  },
    { metric: "Engagement",  Amara: 88,  Kwame: 51,  Fatima: 74, Sipho: 97, Nneka: 38  },
];

const CHART_COLORS = ['#4f46e5', '#0d9488', '#9333ea', '#d97706', '#e11d48'];

export default function ReportsPage() {
    const [selected, setSelected] = useState<LearnerProgress>(mockLearners[0]);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);

    const insights = aiInsights[selected.learner_id] || [];

    const radarData = [
        { subject: "Progress",   value: selected.overall_progress  },
        { subject: "Attendance", value: selected.attendance_rate    },
        { subject: "Assessment", value: selected.assessment_avg     },
        { subject: "Engagement", value: selected.engagement_score   },
        { subject: "Sessions",   value: Math.round((selected.sessions_attended / selected.total_sessions) * 100) },
    ];

    const handleGenerate = () => {
        setGeneratingReport(true);
        setReportGenerated(false);
        setTimeout(() => { setGeneratingReport(false); setReportGenerated(true); }, 1800);
    };

    const cfg = statusConfig[selected.status];
    const StatusIcon = cfg.icon;

    return (
        <div className="space-y-8 pb-10">
            <div className="page-header">
                <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                    <FileBarChart2 className="w-4 h-4" /> Tutor Mode
                </div>
                <h1 className="page-title">Progress Reports</h1>
                <p className="page-description">AI-powered insights and detailed progress reports for every learner in your program.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Learner Selector */}
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Select Learner</p>
                    {mockLearners.map(learner => {
                        const c = statusConfig[learner.status];
                        const SIcon = c.icon;
                        return (
                            <button
                                key={learner.learner_id}
                                onClick={() => { setSelected(learner); setReportGenerated(false); }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl border transition-all space-y-1",
                                    selected.learner_id === learner.learner_id
                                        ? "border-hub-indigo/40 bg-hub-indigo/5 ring-1 ring-hub-indigo/20"
                                        : "border-border/50 bg-card hover:bg-accent"
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-sm truncate">{learner.learner_name}</p>
                                    <SIcon className={cn("w-3.5 h-3.5 shrink-0", c.color)} />
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{learner.course_title}</p>
                                <div className="h-1 bg-accent rounded-full overflow-hidden">
                                    <div className={cn("h-full", learner.status === 'at_risk' ? 'bg-hub-amber' : learner.status === 'ahead' ? 'bg-hub-indigo' : 'bg-hub-teal')}
                                        style={{ width: `${learner.overall_progress}%` }} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Report Panel */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Learner Header */}
                    <div className="premium-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold text-xl shrink-0">
                            {selected.learner_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="font-outfit font-bold text-xl">{selected.learner_name}</h2>
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1", cfg.bg, cfg.color)}>
                                    <StatusIcon className="w-3 h-3" />{cfg.label}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{selected.learner_email} · {selected.course_title}</p>
                            <p className="text-xs text-muted-foreground mt-1">Last active: {selected.last_active}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={handleGenerate}
                                disabled={generatingReport}
                                className="px-4 py-2 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all disabled:opacity-60"
                            >
                                {generatingReport ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                                ) : (
                                    <><Sparkles className="w-3.5 h-3.5" />AI Report</>
                                )}
                            </button>
                            {reportGenerated && (
                                <button className="px-4 py-2 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent transition-all">
                                    <Download className="w-3.5 h-3.5" /> Export
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Progress",   value: `${selected.overall_progress}%`,  icon: TrendingUp,  color: "text-hub-indigo" },
                            { label: "Attendance", value: `${selected.attendance_rate}%`,    icon: CheckCircle, color: "text-hub-teal"   },
                            { label: "Avg Score",  value: `${selected.assessment_avg}%`,     icon: BarChart3,   color: selected.assessment_avg < 60 ? "text-hub-amber" : "text-hub-purple" },
                            { label: "Sessions",   value: `${selected.sessions_attended}/${selected.total_sessions}`, icon: Clock, color: "text-hub-amber" },
                        ].map((m, i) => (
                            <div key={i} className="premium-card p-4 space-y-1 text-center">
                                <m.icon className={cn("w-5 h-5 mx-auto", m.color)} />
                                <p className="text-lg font-outfit font-bold">{m.value}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{m.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Radar Chart */}
                        <div className="premium-card p-5 space-y-3">
                            <h3 className="font-outfit font-bold">Performance Radar</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="currentColor" className="text-border" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" />
                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cohort Comparison */}
                        <div className="premium-card p-5 space-y-3">
                            <h3 className="font-outfit font-bold">Cohort Comparison</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={comparisonData} barSize={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
                                    <XAxis dataKey="metric" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: 12 }} />
                                    {mockLearners.map((l, i) => (
                                        <Bar key={l.learner_id} dataKey={l.learner_name.split(' ')[0]}
                                            fill={l.learner_id === selected.learner_id ? '#4f46e5' : `${CHART_COLORS[i]}40`}
                                            radius={[4, 4, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Insights */}
                    {(insights.length > 0) && (
                        <div className="premium-card p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-hub-indigo/10 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-hub-indigo" />
                                </div>
                                <div>
                                    <h3 className="font-outfit font-bold">AI Coaching Insights</h3>
                                    <p className="text-xs text-muted-foreground">Generated by MeruX AI based on learner data</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {insights.map((insight, i) => (
                                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl",
                                        i === 0 ? "bg-hub-indigo/5 border border-hub-indigo/20" :
                                        i === 2 ? "bg-hub-teal/5 border border-hub-teal/20" :
                                        "bg-accent/50 border border-border/50"
                                    )}>
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5",
                                            i === 0 ? "bg-hub-indigo" : i === 2 ? "bg-hub-teal" : "bg-muted-foreground"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <p className="text-sm leading-relaxed">{insight}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Module Breakdown */}
                    <div className="premium-card p-5 space-y-4">
                        <h3 className="font-outfit font-bold">Module Progress</h3>
                        <div className="space-y-3">
                            {Array.from({ length: selected.total_modules }, (_, i) => {
                                const isComplete = i < selected.modules_completed;
                                const isCurrent = i === selected.modules_completed;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                            isComplete ? "bg-hub-indigo text-white" :
                                            isCurrent ? "bg-hub-amber/20 text-hub-amber border border-hub-amber/40" :
                                            "bg-accent text-muted-foreground"
                                        )}>
                                            {isComplete ? '✓' : i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn("text-sm font-medium", !isComplete && !isCurrent && "text-muted-foreground")}>
                                                Module {i + 1} {isComplete ? '· Complete' : isCurrent ? '· In Progress' : '· Not Started'}
                                            </p>
                                        </div>
                                        {isCurrent && (
                                            <div className="text-xs font-bold text-hub-amber">
                                                {Math.round((selected.overall_progress % (100 / selected.total_modules)) / (100 / selected.total_modules) * 100)}% done
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
