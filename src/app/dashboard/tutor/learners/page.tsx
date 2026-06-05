"use client"

import { useState } from "react";
import Link from "next/link";
import {
    Search, Filter, Users, AlertTriangle, CheckCircle, Star, ChevronDown,
    MessageSquare, CalendarDays, FileBarChart2, TrendingUp, Video, BookOpen,
    Activity, Clock, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnerProgress } from "@/types";

const mockLearners: LearnerProgress[] = [
    { learner_id: "1", learner_name: "Amara Nwosu",      learner_email: "amara@edu.ng",    course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 78, modules_completed: 7, total_modules: 9, last_active: "2 hours ago",  attendance_rate: 92,  assessment_avg: 85, engagement_score: 88, status: "ahead",    sessions_attended: 11, total_sessions: 12 },
    { learner_id: "2", learner_name: "Kwame Asante",     learner_email: "kwame@edu.gh",    course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 45, modules_completed: 4, total_modules: 9, last_active: "3 days ago",   attendance_rate: 58,  assessment_avg: 62, engagement_score: 51, status: "at_risk",  sessions_attended: 7,  total_sessions: 12 },
    { learner_id: "3", learner_name: "Fatima Al-Hassan", learner_email: "fatima@edu.ke",   course_id: "c2", course_title: "AI & Machine Learning",    overall_progress: 63, modules_completed: 5, total_modules: 8, last_active: "1 day ago",    attendance_rate: 83,  assessment_avg: 78, engagement_score: 74, status: "on_track", sessions_attended: 10, total_sessions: 12 },
    { learner_id: "4", learner_name: "Sipho Dlamini",    learner_email: "sipho@edu.za",    course_id: "c2", course_title: "AI & Machine Learning",    overall_progress: 91, modules_completed: 8, total_modules: 8, last_active: "Today",         attendance_rate: 100, assessment_avg: 94, engagement_score: 97, status: "ahead",    sessions_attended: 12, total_sessions: 12 },
    { learner_id: "5", learner_name: "Nneka Obi",        learner_email: "nneka@edu.ng",    course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 32, modules_completed: 3, total_modules: 9, last_active: "5 days ago",   attendance_rate: 42,  assessment_avg: 55, engagement_score: 38, status: "at_risk",  sessions_attended: 5,  total_sessions: 12 },
    { learner_id: "6", learner_name: "Chidi Okeke",      learner_email: "chidi@edu.ng",    course_id: "c3", course_title: "Data Science Foundations", overall_progress: 55, modules_completed: 3, total_modules: 6, last_active: "Yesterday",     attendance_rate: 75,  assessment_avg: 70, engagement_score: 66, status: "on_track", sessions_attended: 9,  total_sessions: 12 },
    { learner_id: "7", learner_name: "Lerato Mokoena",   learner_email: "lerato@edu.za",   course_id: "c3", course_title: "Data Science Foundations", overall_progress: 87, modules_completed: 5, total_modules: 6, last_active: "Today",         attendance_rate: 96,  assessment_avg: 90, engagement_score: 92, status: "ahead",    sessions_attended: 12, total_sessions: 12 },
    { learner_id: "8", learner_name: "Aisha Bello",      learner_email: "aisha@edu.ng",    course_id: "c1", course_title: "Full Stack Engineering",   overall_progress: 18, modules_completed: 2, total_modules: 9, last_active: "1 week ago",   attendance_rate: 25,  assessment_avg: 40, engagement_score: 22, status: "inactive", sessions_attended: 3,  total_sessions: 12 },
];

const statusConfig = {
    ahead:    { label: "Ahead",    color: "text-hub-indigo", bg: "bg-hub-indigo/10", icon: Star },
    on_track: { label: "On Track", color: "text-hub-teal",   bg: "bg-hub-teal/10",   icon: CheckCircle },
    at_risk:  { label: "At Risk",  color: "text-hub-amber",  bg: "bg-hub-amber/10",  icon: AlertTriangle },
    inactive: { label: "Inactive", color: "text-hub-rose",   bg: "bg-hub-rose/10",   icon: AlertTriangle },
};

type StatusFilter = 'all' | 'ahead' | 'on_track' | 'at_risk' | 'inactive';

