"use client"

import { useState } from "react";
import Link from "next/link";
import {
    CalendarDays, Plus, Video, Clock, Users, Lock, Link2, UserCheck,
    UsersRound, Globe, CheckCircle, Copy, ExternalLink, ChevronRight,
    Play, MoreHorizontal, Trash2, Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningSession, SessionAccessType } from "@/types";

const mockSessions: (LearningSession & { tags?: string[] })[] = [
    { id: "s1", title: "React State Management Deep Dive", description: "Covering Redux, Zustand, and React Context with live coding exercises.", host_id: "t1", course_title: "Full Stack Engineering", scheduled_at: new Date(Date.now() + 3600000).toISOString(), status: "scheduled", access_type: "enrollment", session_code: "FSE-0412", max_participants: 25, participant_count: 18, is_recorded: true, created_at: new Date().toISOString(), tags: ["React", "State Management"] },
    { id: "s2", title: "Neural Networks: Week 4 Review", description: "Backpropagation, activation functions, and hands-on TensorFlow session.", host_id: "t1", course_title: "AI & Machine Learning", scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", access_type: "group", session_code: "AML-0989", max_participants: 15, participant_count: 12, is_recorded: true, created_at: new Date().toISOString(), tags: ["Neural Networks", "TensorFlow"] },
    { id: "s3", title: "Office Hours: Open Q&A", description: "Open session for all learners to ask questions on any topic.", host_id: "t1", scheduled_at: new Date(Date.now() + 172800000).toISOString(), status: "scheduled", access_type: "open", session_code: "OH-0001", max_participants: 50, participant_count: 8, is_recorded: false, created_at: new Date().toISOString() },
    { id: "s4", title: "Data Structures: Trees & Graphs", description: "Algorithms review before the mid-term assessment.", host_id: "t1", course_title: "Full Stack Engineering", scheduled_at: new Date(Date.now() - 86400000).toISOString(), status: "ended", access_type: "enrollment", session_code: "FSE-0398", max_participants: 25, participant_count: 22, is_recorded: true, recording_url: "/recordings/s4", created_at: new Date().toISOString() },
];

const accessConfig: Record<SessionAccessType, { label: string; icon: any; color: string }> = {
    enrollment: { label: "Enrolled Only",    icon: BookOpen,   color: "text-hub-teal"   },
    code:       { label: "Session Code",     icon: Lock,       color: "text-hub-amber"  },
    invite:     { label: "Invite Link",      icon: Link2,      color: "text-hub-indigo" },
    group:      { label: "Group Members",    icon: UsersRound, color: "text-hub-purple" },
    open:       { label: "Open Access",      icon: Globe,      color: "text-hub-teal"   },
};

function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' }),
        time: d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
        isPast: d < new Date(),
        isToday: d.toDateString() === new Date().toDateString(),
    };
}

