"use client"

import { useEffect, useState } from "react";
import { Search, MapPin, GraduationCap, Clock, MessageSquare, Star, Loader2, Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

export default function MentorshipPlatform() {
    const supabase = createClient();
    const { user } = useAuth();
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [requestingId, setRequestingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const { data, error } = await supabase
                    .from("mentor_profiles")
                    .select("*, profiles!user_id(*)")
                    .order("created_at", { ascending: false });

                if (error) console.error("Error fetching mentors:", error);

                // Demo data fallback if no mentors exist yet
                if (!data || data.length === 0) {
                    setMentors([
                        {
                            id: "demo-1",
                            user_id: "demo-user-1",
                            expertise_areas: ["AI/ML", "Software Engineering", "Startup Strategy"],
                            profiles: { first_name: "Dr. Jane", last_name: "Doe", department: "Computer Science", bio: "Former Google Engineer, now leading AI research at MeruX." }
                        },
                        {
                            id: "demo-2",
                            user_id: "demo-user-2",
                            expertise_areas: ["Product Management", "UI/UX", "Agile"],
                            profiles: { first_name: "John", last_name: "Smith", department: "Innovation Hub", bio: "10+ years launching successful tech products across Africa." }
                        }
                    ]);
                } else {
                    setMentors(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();
    }, [supabase]);

    const requestMentorship = async (mentorId: string) => {
        if (!user) {
            alert("Please log in to request mentorship.");
            return;
        }

        if (mentorId.startsWith("demo-")) {
            alert("This is a demo mentor. Cannot send request.");
            return;
        }

        setRequestingId(mentorId);
        try {
            const { error } = await supabase
                .from("mentorship_requests")
                .insert({
                    mentor_id: mentorId,
                    mentee_id: user.id,
                    goals: "I would like to connect and learn from your expertise." // Simplified for MVP UI
                });

            if (error) throw error;
            alert("Mentorship request sent successfully!");
        } catch (err: any) {
            console.error("Request error:", err);
            alert("Failed to send request. " + err.message);
        } finally {
            setRequestingId(null);
        }
    };

    const filteredMentors = mentors.filter(m => {
        const mentorName = m.profiles?.first_name ? `${m.profiles.first_name} ${m.profiles.last_name || ''}`.trim() : "";
        const nameMatch = mentorName.toLowerCase().includes(searchTerm.toLowerCase());
        const skillMatch = m.expertise_areas?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
        return nameMatch || skillMatch;
    });

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Mentor Directory...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="page-title">Mentorship Directory</h1>
                    <p className="page-description">Connect with industry experts, researchers, and innovators to accelerate your growth.</p>
                </div>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or expertise (e.g. AI, Product)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-accent/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 text-sm font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMentors.map((mentor) => (
                    <div key={mentor.id} className="premium-card p-6 flex flex-col sm:flex-row gap-6 hover:border-hub-indigo/30 transition-colors group">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 flex items-center justify-center border border-hub-indigo/20 shadow-lg shadow-hub-indigo/10 shrink-0">
                                <span className="font-outfit font-bold text-2xl text-hub-indigo flex gap-[2px]">
                                    {(mentor.profiles?.first_name?.substring(0, 1).toUpperCase() || "M")}
                                    {(mentor.profiles?.last_name?.substring(0, 1).toUpperCase() || "")}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-hub-amber">
                                <Star className="w-3 h-3 fill-hub-amber" /> 5.0
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-xl font-outfit font-bold group-hover:text-hub-indigo transition-colors flex items-center gap-2">
                                    {mentor.profiles?.first_name ? `${mentor.profiles.first_name} ${mentor.profiles.last_name || ''}`.trim() : "Innovation Mentor"}
                                    {mentor.profiles?.department === 'Innovation Hub' && (
                                        <span className="p-1 bg-hub-rose/10 rounded-md" title="Innovation Hub Mentor">
                                            <Rocket className="w-3.5 h-3.5 text-hub-rose" />
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-2">
                                    {mentor.profiles?.bio || "Experienced professional ready to mentor."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {mentor.expertise_areas?.map((skill: string) => (
                                    <span key={skill} className="px-2.5 py-1 rounded-md bg-accent border border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-border/50 flex flex-wrap gap-3">
                                <button
                                    onClick={() => requestMentorship(mentor.user_id || mentor.id)} /* Use user_id for the FK, fallback to id for demo */
                                    disabled={requestingId === (mentor.user_id || mentor.id) || !user}
                                    className="px-6 py-2.5 bg-hub-indigo text-white font-bold rounded-xl text-xs hover:bg-hub-indigo/90 transition-all flex items-center gap-2 shadow-lg shadow-hub-indigo/20 disabled:opacity-50"
                                >
                                    {requestingId === (mentor.user_id || mentor.id) ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                                    ) : (
                                        <><GraduationCap className="w-4 h-4" /> Request Mentorship</>
                                    )}
                                </button>
                                <button className="px-4 py-2.5 bg-accent/50 hover:bg-accent border border-border/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Message
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredMentors.length === 0 && (
                    <div className="lg:col-span-2 p-12 premium-card border-dashed bg-accent/10 text-center">
                        <GraduationCap className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-2" />
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">No mentors match your search criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
