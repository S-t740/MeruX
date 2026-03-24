"use client"

import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

const EVENT_TYPE_COLORS: Record<string, string> = {
    Research: "bg-hub-teal/10 text-hub-teal border-hub-teal/20",
    Incubator: "bg-hub-amber/10 text-hub-amber border-hub-amber/20",
    Workshop: "bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20",
    Seminar: "bg-hub-rose/10 text-hub-rose border-hub-rose/20",
    Other: "bg-accent/50 text-muted-foreground border-border/50",
};

export default function EventsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [registered, setRegistered] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*, organizer:profiles!organizer_id(first_name, last_name)")
                    .order("start_time", { ascending: true });

                if (!error && data && data.length > 0) {
                    setEvents(data);
                } else {
                    // Fallback demo data when DB has no events
                    setEvents([
                        { id: "demo-1", title: "AI Research Symposium", start_time: "2026-03-20T09:00:00Z", end_time: "2026-03-20T16:00:00Z", location: "Meru Innovation Hall", description: "Annual research showcase featuring machine learning and AI innovations.", type: "Research" },
                        { id: "demo-2", title: "Startup Pitch Night", start_time: "2026-03-28T18:00:00Z", end_time: "2026-03-28T21:00:00Z", location: "Auditorium B", description: "Present your startup to a panel of investors and industry experts.", type: "Incubator" },
                        { id: "demo-3", title: "Full-Stack Bootcamp Kickoff", start_time: "2026-04-03T08:30:00Z", end_time: "2026-04-03T12:00:00Z", location: "Lab 4", description: "Hands-on bootcamp covering React, Node.js, and Supabase integration.", type: "Workshop" },
                        { id: "demo-4", title: "Ethics in Technology Seminar", start_time: "2026-04-10T14:00:00Z", end_time: "2026-04-10T16:30:00Z", location: "Conference Room A", description: "Exploring responsible AI development and institutional ethics frameworks.", type: "Seminar" },
                        { id: "demo-5", title: "Innovation Hub Open Day", start_time: "2026-04-20T10:00:00Z", end_time: "2026-04-20T17:00:00Z", location: "MTIH Campus", description: "Open exploration of all incubation labs, research centers, and student projects.", type: "Other" },
                    ]);
                }
            } catch (err) {
                console.error("Error fetching events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [supabase]);

    const handleRegister = async (eventId: string) => {
        if (!user) { alert("Please log in to register for events."); return; }
        setRegistering(eventId);
        try {
            // Mark as registered (in a real app you'd insert into an event_registrations table)
            await new Promise(r => setTimeout(r, 800)); // Simulate API call
            setRegistered(prev => new Set([...prev, eventId]));
        } finally {
            setRegistering(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const formatTime = (start: string, end: string) => {
        const s = new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const e = new Date(end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        return `${s} – ${e}`;
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading upcoming events...</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Hub Events</h1>
                    <p className="page-description">Institutional seminars, workshops, pitch nights, and collaborative sessions.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-accent/30 px-4 py-2 rounded-xl border border-border/50">
                    <Calendar className="w-4 h-4" />
                    {events.length} Upcoming
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                    const type = event.type || "Other";
                    const colorClass = EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS["Other"];
                    const isRegistered = registered.has(event.id);
                    const isRegistering = registering === event.id;

                    return (
                        <div key={event.id} className="premium-card p-6 space-y-4 group cursor-pointer flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border", colorClass)}>
                                    {type}
                                </span>
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h2 className="font-outfit font-bold text-lg group-hover:text-hub-indigo transition-colors leading-tight">
                                    {event.title}
                                </h2>
                                {event.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
                                )}
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-hub-indigo shrink-0" />
                                    <span className="text-xs">{formatDate(event.start_time)} · {formatTime(event.start_time, event.end_time)}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-hub-rose shrink-0" />
                                        <span className="text-xs">{event.location}</span>
                                    </div>
                                )}
                                {(event.organizer?.first_name ? `${event.organizer?.first_name} ${event.organizer?.last_name || ''}`.trim() : "") && (
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        Organizer: {(event.organizer.first_name ? `${event.organizer.first_name} ${event.organizer.last_name || ''}`.trim() : "")}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleRegister(event.id)}
                                disabled={isRegistered || isRegistering}
                                className={cn(
                                    "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                    isRegistered
                                        ? "bg-hub-teal/10 text-hub-teal border border-hub-teal/20 cursor-default"
                                        : "bg-hub-indigo/10 text-hub-indigo hover:bg-hub-indigo hover:text-white active:scale-95"
                                )}
                            >
                                {isRegistering ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isRegistered ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Registered</>
                                ) : (
                                    "Register →"
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
