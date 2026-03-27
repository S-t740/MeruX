"use client"

import { useEffect, useState } from "react";
import { Database, Search, FileText, BookmarkPlus, PlusCircle, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResearchHub() {
    const supabase = createClient();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchResearch = async () => {
            try {
                const { data, error } = await supabase
                    .from("research_projects")
                    .select("*, pi:principal_investigator_id(first_name, last_name, department)")
                    .eq("status", "published") // Only show published papers/projects in the public hub
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (err) {
                console.error("Error fetching research:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResearch();
    }, [supabase]);

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.abstract?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Research Repository...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-hub-purple/10 blur-[80px] rounded-full -z-10" />

                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <Database className="w-8 h-8 text-hub-purple" />
                        Research Hub
                    </h1>
                    <p className="page-description max-w-2xl mt-2">Discover, collaborate, and publish academic research and datasets across the Merux LMS ecosystem.</p>
                </div>

                <div className="flex gap-4">
                    <button className="px-5 py-2.5 bg-hub-purple text-white font-bold rounded-xl text-xs hover:bg-hub-purple/90 transition-all flex items-center gap-2 shadow-lg shadow-hub-purple/20">
                        <PlusCircle className="w-4 h-4" /> New Proposal
                    </button>
                    <Link href="/research/my-projects" className="px-5 py-2.5 bg-accent/50 hover:bg-accent border border-border/50 font-bold rounded-xl text-xs transition-all flex items-center gap-2">
                        <FileText className="w-4 h-4" /> My Research
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search papers, abstracts, or researchers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-hub-purple/50 text-sm font-medium shadow-sm transition-all"
                />
            </div>

            {/* Research Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                    <Link
                        href={`/research/${project.id}`}
                        key={project.id}
                        className="premium-card p-6 flex flex-col gap-4 group hover:border-hub-purple/30 transition-all"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-xl font-outfit font-bold group-hover:text-hub-purple transition-colors leading-tight">
                                {project.title}
                            </h2>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/50 text-muted-foreground group-hover:bg-hub-purple/10 group-hover:text-hub-purple shrink-0 transition-colors">
                                <BookmarkPlus className="w-4 h-4" />
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground flex-1 line-clamp-3 leading-relaxed">
                            {project.abstract}
                        </p>

                        <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-hub-purple/10 flex items-center justify-center text-hub-purple font-outfit text-xs font-bold uppercase tracking-widest">
                                    {(project.pi?.first_name?.[0] || "") + (project.pi?.last_name?.[0] || "")}
                                </div>
                                <div>
                                    <p className="text-xs font-bold leading-none">{project.pi?.first_name} {project.pi?.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{project.pi?.department || "Researcher"}</p>
                                </div>
                            </div>

                            <span className="px-3 py-1 bg-accent border border-border/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> {project.field}
                            </span>
                        </div>
                    </Link>
                ))}

                {filteredProjects.length === 0 && (
                    <div className="md:col-span-2 p-16 premium-card border-dashed bg-accent/5 text-center flex flex-col items-center">
                        <Search className="w-8 h-8 text-muted-foreground opacity-20 mb-3" />
                        <p className="text-sm font-bold text-foreground">No Research Found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">We couldn't find any published papers matching your current search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
