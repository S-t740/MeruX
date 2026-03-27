"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, ShieldCheck, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
    const supabase = createClient();
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                // Fetch top 50 users by reputation (Students only)
                const { data, error } = await supabase
                    .from('user_reputation')
                    .select('score, rank_tier, profiles!inner(id, first_name, last_name, avatar_url)')
                    .eq('profiles.role', 'student')
                    .order('score', { ascending: false })
                    .limit(50);
                
                if (error) {
                    // Table may not exist yet — silently fall back to empty state
                    setLeaders([]);
                    return;
                }
                setLeaders(data || []);
            } catch {
                // Network or unexpected errors — fall back gracefully
                setLeaders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaders();
    }, [supabase]);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
        if (index === 2) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
        return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    };

    const getTierColor = (tier: string) => {
        switch(tier) {
            case 'Master': return 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10';
            case 'Expert': return 'border-hub-purple/50 text-hub-purple bg-hub-purple/10';
            case 'Innovator': return 'border-hub-teal/50 text-hub-teal bg-hub-teal/10';
            case 'Contributor': return 'border-hub-indigo/50 text-hub-indigo bg-hub-indigo/10';
            default: return 'border-border/50 text-muted-foreground bg-accent/20';
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <Flame className="w-4 h-4" />
                        Platform Ecosystem
                    </div>
                    <h1 className="page-title">Global Leaderboard</h1>
                    <p className="page-description">The most impactful learners, builders, and innovators on the Merux LMS network, ranked by total reputation score.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 animate-pulse">
                    <Trophy className="w-8 h-8 text-hub-indigo opacity-50" />
                </div>
            ) : (
                <div className="premium-card p-0 overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_150px_150px] gap-4 p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 bg-accent/30">
                        <div className="text-center">Rank</div>
                        <div>Innovator</div>
                        <div className="text-center">Tier</div>
                        <div className="text-right pr-6">Reputation</div>
                    </div>
                    
                    <div className="divide-y divide-border/30">
                        {leaders.length > 0 ? leaders.map((leader, idx) => {
                            const profile = leader.profiles || {};
                            const fullName = (profile.first_name ? profile.first_name + " " + (profile.last_name || "") : "Unknown User").trim();
                            return (
                            <a key={profile.id} href={`/portfolio/${profile.id}`} className="grid grid-cols-[80px_1fr_150px_150px] gap-4 p-4 items-center hover:bg-accent/10 transition-colors group cursor-pointer">
                                <div className="flex justify-center items-center">
                                    {getRankIcon(idx)}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent overflow-hidden border border-border/50 shrink-0">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                                {fullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{fullName}</h3>
                                        <p className="text-xs text-muted-foreground text-ellipsis overflow-hidden">@{profile.first_name?.toLowerCase() || profile.id?.split("-")[0]}</p>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border", getTierColor(leader.rank_tier))}>
                                        <ShieldCheck className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                                        {leader.rank_tier}
                                    </span>
                                </div>

                                <div className="text-right pr-6 font-bold text-lg font-outfit flex items-center justify-end gap-1">
                                    {leader.score.toLocaleString()}
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                                </div>
                            </a>
                            );
                        }) : (
                            <div className="p-12 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest">
                                No reputation data yet. Start learning to climb the leaderboard!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
