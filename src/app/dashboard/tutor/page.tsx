"use client"

import { useState } from "react";
import Link from "next/link";
import {
    UserCheck, Users, CalendarDays, TrendingUp, AlertTriangle, CheckCircle,
    ArrowRight, Video, Clock, Target, MessageSquare, FileBarChart2,
    Plus, Star, Activity, UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnerProgress, LearningSession } from "@/types";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockLearners: LearnerProgress[] = [
    { learner_id: "1", learner_name: "Amara Nwosu", learner_email: "amara@edu.ng", course_id: "c1", course_title: "Full Stack Engineering", overall_progress: 78, modules_completed: 7, total_modules: 9, last_active: "2 hours ago", attendance_rate: 92, assessment_avg: 85, engagement_score: 88, status: "ahead", sessions_attended: 11, total_sessions: 12 },
    { learner_id: "2", learner_name: "Kwame Asante", learner_email: "kwame@edu.gh", course_id: "c1", course_title: "Full Stack Engineering", overall_progress: 45, modules_completed: 4, total_modules: 9, last_active: "3 days ago", attendance_rate: 58, assessment_avg: 62, engagement_score: 51, status: "at_risk", sessions_attended: 7, total_sessions: 12 },
    { learner_id: "3", learner_name: "Fatima Al-Hassan", learner_email: "fatima@edu.ke", course_id: "c2", course_title: "AI & Machine Learning", overall_progress: 63, modules_completed: 5, total_modules: 8, last_active: "1 day ago", attendance_rate: 83, assessment_avg: 78, engagement_score: 74, status: "on_track", sessions_attended: 10, total_sessions: 12 },
    { learner_id: "4", learner_name: "Sipho Dlamini", learner_email: "sipho@edu.za", course_id: "c2", course_title: "AI & Machine Learning", overall_progress: 91, modules_completed: 8, total_modules: 8, last_active: "Today", attendance_rate: 100, assessment_avg: 94, engagement_score: 97, status: "ahead", sessions_attended: 12, total_sessions: 12 },
    { learner_id: "5", learner_name: "Nneka Obi", learner_email: "nneka@edu.ng", course_id: "c1", course_title: "Full Stack Engineering", overall_progress: 32, modules_completed: 3, total_modules: 9, last_active: "5 days ago", attendance_rate: 42, assessment_avg: 55, engagement_score: 38, status: "at_risk", sessions_attended: 5, total_sessions: 12 },
];