export default function LearnersPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedLearner, setSelectedLearner] = useState<LearnerProgress | null>(null);

    const filtered = mockLearners.filter(l => {
        const matchesSearch = l.learner_name.toLowerCase().includes(search.toLowerCase()) ||
                              l.learner_email.toLowerCase().includes(search.toLowerCase()) ||
                              l.course_title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-10">
            <div className="page-header">
                <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                    <Users className="w-4 h-4" /> Tutor Mode
                </div>
                <h1 className="page-title">My Learners</h1>
                <p className="page-description">Monitor individual learner progress, engagement, and performance across all your assigned courses.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search learners, courses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 focus:border-hub-indigo outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'ahead', 'on_track', 'at_risk', 'inactive'] as StatusFilter[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                                statusFilter === s
                                    ? "bg-hub-indigo text-white border-hub-indigo shadow-md"
                                    : "bg-accent/30 border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {s === 'all' ? 'All' : s.replace('_', ' ')}
                            {s !== 'all' && (
                                <span className="ml-1.5 opacity-70">
                                    {mockLearners.filter(l => l.status === s).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Learner List */}
                <div className={cn("space-y-3", selectedLearner ? "lg:col-span-2" : "lg:col-span-3")}>
                    <p className="text-sm text-muted-foreground font-medium">{filtered.length} learner{filtered.length !== 1 ? 's' : ''} found</p>
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No learners match your filters</p>
                        </div>
                    ) : (
                        filtered.map(learner => {
                            const cfg = statusConfig[learner.status];
                            const StatusIcon = cfg.icon;
                            const isSelected = selectedLearner?.learner_id === learner.learner_id;
                            return (
                                <div
                                    key={learner.learner_id}
                                    onClick={() => setSelectedLearner(isSelected ? null : learner)}
                                    className={cn(
                                        "premium-card p-5 cursor-pointer transition-all",
                                        isSelected && "border-hub-indigo/40 shadow-lg shadow-hub-indigo/10 ring-1 ring-hub-indigo/20"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold shrink-0">
                                            {learner.learner_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div>
                                                    <p className="font-bold">{learner.learner_name}</p>
                                                    <p className="text-xs text-muted-foreground">{learner.learner_email} · {learner.course_title}</p>
                                                </div>
                                                <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1", cfg.bg, cfg.color)}>
                                                    <StatusIcon className="w-3 h-3" />{cfg.label}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3 mb-3">
                                                {[
                                                    { label: "Progress",    value: `${learner.overall_progress}%` },
                                                    { label: "Attendance",  value: `${learner.attendance_rate}%`  },
                                                    { label: "Avg Score",   value: `${learner.assessment_avg}%`   },
                                                    { label: "Engagement",  value: `${learner.engagement_score}%` },
                                                ].map((m, i) => (
                                                    <div key={i} className="text-center">
                                                        <p className="text-sm font-outfit font-bold">{m.value}</p>
                                                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", learner.status === 'at_risk' || learner.status === 'inactive' ? 'bg-hub-amber' : learner.status === 'ahead' ? 'bg-hub-indigo' : 'bg-hub-teal')}
                                                    style={{ width: `${learner.overall_progress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Last active: {learner.last_active}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">{learner.sessions_attended}/{learner.total_sessions} sessions</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                {selectedLearner && (
                    <div className="space-y-4">
                        <div className="premium-card p-5 space-y-4 sticky top-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-outfit font-bold">Learner Detail</h3>
                                <button onClick={() => setSelectedLearner(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
                            </div>
                            <div className="text-center space-y-2 py-2">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold text-xl mx-auto">
                                    {selectedLearner.learner_name.charAt(0)}
                                </div>
                                <p className="font-outfit font-bold">{selectedLearner.learner_name}</p>
                                <p className="text-xs text-muted-foreground">{selectedLearner.learner_email}</p>
                                <span className={cn("inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full items-center gap-1",
                                    statusConfig[selectedLearner.status].bg, statusConfig[selectedLearner.status].color)}>
                                    {statusConfig[selectedLearner.status].label}
                                </span>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-3">
                                {[
                                    { label: "Course Progress",  value: selectedLearner.overall_progress,  color: "bg-hub-indigo"  },
                                    { label: "Attendance Rate",  value: selectedLearner.attendance_rate,   color: "bg-hub-teal"    },
                                    { label: "Assessment Avg",   value: selectedLearner.assessment_avg,    color: selectedLearner.assessment_avg < 60 ? "bg-hub-amber" : "bg-hub-indigo" },
                                    { label: "Engagement Score", value: selectedLearner.engagement_score,  color: "bg-hub-purple"  },
                                ].map((m, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-muted-foreground">{m.label}</span>
                                            <span>{m.value}%</span>
                                        </div>
                                        <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full", m.color)} style={{ width: `${m.value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-border space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modules</p>
                                <p className="text-sm font-bold">{selectedLearner.modules_completed} / {selectedLearner.total_modules} complete</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 pt-2">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all">
                                    <Video className="w-4 h-4" /> Schedule 1-on-1
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold hover:bg-accent transition-all">
                                    <MessageSquare className="w-4 h-4" /> Send Message
                                </button>
                                <Link href="/dashboard/tutor/reports" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold hover:bg-accent transition-all">
                                    <FileBarChart2 className="w-4 h-4" /> View Report
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