// ─── New Session Modal ────────────────────────────────────────────────────────
function NewSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: (session: LearningSession) => void }) {
    const [form, setForm] = useState({
        title: '', description: '', date: '', time: '', access_type: 'enrollment' as SessionAccessType,
        max_participants: 25, is_recorded: true, course: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date || !form.time) { setError('Please pick a date and time.'); return; }
        setLoading(true);
        setError('');
        try {
            const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
            const res = await fetch('/api/studio/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description || undefined,
                    scheduled_at,
                    access_type: form.access_type,
                    max_participants: form.max_participants,
                    is_recorded: form.is_recorded,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create session');
            onCreated(json.session);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-slide-up">
                <div>
                    <h2 className="font-outfit font-bold text-xl">Create New Session</h2>
                    <p className="text-sm text-muted-foreground mt-1">Schedule a virtual classroom session for your learners.</p>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Title</label>
                        <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                            placeholder="e.g. Week 5 Live Review"
                            className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 focus:border-hub-indigo outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (optional)</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                            placeholder="Brief overview of this session..."
                            className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 focus:border-hub-indigo outline-none transition-all resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                            <input required type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                                className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</label>
                            <input required type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))}
                                className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(accessConfig) as SessionAccessType[]).map(type => {
                                const cfg = accessConfig[type];
                                const Icon = cfg.icon;
                                return (
                                    <button key={type} type="button" onClick={() => setForm(f => ({...f, access_type: type}))}
                                        className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                                            form.access_type === type
                                                ? "border-hub-indigo/60 bg-hub-indigo/10 text-hub-indigo"
                                                : "border-border/60 bg-accent/20 text-muted-foreground hover:text-foreground"
                                        )}>
                                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Participants</label>
                            <input type="number" value={form.max_participants} min={2} max={500}
                                onChange={e => setForm(f => ({...f, max_participants: +e.target.value}))}
                                className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Record Session</label>
                            <button type="button" onClick={() => setForm(f => ({...f, is_recorded: !f.is_recorded}))}
                                className={cn("w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                                    form.is_recorded
                                        ? "bg-hub-indigo/10 border-hub-indigo/40 text-hub-indigo"
                                        : "bg-accent/20 border-border/60 text-muted-foreground"
                                )}>
                                <CheckCircle className="w-4 h-4" /> {form.is_recorded ? 'Yes' : 'No'}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-xs text-hub-rose bg-hub-rose/10 border border-hub-rose/20 rounded-lg px-3 py-2">{error}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold hover:bg-accent transition-all disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25 disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                            ) : 'Create Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { BookOpen } from "lucide-react";

export default function SessionsPage() {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [sessions_list, setSessionsList] = useState(mockSessions);

    const handleCreated = (session: LearningSession) => {
        setSessionsList(prev => [session, ...prev]);
    };

    const upcoming = sessions_list.filter(s => s.status !== 'ended');
    const past = sessions_list.filter(s => s.status === 'ended');
    const sessions = activeTab === 'upcoming' ? upcoming : past;

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-8 pb-10">
            {showModal && <NewSessionModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <CalendarDays className="w-4 h-4" /> Tutor Mode
                    </div>
                    <h1 className="page-title">Sessions</h1>
                    <p className="page-description">Schedule, manage, and launch your virtual classroom sessions.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25 active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" /> New Session
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-accent/30 rounded-xl border border-border/50 w-fit">
                {(['upcoming', 'past'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn("px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all",
                            activeTab === tab ? "bg-card shadow-sm border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {tab} <span className="ml-1.5 text-[10px] opacity-60">{tab === 'upcoming' ? upcoming.length : past.length}</span>
                    </button>
                ))}
            </div>

            {/* Sessions */}
            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">No {activeTab} sessions</p>
                        {activeTab === 'upcoming' && (
                            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all">
                                Schedule Your First Session
                            </button>
                        )}
                    </div>
                ) : (
                    sessions.map(session => {
                        const dt = formatDateTime(session.scheduled_at);
                        const accessCfg = accessConfig[session.access_type];
                        const AccessIcon = accessCfg.icon;
                        return (
                            <div key={session.id} className="premium-card p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {dt.isToday && !dt.isPast && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-hub-rose/10 text-hub-rose rounded-full">Today</span>
                                            )}
                                            {dt.isPast && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Ended</span>
                                            )}
                                        </div>
                                        <h3 className="font-outfit font-bold text-base">{session.title}</h3>
                                        {session.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{session.description}</p>}
                                    </div>
                                    {!dt.isPast ? (
                                        <Link href={`/studio/${session.id}`}
                                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all shadow-md shadow-hub-indigo/20 active:scale-95">
                                            <Play className="w-4 h-4" fill="currentColor" /> Start
                                        </Link>
                                    ) : (
                                        session.recording_url && (
                                            <Link href={session.recording_url}
                                                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold hover:bg-accent transition-all">
                                                <Video className="w-4 h-4" /> Recording
                                            </Link>
                                        )
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>{dt.date} · {dt.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>{session.participant_count}/{session.max_participants} participants</span>
                                    </div>
                                    <div className={cn("flex items-center gap-1.5", accessCfg.color)}>
                                        <AccessIcon className="w-4 h-4" />
                                        <span className="font-medium">{accessCfg.label}</span>
                                    </div>
                                    {session.course_title && (
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="w-4 h-4" />
                                            <span>{session.course_title}</span>
                                        </div>
                                    )}
                                </div>

                                {session.session_code && (
                                    <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl border border-border/50">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session Code</p>
                                            <p className="font-outfit font-bold text-lg tracking-widest">{session.session_code}</p>
                                        </div>
                                        <button onClick={() => copyCode(session.session_code!)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-hub-indigo/10 text-hub-indigo border border-hub-indigo/20 rounded-lg text-xs font-bold hover:bg-hub-indigo/20 transition-all">
                                            <Copy className="w-3.5 h-3.5" />
                                            {copiedCode === session.session_code ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