const mockSessions: LearningSession[] = [
    { id: "s1", title: "React State Management Deep Dive", host_id: "t1", course_title: "Full Stack Engineering", scheduled_at: new Date(Date.now() + 3600000).toISOString(), status: "scheduled", access_type: "enrollment", max_participants: 25, participant_count: 18, is_recorded: true, created_at: new Date().toISOString() },
    { id: "s2", title: "Neural Networks: Week 4 Review", host_id: "t1", course_title: "AI & Machine Learning", scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", access_type: "group", max_participants: 15, participant_count: 12, is_recorded: true, created_at: new Date().toISOString() },
    { id: "s3", title: "Office Hours: Open Q&A", host_id: "t1", scheduled_at: new Date(Date.now() + 172800000).toISOString(), status: "scheduled", access_type: "open", max_participants: 50, participant_count: 8, is_recorded: false, created_at: new Date().toISOString() },
];

const statusConfig = {
    ahead:    { label: "Ahead",    color: "text-hub-indigo", bg: "bg-hub-indigo/10", icon: Star },
    on_track: { label: "On Track", color: "text-hub-teal",   bg: "bg-hub-teal/10",   icon: CheckCircle },
    at_risk:  { label: "At Risk",  color: "text-hub-amber",  bg: "bg-hub-amber/10",  icon: AlertTriangle },
    inactive: { label: "Inactive", color: "text-hub-rose",   bg: "bg-hub-rose/10",   icon: AlertTriangle },
};

function formatSessionTime(isoString: string) {
    const d = new Date(isoString);
    const diff = d.getTime() - Date.now();
    if (diff < 3600000) return `In ${Math.round(diff / 60000)} min`;
    if (diff < 86400000) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ` · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TutorDashboard() {
    const atRisk = mockLearners.filter(l => l.status === 'at_risk').length;
    const avgProgress = Math.round(mockLearners.reduce((a, l) => a + l.overall_progress, 0) / mockLearners.length);
    const avgAttendance = Math.round(mockLearners.reduce((a, l) => a + l.attendance_rate, 0) / mockLearners.length);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <UserCheck className="w-4 h-4" />
                        Tutor Mode
                    </div>
                    <h1 className="page-title">Tutor Command Center</h1>
                    <p className="page-description">Monitor learner progress, schedule sessions, and drive student success from one unified dashboard.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Link href="/dashboard/tutor/sessions" className="px-4 py-2.5 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent transition-all">
                        <CalendarDays className="w-4 h-4" /> Schedule
                    </Link>
                    <Link href="/studio" className="px-4 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25 active:scale-95">
                        <Video className="w-4 h-4" /> Start Session
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users,       label: "Active Learners",    value: mockLearners.length,  sub: `${atRisk} at risk`,        color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { icon: TrendingUp,  label: "Avg. Progress",      value: `${avgProgress}%`,     sub: "Across all learners",      color: "text-hub-teal",   bg: "bg-hub-teal/10"   },
                    { icon: CalendarDays,label: "Sessions This Week",  value: mockSessions.length,  sub: "1 starting soon",          color: "text-hub-purple", bg: "bg-hub-purple/10" },
                    { icon: Activity,    label: "Avg. Attendance",    value: `${avgAttendance}%`,   sub: "Session participation",    color: "text-hub-amber",  bg: "bg-hub-amber/10"  },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.sub}</span>
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl font-outfit font-bold">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Learner Roster */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-outfit font-bold text-lg">Learner Progress</h2>
                        <Link href="/dashboard/tutor/learners" className="text-sm text-hub-indigo font-bold flex items-center gap-1 hover:underline group">
                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {mockLearners.map((learner) => {
                            const cfg = statusConfig[learner.status];
                            const StatusIcon = cfg.icon;
                            return (
                                <div key={learner.learner_id} className="premium-card p-4 group cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {learner.learner_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-hub-indigo transition-colors">{learner.learner_name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{learner.course_title}</p>
                                                </div>
                                                <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1", cfg.bg, cfg.color)}>
                                                    <StatusIcon className="w-3 h-3" />{cfg.label}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                                                    <span>Progress</span>
                                                    <span className="text-foreground">{learner.overall_progress}%</span>
                                                </div>
                                                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-700",
                                                            learner.status === 'at_risk' ? 'bg-hub-amber' :
                                                            learner.status === 'ahead' ? 'bg-hub-indigo' : 'bg-hub-teal')}
                                                        style={{ width: `${learner.overall_progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                                <span>📅 {learner.sessions_attended}/{learner.total_sessions} sessions</span>
                                                <span>⏱ {learner.last_active}</span>
                                                <span>📊 {learner.assessment_avg}% avg score</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Upcoming Sessions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-outfit font-bold text-lg">Upcoming</h2>
                            <Link href="/dashboard/tutor/sessions" className="text-xs text-hub-indigo font-bold hover:underline">View All</Link>
                        </div>
                        {mockSessions.map((session) => (
                            <div key={session.id} className="premium-card p-4 space-y-3 group cursor-pointer">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm group-hover:text-hub-indigo transition-colors truncate">{session.title}</p>
                                        {session.course_title && <p className="text-[11px] text-muted-foreground">{session.course_title}</p>}
                                    </div>
                                    <div className="w-7 h-7 rounded-lg bg-hub-indigo/10 flex items-center justify-center shrink-0">
                                        <Video className="w-3.5 h-3.5 text-hub-indigo" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatSessionTime(session.scheduled_at)}
                                    </div>
                                    <span>{session.participant_count}/{session.max_participants}</span>
                                </div>
                            </div>
                        ))}
                        <Link href="/studio" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border/60 rounded-xl text-sm font-bold text-muted-foreground hover:text-hub-indigo hover:border-hub-indigo/50 transition-all">
                            <Plus className="w-4 h-4" /> New Session
                        </Link>
                    </div>

                    {/* At-Risk Alert */}
                    {atRisk > 0 && (
                        <div className="p-4 bg-hub-amber/5 border border-hub-amber/20 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-hub-amber" />
                                <p className="font-bold text-sm text-hub-amber">{atRisk} Learner{atRisk > 1 ? 's' : ''} At Risk</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Low attendance and below-average scores detected. Consider scheduling a 1-on-1 coaching session.
                            </p>
                            <Link href="/dashboard/tutor/learners?filter=at_risk" className="text-[11px] font-bold text-hub-amber hover:underline flex items-center gap-1">
                                View At-Risk Learners <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="premium-card p-4 space-y-1">
                        <h3 className="font-outfit font-bold text-sm mb-3">Quick Actions</h3>
                        {[
                            { label: "Schedule a Session",  icon: CalendarDays,  href: "/dashboard/tutor/sessions" },
                            { label: "Create a Group",      icon: UsersRound,    href: "/dashboard/tutor/groups"   },
                            { label: "Generate Reports",    icon: FileBarChart2, href: "/dashboard/tutor/reports"  },
                            { label: "Message a Learner",   icon: MessageSquare, href: "/dashboard/tutor/learners" },
                        ].map((action, i) => (
                            <Link key={i} href={action.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium text-muted-foreground hover:text-foreground group">
                                <action.icon className="w-4 h-4 group-hover:text-hub-indigo transition-colors" />
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
