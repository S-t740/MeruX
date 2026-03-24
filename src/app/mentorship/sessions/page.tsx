"use client"

import { useEffect, useState } from "react";
import { Users, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, Rocket, Video, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MentorshipSessions() {
    const supabase = createClient();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMentorView, setIsMentorView] = useState(false);

    useEffect(() => {
        const fetchMentorshipData = async () => {
            if (!user) return;
            try {
                // Check if user is a mentor
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                const isMentor = profile?.role === "mentor" || profile?.role === "admin" || profile?.role === "super_admin";
                setIsMentorView(isMentor);

                // Fetch Sessions
                const sessionQuery = supabase.from("mentorship_sessions").select("*, mentor:profiles!mentor_id(*), mentee:profiles!mentee_id(*)");
                if (isMentor) {
                    sessionQuery.eq("mentor_id", user.id);
                } else {
                    sessionQuery.eq("mentee_id", user.id);
                }

                const { data: sessionData } = await sessionQuery.order("scheduled_at", { ascending: true });
                setSessions(sessionData || []);

                // Fetch Pending Requests
                const requestQuery = supabase.from("mentorship_requests").select("*, mentor:profiles!mentor_id(*), mentee:profiles!mentee_id(*)");
                if (isMentor) {
                    requestQuery.eq("mentor_id", user.id).eq("status", "pending");
                } else {
                    requestQuery.eq("mentee_id", user.id);
                }

                const { data: requestData } = await requestQuery.order("created_at", { ascending: false });
                setRequests(requestData || []);

            } catch (err) {
                console.error("Error fetching mentorship data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMentorshipData();
    }, [user, supabase]);

    const handleRequestAction = async (requestId: string, action: 'accepted' | 'declined') => {
        try {
            await supabase
                .from("mentorship_requests")
                .update({ status: action })
                .eq("id", requestId);

            setRequests(prev => prev.filter(r => r.id !== requestId));

            if (action === 'accepted') {
                alert("Request accepted! Please schedule a session.");
                // In a full implementation, this opens a modal to create a mentorship_sessions row
            }
        } catch (err) {
            console.error("Action error:", err);
        }
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Sessions...</div>;
    }

    return (
        <div className="space-y-12 max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between pb-8 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-outfit font-bold tracking-tight">Mentorship Hub</h1>
                    <p className="text-muted-foreground mt-2">Manage your connections, upcoming sessions, and mentor requests.</p>
                </div>
                <Link
                    href="/mentorship"
                    className="px-4 py-2 bg-accent/50 hover:bg-accent border border-border/50 rounded-xl text-sm font-bold transition-all"
                >
                    Find Mentors
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Upcoming Sessions */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-hub-indigo" />
                        Upcoming Sessions
                    </h2>

                    {sessions.length > 0 ? (
                        <div className="space-y-4">
                            {sessions.map(session => (
                                <div key={session.id} className="premium-card p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center text-hub-indigo font-outfit font-bold">
                                            {isMentorView
                                                ? session.mentee?.first_name?.[0]
                                                : session.mentor?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-outfit font-bold text-lg">
                                                {isMentorView
                                                    ? `${session.mentee?.first_name} ${session.mentee?.last_name || ""}`
                                                    : `${session.mentor?.first_name} ${session.mentor?.last_name || ""}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(session.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                <span className="opacity-50">•</span> {session.duration_minutes} mins
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        {session.meeting_url ? (
                                            <a
                                                href={session.meeting_url}
                                                target="_blank"
                                                className="flex-1 md:flex-none px-4 py-2 bg-hub-indigo text-white rounded-xl text-xs font-bold hover:bg-hub-indigo/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-hub-indigo/20"
                                            >
                                                <Video className="w-4 h-4" /> Join Call
                                            </a>
                                        ) : (
                                            <button disabled className="flex-1 md:flex-none px-4 py-2 bg-accent/50 text-muted-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-border/50">
                                                Link Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="premium-card p-12 text-center border-dashed bg-accent/5">
                            <CalendarIcon className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No upcoming sessions</p>
                            <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto">Explore the mentor directory to find a match and schedule your first session.</p>
                        </div>
                    )}
                </div>

                {/* Right Col: Requests Inbox */}
                <div className="space-y-6">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-hub-amber" />
                        {isMentorView ? "Pending Requests" : "My Requests"}
                    </h2>

                    {requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className="premium-card p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-outfit font-bold text-sm">
                                            {isMentorView
                                                ? `${req.mentee?.first_name} ${req.mentee?.last_name || ""}`
                                                : `To: ${req.mentor?.first_name || "Mentor"}`}
                                        </p>
                                        <span className={cn(
                                            "text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border",
                                            req.status === 'pending' ? "bg-hub-amber/10 text-hub-amber border-hub-amber/20" :
                                                req.status === 'accepted' ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20" :
                                                    "bg-hub-rose/10 text-hub-rose border-hub-rose/20"
                                        )}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-accent/30 rounded-xl border border-border/50">
                                        <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-3">"{req.goals}"</p>
                                    </div>

                                    {isMentorView && req.status === 'pending' && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleRequestAction(req.id, 'accepted')}
                                                className="flex-1 py-2 bg-hub-teal/20 text-hub-teal hover:bg-hub-teal hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleRequestAction(req.id, 'declined')}
                                                className="flex-1 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="premium-card p-10 text-center bg-accent/5">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inbox Zero</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
