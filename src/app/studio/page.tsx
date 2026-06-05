"use client"

import { useState } from "react";
import Link from "next/link";
import {
    Video, Plus, Search, PlayCircle, Users, Clock, Lock, Globe,
    Link2, BookOpen, ArrowRight, Mic, Monitor, Calendar, Star,
    ChevronRight, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningSession, SessionAccessType } from "@/types";

const mockLiveSessions: LearningSession[] = [
    { id: "live1", title: "React State Management — Live Coding", host_id: "t1", host_name: "Dr. Kemi Adeyemi", course_title: "Full Stack Engineering", scheduled_at: new Date(Date.now() - 900000).toISOString(), started_at: new Date(Date.now() - 900000).toISOString(), status: "live", access_type: "enrollment", max_participants: 25, participant_count: 19, is_recorded: true, created_at: new Date().toISOString() },
    { id: "live2", title: "AI Workshop: Neural Networks Q&A", host_id: "t2", host_name: "Prof. James Osei", course_title: "AI & Machine Learning", scheduled_at: new Date(Date.now() - 1800000).toISOString(), started_at: new Date(Date.now() - 1800000).toISOString(), status: "live", access_type: "group", max_participants: 15, participant_count: 13, is_recorded: true, created_at: new Date().toISOString() },
];

const mockUpcomingSessions: LearningSession[] = [
    { id: "s1", title: "Data Structures: Trees & Graphs", host_id: "t1", host_name: "Dr. Kemi Adeyemi", course_title: "Full Stack Engineering", scheduled_at: new Date(Date.now() + 3600000).toISOString(), status: "scheduled", access_type: "enrollment", session_code: "FSE-0412", max_participants: 30, participant_count: 22, is_recorded: true, created_at: new Date().toISOString() },
    { id: "s2", title: "Office Hours: Open Q&A", host_id: "t3", host_name: "Tutor Sarah Mbeki", scheduled_at: new Date(Date.now() + 7200000).toISOString(), status: "scheduled", access_type: "open", max_participants: 50, participant_count: 8, is_recorded: false, created_at: new Date().toISOString() },
    { id: "s3", title: "ML Model Deployment Workshop", host_id: "t2", host_name: "Prof. James Osei", course_title: "AI & Machine Learning", scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: "scheduled", access_type: "code", session_code: "AML-7734", max_participants: 20, participant_count: 15, is_recorded: true, created_at: new Date().toISOString() },
];

const accessIcons: Record<SessionAccessType, any> = {
    enrollment: BookOpen, code: Lock, invite: Link2, group: Users, open: Globe
};

