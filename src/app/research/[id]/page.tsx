"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Database, FileText, Download, Globe, Users, Calendar, Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResearchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [project, setProject] = useState<any>(null);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [publications, setPublications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                // Fetch Research Project
                const { data: projectData, error: projError } = await supabase
                    .from("research_projects")
                    .select("*, pi:principal_investigator_id(*)")
                    .eq("id", id)
                    .single();

                if (projError) throw projError;

                setProject(projectData);

                const [dsRes, pubRes] = await Promise.all([
                    supabase.from("research_datasets").select("*").eq("research_id", id),
                    supabase.from("research_publications").select("*").eq("research_id", id)
                ]);

                setDatasets(dsRes.data || []);
                setPublications(pubRes.data || []);
            } catch (err) {
                console.error("Error fetching research details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, supabase]);

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Loading Research Profile...</div>;
    }

    if (!project) {
        return <div className="p-12 text-center text-muted-foreground font-bold">Research not found.</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Repository
            </button>

            <div className="space-y-6 border-b border-border/50 pb-8">
                <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-hub-purple/10 text-hub-purple border border-hub-purple/20 rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                        <Globe className="w-3 h-3" /> {project.field}
                    </span>
                    <span className="px-3 py-1 bg-accent border border-border/50 text-muted-foreground rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Published {new Date(project.created_at).getFullYear()}
                    </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-outfit font-bold tracking-tight">{project.title}</h1>

                <div className="flex items-center gap-4 pt-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-hub-purple/20 to-hub-indigo/20 flex items-center justify-center font-outfit font-bold text-hub-purple border border-hub-purple/20 shadow-lg shadow-hub-purple/10">
                        {(project.pi?.first_name?.[0] || "") + (project.pi?.last_name?.[0] || "")}
                    </div>
                    <div>
                        <p className="font-outfit font-bold">{project.pi?.first_name} {project.pi?.last_name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Principal Investigator • {project.pi?.department}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Abstract & Pubs */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-outfit font-bold">Abstract</h2>
                        <div className="premium-card p-6 bg-accent/5 leading-relaxed text-muted-foreground">
                            {project.abstract}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-hub-purple" /> Related Publications
                        </h2>
                        {publications.length > 0 ? (
                            <div className="space-y-3">
                                {publications.map(pub => (
                                    <div key={pub.id} className="premium-card p-5 hover:border-hub-purple/30 transition-colors flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-outfit font-bold text-sm">{pub.title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">{pub.journal} • {new Date(pub.publication_date).getFullYear()}</p>
                                        </div>
                                        <a href={pub.url} target="_blank" className="px-4 py-2 bg-hub-purple/10 text-hub-purple hover:bg-hub-purple hover:text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap">
                                            Read Paper
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 premium-card border-dashed bg-accent/5 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                No publications linked yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Datasets & Team */}
                <div className="space-y-8">
                    <div className="premium-card p-6 space-y-4 bg-hub-purple/5 border-hub-purple/10">
                        <h2 className="font-outfit font-bold flex items-center gap-2">
                            <Database className="w-5 h-5 text-hub-purple" /> Open Datasets
                        </h2>
                        {datasets.length > 0 ? (
                            <div className="space-y-3">
                                {datasets.map(ds => (
                                    <div key={ds.id} className="p-4 bg-white/50 dark:bg-black/50 border border-border/50 rounded-xl space-y-3">
                                        <div className="flex items-start justify-between">
                                            <p className="font-outfit font-bold text-sm w-4/5 truncate" title={ds.title}>{ds.title}</p>
                                            {ds.visibility === 'public' ? <Unlock className="w-4 h-4 text-hub-teal" /> : <Lock className="w-4 h-4 text-hub-amber" />}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{ds.visibility} ACCESS</span>
                                            {ds.visibility === 'public' && (
                                                <button className="text-hub-purple hover:text-hub-purple/80 transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No datasets available.</p>
                        )}
                    </div>

                    <div className="premium-card p-6 space-y-4">
                        <h2 className="font-outfit font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-muted-foreground" /> Research Team
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                                    {(project.pi?.first_name?.[0] || "")}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{project.pi?.first_name} {project.pi?.last_name}</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-hub-purple">PI</p>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <button className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground">View Full Team</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
