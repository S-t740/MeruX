"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardCheck,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    MessageSquare,
    ArrowRight,
    Star
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ReviewerDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from("research_projects")
                    .select("*, profiles:principal_investigator_id(*)")
                    .neq("principal_investigator_id", user.id) // Placeholder for assigned reviews
                    .limit(5);

                if (error) throw error;
                setAssignments(data || []);
            } catch (error) {
                console.error("Error fetching review data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewData();
    }, [supabase]);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <ClipboardCheck className="w-4 h-4" />
                        Peer Assessment
                    </div>
                    <h1 className="page-title">Reviewer Workspace</h1>
                    <p className="page-description">Critique institutional research, provide constructive feedback, and validate technical project milestones.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-accent/30 rounded-xl border border-border/50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-3 h-3 text-hub-amber" />
                        Senior Reviewer
                    </div>
                </div>
            </div>

            {/* Workload Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Assigned Proposals", value: "8", icon: FileText, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Completed Reviews", value: "24", icon: CheckCircle2, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Avg. Review Time", value: "3.2d", icon: Clock, color: "text-hub-rose", bg: "bg-hub-rose/10" },
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
                        <AlertCircle className="w-5 h-5 text-hub-amber" />
                        Pending Evaluations
                    </h2>
                    <div className="flex bg-accent/30 rounded-lg p-1">
                        <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-background rounded shadow-sm">Assigned</button>
                        <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Archive</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {assignments.map((project) => (
                        <div key={project.id} className="premium-card p-8 group hover:border-hub-indigo/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-hub-amber animate-pulse" />
                                        <p className="text-[9px] font-bold text-hub-amber uppercase tracking-widest">Awaiting Initial Critique</p>
                                    </div>
                                    <h3 className="text-xl font-outfit font-bold group-hover:text-hub-indigo transition-colors">{project.title}</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Principal: <span className="text-foreground">{(project.profiles?.first_name ? `${project.profiles?.first_name} ${project.profiles?.last_name || ''}`.trim() : "")}</span></p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <Clock className="w-3 h-3" /> Due in 2 days
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <MessageSquare className="w-3 h-3" /> 0 Feedback Threads
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="px-6 py-3 bg-accent/50 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent transition-all border border-border/50">
                                    Abstract
                                </button>
                                <button className="px-8 py-3 bg-hub-indigo text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 flex items-center gap-2">
                                    Start Review <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