function formatLiveTimer(startedAt: string) {
    const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const m = Math.floor(secs / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m live`;
    return `${m}m live`;
}

function formatTime(iso: string) {
    const d = new Date(iso);
    const diff = d.getTime() - Date.now();
    if (diff < 3600000) return `In ${Math.round(diff / 60000)} min`;
    if (diff < 86400000) return `Today · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ` · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Join by Code Modal ───────────────────────────────────────────────────────
function JoinModal({ onClose }: { onClose: () => void }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) { setError("Please enter a session code."); return; }
        // In production: validate against API
        window.location.href = `/studio/demo?code=${code}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-slide-up">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5 text-hub-indigo" />
                    </div>
                    <h2 className="font-outfit font-bold text-xl">Join with Code</h2>
                    <p className="text-sm text-muted-foreground">Enter the session code provided by your tutor.</p>
                </div>
                <form onSubmit={handleJoin} className="space-y-4">
                    <input
                        value={code}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                        placeholder="e.g. FSE-0412"
                        maxLength={10}
                        className="w-full px-4 py-3 bg-accent/30 border border-border/60 rounded-xl text-center text-xl font-outfit font-bold tracking-widest focus:ring-2 focus:ring-hub-indigo/30 focus:border-hub-indigo outline-none transition-all uppercase"
                    />
                    {error && <p className="text-xs text-hub-rose text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25">
                        Join Session
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function StudioLobby() {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [searchCode, setSearchCode] = useState("");

    return (
        <div className="min-h-screen bg-background">
            {showJoinModal && <JoinModal onClose={() => setShowJoinModal(false)} />}

            {/* Hero */}
            <div className="border-b border-border/50 bg-gradient-to-br from-hub-indigo/5 via-transparent to-hub-purple/5 px-4 md:px-8 py-12">
                <div className="max-w-5xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-hub-indigo/10 border border-hub-indigo/20 rounded-full text-xs font-bold text-hub-indigo uppercase tracking-widest">
                        <Radio className="w-3 h-3 animate-pulse" /> Learning Studio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-outfit font-bold tracking-tight">
                        Your Virtual <span className="gradient-text">Classroom</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Join live sessions, interact with your tutor, and learn together — no external tools needed.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/25 active:scale-95"
                        >
                            <Lock className="w-4 h-4" /> Join with Code
                        </button>
                        <Link href="/dashboard/tutor/sessions"
                            className="px-6 py-3 bg-card border border-border/60 rounded-xl font-bold flex items-center gap-2 hover:bg-accent transition-all">
                            <Plus className="w-4 h-4" /> Create Session
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-10">
                {/* Live Now */}
                {mockLiveSessions.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-hub-rose animate-pulse" />
                            <h2 className="font-outfit font-bold text-xl">Live Now</h2>
                            <span className="text-xs font-bold text-hub-rose bg-hub-rose/10 px-2 py-0.5 rounded-full">
                                {mockLiveSessions.length} active
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockLiveSessions.map(session => {
                                const AccessIcon = accessIcons[session.access_type];
                                return (
                                    <div key={session.id} className="premium-card p-5 space-y-4 border-hub-rose/20 hover:border-hub-rose/40 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hub-rose to-hub-amber" />
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-hub-rose uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-hub-rose animate-pulse" />
                                                        Live · {session.started_at ? formatLiveTimer(session.started_at) : ''}
                                                    </span>
                                                </div>
                                                <h3 className="font-outfit font-bold leading-snug">{session.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">by {session.host_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                <span>{session.participant_count} learners</span>
                                            </div>
                                            {session.course_title && (
                                                <div className="flex items-center gap-1.5">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span className="truncate">{session.course_title}</span>
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/studio/${session.id}`}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-hub-rose text-white rounded-xl font-bold hover:bg-hub-rose/90 transition-all active:scale-95">
                                            <Video className="w-4 h-4" /> Join Now
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Upcoming */}
                <section className="space-y-4">
                    <h2 className="font-outfit font-bold text-xl">Upcoming Sessions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockUpcomingSessions.map(session => {
                            const AccessIcon = accessIcons[session.access_type];
                            return (
                                <div key={session.id} className="premium-card p-5 space-y-4 hover:shadow-lg transition-all">
                                    <div>
                                        <h3 className="font-outfit font-bold leading-snug">{session.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">by {session.host_name}</p>
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 shrink-0" />
                                            <span>{formatTime(session.scheduled_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 shrink-0" />
                                            <span>{session.participant_count}/{session.max_participants} participants</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AccessIcon className="w-4 h-4 shrink-0" />
                                            <span className="capitalize">{session.access_type} access</span>
                                        </div>
                                    </div>
                                    {session.session_code && (
                                        <div className="px-3 py-2 bg-accent/50 rounded-lg border border-border/50 text-center">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Code</p>
                                            <p className="font-outfit font-bold tracking-widest">{session.session_code}</p>
                                        </div>
                                    )}
                                    <Link href={`/studio/${session.id}/join`}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-hub-indigo/10 text-hub-indigo rounded-xl text-sm font-bold hover:bg-hub-indigo/20 transition-all border border-hub-indigo/20">
                                        <ChevronRight className="w-4 h-4" /> Preview & Join
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
