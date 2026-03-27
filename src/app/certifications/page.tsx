"use client"

import { useEffect, useState } from "react";
import { Award, ShieldCheck, Download, ExternalLink, Calendar, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

export default function CertificationsPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [certifications, setCertifications] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Map badge name → image path
    const BADGE_MAP: Record<string, { img: string; color: string; desc: string }> = {
        "Module Master": { img: "/badges/badge_module_master.png", color: "text-hub-indigo", desc: "Passed a module knowledge check" },
        "Course Completed": { img: "/badges/badge_course_completed.png", color: "text-hub-teal", desc: "Finished an entire course" },
        "Knowledge Champion": { img: "/badges/badge_knowledge_champion.png", color: "text-hub-rose", desc: "Top performer across quizzes" },
    };

    useEffect(() => {
        const fetchCredentials = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Fetch User Certifications
                const { data: certData } = await supabase
                    .from("user_certifications")
                    .select("*, certifications(*)")
                    .eq("user_id", user.id)
                    .order("issued_at", { ascending: false });

                setCertifications(certData || []);

                // Fetch User Badges
                const { data: badgeData } = await supabase
                    .from("badges")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("awarded_at", { ascending: false });

                setBadges(badgeData || []);
            } catch (error) {
                console.error("Error fetching credentials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [user, supabase]);

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Wallet...</div>;
    }

    return (
        <div className="space-y-12">
            <div className="page-header">
                <h1 className="page-title">Credential Wallet</h1>
                <p className="page-description">Manage and share your verifiable certificates and skill badges earned on the Merux LMS platform.</p>
            </div>

            {/* Badges Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-hub-teal" />
                        Skill Badges
                    </h2>
                    <span className="text-xs font-bold bg-accent/50 px-3 py-1 rounded-full uppercase tracking-widest">{badges.length} Earned</span>
                </div>

                {badges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {badges.map((b) => {
                            const meta = BADGE_MAP[b.name] || { img: null, color: "text-hub-teal", desc: b.description || "" };
                            // Extract color class (e.g., text-hub-indigo -> bg-hub-indigo) for the glow
                            const colorGlow = meta.color.replace('text-', 'bg-');

                            return (
                                <div key={b.id} className="premium-card p-6 flex flex-col items-center justify-center text-center space-y-5 hover:-translate-y-2 transition-transform duration-500 group" title={meta.desc}>
                                    {meta.img ? (
                                        <div className="relative w-28 h-28 flex items-center justify-center -mt-2">
                                            {/* Glowing aura effect behind the badge */}
                                            <div className={cn("absolute inset-0 opacity-20 blur-2xl rounded-full scale-150 group-hover:scale-175 group-hover:opacity-30 transition-all duration-500", colorGlow)} />
                                            {/* Badge Image */}
                                            <img src={meta.img} alt={b.name} className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    ) : (
                                        <div className="w-28 h-28 rounded-full bg-hub-teal/10 flex items-center justify-center border border-hub-teal/20 shadow-xl shadow-hub-teal/10">
                                            <Award className="w-12 h-12 text-hub-teal" />
                                        </div>
                                    )}
                                    <div className="space-y-1 w-full">
                                        <p className={cn("font-outfit font-bold text-base leading-tight", meta.color)}>{b.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(b.awarded_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 premium-card border-dashed bg-accent/10 text-center">
                        <Award className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-2" />
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">No badges earned yet</p>
                    </div>
                )}
            </div>

            {/* Certifications Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-hub-indigo" />
                    Official Certifications
                </h2>

                {certifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certifications.map((uc) => (
                            <div key={uc.id} className="premium-card overflow-hidden group">
                                <div className="h-32 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 border-b border-border/50 relative p-6 flex flex-col justify-end">
                                    <div className="absolute top-4 right-4">
                                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-hub-indigo" />
                                        </div>
                                    </div>
                                    <h3 className="font-outfit font-bold text-xl text-foreground group-hover:text-hub-indigo transition-colors">{uc.certifications?.name}</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Issued</p>
                                                <p className="font-medium">{new Date(uc.issued_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        {uc.expires_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Expires</p>
                                                    <p className="font-medium">{new Date(uc.expires_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-border/50">
                                        {uc.credential_url && (
                                            <a
                                                href={uc.credential_url}
                                                target="_blank"
                                                className="flex-1 px-4 py-2 bg-hub-indigo text-white rounded-xl text-xs font-bold text-center hover:bg-hub-indigo/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                View Credential <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        <button className="px-4 py-2 bg-accent/50 hover:bg-accent rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-border/50">
                                            <Download className="w-3 h-3" /> PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 premium-card border-dashed bg-accent/10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg mb-1">No Certifications Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">Complete courses, projects, and cohorts to earn verifiable credentials.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
