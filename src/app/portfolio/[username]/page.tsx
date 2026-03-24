"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkillRadar } from "@/components/dashboard/SkillRadar";
import { 
    Briefcase, ShieldCheck, Award, Star, BookOpen, Clock, 
    ArrowUpRight, Github, Code, ExternalLink, Globe 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicPortfolio() {
    const params = useParams();
    const username = params.username as string;
    const supabase = createClient();
    
    // States
    const [profile, setProfile] = useState<any>(null);
    const [reputation, setReputation] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            if (!username) return;

            try {
                // 1. Fetch Profile
                const { data: prof, error: profErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .single();
                
                if (profErr || !prof) throw profErr || new Error("Profile not found");
                setProfile(prof);

                // 2. Fetch parallel data
                const [repRes, skillRes, projRes, badgeRes] = await Promise.all([
                    supabase.from('user_reputation').select('*').eq('user_id', prof.id).single(),
                    supabase.from('user_skills').select('level_score, skills(name, category)').eq('user_id', prof.id),
                    supabase.from('project_ideas').select('*').eq('user_id', prof.id).in('status', ['in_progress', 'completed']),
                    supabase.from('badges').select('*').eq('user_id', prof.id).order('awarded_at', { ascending: false })
                ]);

                if (repRes.data) setReputation(repRes.data);
                
                if (skillRes.data) {
                    const formattedSkills = skillRes.data.map((item: any) => {
                        const s = item.skills as any;
                        const subjectName = Array.isArray(s) ? s[0]?.name : s?.name;
                        return {
                            subject: subjectName || 'Unknown',
                            A: item.level_score || 0,
                            fullMark: 100
                        };
                    });
                    setSkills(formattedSkills);
                }

                if (projRes.data) setProjects(projRes.data);
                if (badgeRes.data) setBadges(badgeRes.data);

            } catch (error) {
                console.error("Error loading portfolio:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [username, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 border-4 border-hub-indigo/20 border-t-hub-indigo rounded-full animate-spin" />
                    <p className="font-bold tracking-widest uppercase text-muted-foreground text-sm">Compiling Portfolio...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-8 text-center">
                <div className="max-w-md space-y-4">
                    <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                    <h1 className="text-3xl font-outfit font-bold">Profile Not Found</h1>
                    <p className="text-muted-foreground">The portfolio you are looking for does not exist or the username is incorrect.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Hero Cover */}
            <div className="h-[30vh] md:h-[40vh] bg-gradient-to-br from-hub-indigo/20 via-background to-hub-purple/20 relative border-b border-border/50">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10 space-y-12">
                
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl border-4 border-background bg-accent overflow-hidden shadow-2xl shrink-0">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-hub-indigo to-hub-purple text-5xl font-bold text-white">
                                {profile.full_name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3 pb-4">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <h1 className="text-4xl md:text-5xl font-outfit font-bold">{profile.full_name}</h1>
                            {reputation?.rank_tier && (
                                <span className="px-4 py-1.5 bg-hub-teal/10 text-hub-teal border border-hub-teal/20 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4" />
                                    {reputation.rank_tier}
                                </span>
                            )}
                        </div>
                        <p className="text-xl text-muted-foreground font-medium">@{profile.username}</p>
                        <p className="text-foreground max-w-2xl">{profile.bio || "Building the future of technology one commit at a time."}</p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            {reputation && (
                                <div className="flex items-center gap-1.5 text-yellow-500 font-bold bg-yellow-500/10 px-4 py-2 rounded-xl">
                                    <Star className="w-5 h-5 fill-yellow-500/20" />
                                    {reputation.score.toLocaleString()} Rep Points
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground font-bold border border-border/50 px-4 py-2 rounded-xl">
                                <Code className="w-5 h-5" /> 
                                {projects.length} Projects
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column (Skill DNA) */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2 mb-6">
                                <Globe className="w-5 h-5 text-hub-indigo" /> 
                                Skill DNA Matrix
                            </h2>
                            {skills.length > 0 ? (
                                <div className="-ml-6">
                                    <SkillRadar data={skills} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm flex items-center gap-2 bg-accent/20 p-4 rounded-xl border border-dashed border-border/50">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    No skills analyzed yet.
                                </p>
                            )}
                            
                            {/* Top Skills Tag Cloud */}
                            {skills.length > 0 && (
                                <div className="pt-6 border-t border-border/50 mt-4 flex flex-wrap gap-2">
                                    {skills.sort((a,b)=>b.A-a.A).slice(0, 5).map((s, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-hub-indigo/10 text-hub-indigo rounded-lg text-xs font-bold border border-hub-indigo/20">
                                            {s.subject}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Badges */}
                        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2 mb-6">
                                <Award className="w-5 h-5 text-hub-rose" /> 
                                Certifications
                            </h2>
                            {badges.length > 0 ? (
                                <div className="space-y-4">
                                    {badges.slice(0, 5).map(badge => (
                                        <div key={badge.id} className="flex gap-4 p-4 rounded-2xl bg-accent/10 hover:bg-accent/30 transition-colors border border-border/50">
                                            <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-hub-rose to-orange-500 p-0.5 shadow-lg shadow-hub-rose/20">
                                                <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                                                    <Award className="w-6 h-6 text-hub-rose" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold font-outfit line-clamp-1">{badge.name}</h4>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm bg-accent/20 p-4 rounded-xl border border-dashed border-border/50">
                                    No certifications earned yet.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Projects) */}
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-3xl font-outfit font-bold flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-hub-teal" />
                            Project Showcase
                        </h2>
                        
                        {projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map((p: any) => (
                                    <div key={p.id} className="bg-card border border-border/50 hover:border-hub-teal/40 rounded-3xl p-6 transition-all group shadow-sm hover:shadow-2xl hover:shadow-hub-teal/5 flex flex-col h-[300px]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                                p.status === 'completed' ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20" : "bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20"
                                            )}>
                                                {p.status === 'completed' ? 'Deployed' : 'In Development'}
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {p.estimated_hours}h Built
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-outfit font-bold mb-3 group-hover:text-hub-teal transition-colors line-clamp-2">{p.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{p.description}</p>
                                        
                                        <div className="pt-6 mt-auto flex justify-between items-center border-t border-border/50">
                                            <div className="text-xs font-bold text-muted-foreground bg-accent px-3 py-1.5 rounded-lg border border-border/50">
                                                {p.difficulty}
                                            </div>
                                            {p.status === 'completed' && (
                                                <button className="flex items-center gap-1.5 text-sm font-bold text-hub-teal hover:underline px-4 py-2 bg-hub-teal/5 rounded-xl transition-colors">
                                                    View Demo <ExternalLink className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-border/50 rounded-3xl p-16 text-center flex flex-col items-center bg-accent/5">
                                <Code className="w-16 h-16 text-muted-foreground/30 mb-6" />
                                <h3 className="font-outfit font-bold text-2xl mb-2">Portfolio is brewing</h3>
                                <p className="text-muted-foreground max-w-sm">This student is currently in the incubator stage, building their first major projects powered by MeruX Innovation Engine.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
