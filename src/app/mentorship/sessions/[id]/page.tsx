"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Users,
    Calendar,
    Clock,
    FileText,
    ArrowLeft,
    Save,
    MessageSquare,
    Video,
    UserCircle,
    CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function MentorshipSessionPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const { data, error } = await supabase
                    .from("mentorship_sessions")
                    .select("*, mentor:profiles!mentor_id(*), mentee:profiles!mentee_id(*)")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setSession(data);
                setNotes(data.notes || "");
            } catch (error) {
                console.error("Error fetching session data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSessionData();
    }, [id, supabase]);

    const saveNotes = async () => {
        try {
            const { error } = await supabase
                .from("mentorship_sessions")
                .update({ notes: notes })
                .eq("id", id);

            if (error) throw error;
            alert("Notes saved successfully!");
        } catch (error) {
            console.error("Error saving notes:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Accessing Session Portal...</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <button
                onClick={() => router.push('/mentorship')}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-hub-amber transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Mentorship Center
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-hub-amber flex items-center justify-center text-white shadow-xl shadow-hub-amber/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-outfit font-bold tracking-tight">Mentorship Session</h1>
                            <p className="text-muted-foreground font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(session?.scheduled_at).toLocaleDateString()} at {new Date(session?.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-hub-amber text-white rounded-xl font-bold hover:bg-hub-amber/90 transition-all text-sm shadow-xl shadow-hub-amber/20 flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Join Call
                    </button>
                    <button className="p-3 bg-accent/30 rounded-xl hover:bg-accent/50 transition-all border border-border/50">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Session Notes */}
                    <div className="premium-card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-hub-amber" />
                                Session Overview & Notes
                            </h2>
                            <button
                                onClick={saveNotes}
                                className="flex items-center gap-2 text-xs font-bold text-hub-amber hover:underline"
                            >
                                <Save className="w-3 h-3" /> Save Changes
                            </button>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Document discussion points, goals, and action items here..."
                            rows={15}
                            className="w-full bg-accent/30 border border-border/50 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-hub-amber/50 font-medium leading-relaxed"
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Participants */}
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-hub-amber" />
                            Participants
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center font-bold text-hub-indigo">
                                    {(session?.mentor?.first_name ? `${session?.mentor?.first_name} ${session?.mentor?.last_name || ''}`.trim() : "")?.charAt(0) || "M"}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Mentor</p>
                                    <p className="text-sm font-bold font-outfit">{(session?.mentor?.first_name ? `${session?.mentor?.first_name} ${session?.mentor?.last_name || ''}`.trim() : "") || "Expert Guide"}</p>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-hub-teal" />
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                                <div className="w-12 h-12 rounded-xl bg-hub-rose/10 flex items-center justify-center font-bold text-hub-rose">
                                    {(session?.mentee?.first_name ? `${session?.mentee?.first_name} ${session?.mentee?.last_name || ''}`.trim() : "")?.charAt(0) || "S"}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Mentee</p>
                                    <p className="text-sm font-bold font-outfit">{(session?.mentee?.first_name ? `${session?.mentee?.first_name} ${session?.mentee?.last_name || ''}`.trim() : "") || "Nexus Scholar"}</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-hub-amber animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Specs */}
                    <div className="premium-card p-8 space-y-4 bg-accent/10 border-hub-amber/20">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-hub-amber" />
                            <h3 className="font-outfit font-bold">Session Details</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Duration</span>
                                <span className="font-bold text-foreground">{session?.duration_minutes || 60} Minutes</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Platform</span>
                                <span className="font-bold text-foreground">Nexus Video Core</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Status</span>
                                <span className="font-bold text-hub-amber capitalize">{session?.status || "scheduled"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
