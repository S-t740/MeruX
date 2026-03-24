"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Users,
    MessageSquare,
    Calendar,
    ArrowLeft,
    Send,
    Search,
    UserPlus,
    MoreVertical
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function CohortPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [cohort, setCohort] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        const fetchCohortData = async () => {
            try {
                const [cohortRes, membersRes, messagesRes] = await Promise.all([
                    supabase.from("cohorts").select("*").eq("id", id).single(),
                    supabase.from("cohort_members").select("*, profiles(*)").eq("cohort_id", id),
                    supabase.from("messages").select("*, profiles:sender_id(*)").eq("receiver_id", id).order("created_at", { ascending: true }) // Using receiver_id as cohort_id for group chat placeholder
                ]);

                setCohort(cohortRes.data);
                setMembers(membersRes.data || []);
                setMessages(messagesRes.data || []);
            } catch (error) {
                console.error("Error fetching cohort data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCohortData();
    }, [id, supabase]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from("messages")
                .insert({
                    sender_id: user?.id,
                    receiver_id: id, // Cohort UUID
                    content: newMessage
                });

            if (error) throw error;
            setNewMessage("");
            // Refresh logic simplified
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Connecting to Cohort...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <Users className="w-4 h-4" />
                        Cohort Learning
                    </div>
                    <h1 className="page-title">{cohort?.name || "Innovation Batch"}</h1>
                    <p className="page-description">{cohort?.description || "A dedicated group of tech innovators and research collaborators."}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-accent/30 rounded-xl hover:bg-accent/50 transition-all border border-border/50">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20">
                        Join Discussion
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-350px)]">
                {/* Discussion Thread */}
                <div className="lg:col-span-2 premium-card p-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-accent/10 flex items-center justify-between">
                        <h2 className="font-outfit font-bold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-hub-indigo" />
                            Shared Thread
                        </h2>
                        <span className="text-[10px] font-bold text-hub-teal uppercase tracking-widest">Online: 14</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {messages.length > 0 ? (
                            messages.map((msg, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border/50 group-hover:border-hub-indigo/30 transition-colors">
                                        {msg.profiles?.avatar_url ? (
                                            <img src={msg.profiles.avatar_url} alt="" className="w-full h-full rounded-xl" />
                                        ) : (
                                            <span className="font-bold text-hub-indigo">{(msg.profiles?.first_name ? `${msg.profiles?.first_name} ${msg.profiles?.last_name || ''}`.trim() : "")?.charAt(0) || "U"}</span>
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold font-outfit">{(msg.profiles?.first_name ? `${msg.profiles?.first_name} ${msg.profiles?.last_name || ''}`.trim() : "") || "Innovator"}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">12:45 PM</span>
                                        </div>
                                        <div className="premium-card p-4 bg-accent/30 rounded-2xl rounded-tl-none border-border/30 text-sm leading-relaxed">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <MessageSquare className="w-12 h-12 text-muted-foreground" />
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Start the conversation</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-border/50 bg-accent/10">
                        <div className="relative flex items-center gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write to the group..."
                                className="flex-1 bg-background border border-border/50 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium shadow-inner"
                            />
                            <button
                                onClick={sendMessage}
                                className="w-14 h-14 bg-hub-indigo text-white rounded-2xl flex items-center justify-center hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 active:scale-95 shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Members & Activity */}
                <div className="space-y-6 flex flex-col">
                    <div className="premium-card flex-1 flex flex-col overflow-hidden p-0">
                        <div className="p-6 border-b border-border/50 bg-accent/10 flex items-center justify-between">
                            <h2 className="font-outfit font-bold flex items-center gap-2">
                                <Users className="w-4 h-4 text-hub-indigo" />
                                Members
                            </h2>
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                                <Search className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                            {members.map((member, i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-xl transition-all group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-accent border border-border/50 flex items-center justify-center font-bold text-xs">
                                                {(member.profiles?.first_name ? `${member.profiles?.first_name} ${member.profiles?.last_name || ''}`.trim() : "")?.charAt(0) || "U"}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-hub-teal border-2 border-background rounded-full shadow-sm" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold font-outfit truncate w-32 group-hover:text-hub-indigo transition-colors">{(member.profiles?.first_name ? `${member.profiles?.first_name} ${member.profiles?.last_name || ''}`.trim() : "") || "Team Member"}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{member.role}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-border/50 bg-accent/10">
                            <button className="w-full py-3 bg-accent text-muted-foreground hover:text-foreground border border-border/50 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Invite Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
