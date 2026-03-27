"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Microscope,
    FileText,
    Users,
    Plus,
    Search,
    ShieldCheck,
    BookOpen,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResearcherDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [proposals, setProposals] = useState<any[]>([]);
    const [stats, setStats] = useState({ collaborations: 0, publishedOutputs: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResearchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from("research_projects")
                    .select("*")
                    .eq("principal_investigator_id", user.id);

                if (error) throw error;
                const projectRows = data || [];
                setProposals(projectRows);

                const projectIds = projectRows.map((project: any) => project.id);
                if (projectIds.length > 0) {
                    const [membersRes, publicationsRes] = await Promise.all([
                        supabase.from("research_members").select("project_id, user_id").in("project_id", projectIds),
                        supabase.from("research_publications").select("id").in("research_id", projectIds),
                    ]);

                    const memberIds = new Set(
                        (membersRes.data || [])
                            .map((member: any) => member.user_id)
                            .filter((memberId: string) => memberId !== user.id)
                    );

                    setStats({
                        collaborations: memberIds.size,
                        publishedOutputs: (publicationsRes.data || []).length,
                    });
                } else {
                    setStats({ collaborations: 0, publishedOutputs: 0 });
                }
            } catch (error) {
                console.error("Error fetching research data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResearchData();
    }, [supabase]);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-teal uppercase tracking-widest mb-2">
                        <Microscope className="w-4 h-4" />
                        Research Hub
                    </div>
                    <h1 className="page-title">Principal Workspace</h1>
                    <p className="page-description">Manage your research proposals, coordinate with teams, and track institutional review board approvals.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-hub-teal text-white rounded-xl font-bold hover:bg-hub-teal/90 transition-all text-sm shadow-xl shadow-hub-teal/20 active:scale-95 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Submit Proposal
                    </button>
                </div>
            </div>

            {/* Research Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Projects", value: proposals.length, icon: Microscope, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Team Collaborations", value: stats.collaborations, icon: Users, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Published Outputs", value: stats.publishedOutputs, icon: TrendingUp, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-8 flex flex-col justify-between h-36">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <p className="text-3xl font-outfit font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-hub-teal" />
                        My Propositions
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search research..."
                                className="bg-accent/30 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-hub-teal transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {proposals.length > 0 ? (
                        proposals.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/research/${project.id}`)}
                                className="premium-card p-8 group hover:border-hub-teal/30 transition-all cursor-pointer space-y-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider inline-block",
                                            project.status === 'published' ? "bg-hub-teal/10 text-hub-teal" : "bg-hub-amber/10 text-hub-amber"
                                        )}>
                                            {project.status || 'Draft'}
                                        </div>
                                        <h3 className="text-xl font-outfit font-bold group-hover:text-hub-teal transition-colors">{project.title}</h3>
                                        <p className="text-sm text-muted-foreground font-medium line-clamp-2">{project.description}</p>
                                    </div>
                                    <ShieldCheck className="w-5 h-5 text-muted-foreground opacity-30 group-hover:text-hub-teal group-hover:opacity-100 transition-all" />
                                </div>

                                <div className="pt-4 flex justify-between items-center border-t border-border/30">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-accent border border-background flex items-center justify-center font-bold text-[8px]">U</div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">+4 Collaborators</span>
                                    </div>
                                    <button className="text-xs font-bold text-hub-teal flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Workspace <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full premium-card p-20 text-center border-dashed bg-accent/10 border-border flex flex-col items-center justify-center space-y-4">
                            <BookOpen className="w-12 h-12 text-muted-foreground opacity-20" />
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No Active Proposals</p>
                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Your academic journey starts here.</p>
                            </div>
                            <button className="mt-4 px-6 py-3 bg-hub-teal text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-hub-teal/20 active:scale-95 transition-all">
                                Create New Proposal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
