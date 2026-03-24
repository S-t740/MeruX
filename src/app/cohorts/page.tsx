"use client"

import { useEffect, useState, useRef } from "react";
import { Users, Calendar, MessageSquare, ArrowUpRight, Loader2, Send, Clock, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

export default function CohortManagement() {
    const supabase = createClient();
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [activeCohort, setActiveCohort] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [sharedDeadlines, setSharedDeadlines] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCohorts();
    }, [user]);

    useEffect(() => {
        if (activeCohort) {
            loadCohortDetails(activeCohort.id);
        }
    }, [activeCohort]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadCohorts = async () => {
        try {
            if (!user) { setLoading(false); return; }
            // Get cohorts the user belongs to
            const { data: memberRows } = await supabase
                .from("cohort_members")
                .select("cohort_id, cohorts(*)")
                .eq("user_id", user.id);

            const userCohorts = memberRows?.map((r: any) => r.cohorts).filter(Boolean) || [];

            if (userCohorts.length > 0) {
                setCohorts(userCohorts);
                setActiveCohort(userCohorts[0]);
            } else {
                // Fallback: show all cohorts if not a member of any
                const { data: allCohorts } = await supabase
                    .from("cohorts")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(5);
                setCohorts(allCohorts || []);
                if (allCohorts && allCohorts.length > 0) setActiveCohort(allCohorts[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCohortDetails = async (cohortId: string) => {
        // Load members
        const { data: memberData } = await supabase
            .from("cohort_members")
            .select("*, profiles(*)")
            .eq("cohort_id", cohortId)
            .limit(20);
        setMembers(memberData || []);

        // Load messages (using notifications table as group announcements proxy)
        const { data: msgData } = await supabase
            .from("notifications")
            .select("*, profiles!user_id(first_name, last_name)")
            .eq("type", `cohort_${cohortId}`)
            .order("created_at", { ascending: true })
            .limit(50);
        setMessages(msgData || []);

        // Load shared deadlines from assignments in enrolled courses
        const { data: deadlineData } = await supabase
            .from("assignments")
            .select("*, courses(title)")
            .gte("due_date", new Date().toISOString())
            .order("due_date")
            .limit(5);
        setSharedDeadlines(deadlineData || []);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !activeCohort) return;
        setSendingMsg(true);
        try {
            // Store as notification of type cohort_{id}
            const { data, error } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    title: user.email || "Member",
                    message: newMessage.trim(),
                    type: `cohort_${activeCohort.id}`,
                    is_read: true,
                })
                .select("*, profiles!user_id(first_name, last_name)")
                .single();

            if (!error && data) {
                setMessages(prev => [...prev, data]);
                setNewMessage("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground text-xs uppercase tracking-widest">Loading cohort data...</div>;
    }

    if (cohorts.length === 0) {
        return (
            <div className="space-y-8">
                <div className="page-header">
                    <h1 className="page-title">Your Cohorts</h1>
                    <p className="page-description">Collaborate with your peers and track collective milestones.</p>
                </div>
                <div className="premium-card p-20 text-center border-dashed bg-accent/10">
                    <Users className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No cohorts found</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">You haven't been assigned to a cohort yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="page-title">Your Cohorts</h1>
                <p className="page-description">Collaborate with your peers and track collective milestones in your learning journey.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Cohort Details */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="premium-card overflow-hidden">
                        <div className="px-6 py-4 bg-hub-indigo/10 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-hub-indigo flex items-center justify-center text-white shadow-lg shadow-hub-indigo/20">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-outfit font-bold">{activeCohort?.name}</h2>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        Active Cohort • {members.length} Members
                                    </p>
                                </div>
                            </div>
                            {cohorts.length > 1 && (
                                <div className="flex gap-2">
                                    {cohorts.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setActiveCohort(c)}
                                            className={cn(
                                                "text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                                                activeCohort?.id === c.id
                                                    ? "bg-hub-indigo text-white"
                                                    : "text-hub-indigo hover:bg-hub-indigo/10"
                                            )}
                                        >
                                            {c.name.split(" ")[0]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {activeCohort?.description && (
                                <p className="text-sm text-muted-foreground">{activeCohort.description}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {activeCohort?.start_date && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Start Date</p>
                                        <p className="font-outfit font-bold text-sm">{new Date(activeCohort.start_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {activeCohort?.end_date && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">End Date</p>
                                        <p className="font-outfit font-bold text-sm">{new Date(activeCohort.end_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Members</p>
                                    <p className="font-outfit font-bold text-sm">{members.length} enrolled</p>
                                </div>
                                {activeCohort?.start_date && activeCohort?.end_date && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Duration</p>
                                        <p className="font-outfit font-bold text-sm">
                                            {Math.round((new Date(activeCohort.end_date).getTime() - new Date(activeCohort.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Shared Deadlines */}
                            {sharedDeadlines.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-hub-rose flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Shared Deadlines</h3>
                                    <div className="space-y-2">
                                        {sharedDeadlines.map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 bg-hub-rose/5 border border-hub-rose/10 rounded-xl">
                                                <div>
                                                    <p className="text-xs font-bold font-outfit">{d.title}</p>
                                                    <p className="text-[10px] text-muted-foreground">{d.courses?.title}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-hub-rose uppercase tracking-widest">{new Date(d.due_date).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Member List */}
                            {members.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cohort Members</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {members.slice(0, 12).map((m: any) => (
                                            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-accent/30 rounded-lg border border-border/50 text-xs font-medium">
                                                <div className="w-5 h-5 rounded-full bg-hub-indigo/20 flex items-center justify-center text-[9px] font-bold text-hub-indigo uppercase">
                                                    {(m.profiles?.first_name ? `${m.profiles?.first_name} ${m.profiles?.last_name || ''}`.trim() : "")?.[0] || "?"}
                                                </div>
                                                {(m.profiles?.first_name ? `${m.profiles?.first_name} ${m.profiles?.last_name || ''}`.trim() : "") || "Member"}
                                            </div>
                                        ))}
                                        {members.length > 12 && (
                                            <div className="px-3 py-1.5 bg-accent/20 rounded-lg border border-border/50 text-xs text-muted-foreground">+{members.length - 12} more</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Discussion */}
                <div className="space-y-6">
                    <div className="premium-card p-6 space-y-4 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between">
                            <h3 className="font-outfit font-bold">Cohort Discussion</h3>
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {messages.length > 0 ? messages.map((msg: any) => (
                                <div key={msg.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-hub-indigo">
                                            {(msg.profiles?.first_name ? `${msg.profiles?.first_name} ${msg.profiles?.last_name || ''}`.trim() : "") || msg.title || "Member"}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-xl rounded-tl-none border border-border/50 text-xs leading-relaxed",
                                        msg.user_id === user?.id ? "bg-hub-indigo/10 border-hub-indigo/20" : "bg-accent/30"
                                    )}>
                                        {msg.message}
                                    </div>
                                </div>
                            )) : (
                                <div className="flex-1 flex items-center justify-center text-center">
                                    <div>
                                        <MessageSquare className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="flex gap-2 border-t border-border/50 pt-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask your cohort..."
                                disabled={!user}
                                className="flex-1 bg-accent/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sendingMsg || !newMessage.trim()}
                                className="p-2 bg-hub-indigo text-white rounded-xl hover:bg-hub-indigo/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
