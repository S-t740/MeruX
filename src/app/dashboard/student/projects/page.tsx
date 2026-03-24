"use client";

import { useEffect, useState } from "react";
import { Sparkles, Briefcase, Plus, Clock, ArrowRight, Settings, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateProjectIdeas } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

export default function StudentProjects() {
    const supabase = createClient();
    const [ideas, setIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchProjects = async (uid: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('project_ideas')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setIdeas(data || []);
        } catch (error: any) {
            console.error("Fetch Projects Error:", error.message || JSON.stringify(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchProjects(user.id);
            }
        };
        init();
    }, [supabase]);

    const handleGenerate = async () => {
        if (!userId) return;
        setGenerating(true);
        try {
            const res = await generateProjectIdeas(userId);
            if (res.error) {
                alert("Failed to generate: " + res.error);
            } else {
                await fetchProjects(userId);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const handleAdopt = async (projectId: string) => {
        try {
            const project = ideas.find(p => p.id === projectId);
            if (!project) return;

            // 1. Mark idea as adopted locally in AI Incubator DB
            const { error: ideaError } = await supabase
                .from('project_ideas')
                .update({ status: 'in_progress' })
                .eq('id', projectId);
                
            if (ideaError) throw ideaError;

            // 2. Clone the AI Idea into the Global Startup Hub (projects table)
            const { error: globalError } = await supabase
                .from('projects')
                .insert({
                    title: project.title,
                    description: project.problem_statement || project.description,
                    status: 'in-progress' // Instantly active global venture
                });

            if (globalError) {
                console.error("Failed to sync with Global Hub:", globalError);
            }

            // Optimistic UI update
            setIdeas(prev => prev.map(p => p.id === projectId ? { ...p, status: 'in_progress' } : p));
        } catch (error: any) {
            alert("Error adopting: " + error.message);
        }
    };

    // Derived states
    const adopted = ideas.filter(i => i.status === 'in_progress' || i.status === 'completed');
    const suggestions = ideas.filter(i => i.status === 'suggested');

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <Briefcase className="w-4 h-4" />
                        Innovation Engine
                    </div>
                    <h1 className="page-title">Project Incubator</h1>
                    <p className="page-description">Auto-generated, resume-ready project pitches based on your unique DNA. Build your portfolio here.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-6 py-3 bg-gradient-to-r from-hub-indigo to-hub-purple text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:-translate-y-1 shadow-xl shadow-hub-indigo/20 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                >
                    {generating ? (
                        <div className="flex gap-1 items-center">
                            <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                            <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-75" />
                            <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-150" />
                            <span className="ml-2">Brainstorming...</span>
                        </div>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Generate AI Sparks
                        </>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-pulse space-y-4 flex flex-col items-center">
                        <Sparkles className="w-8 h-8 text-hub-indigo opacity-50" />
                        <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Loading Innovation Hub...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Active Projects */}
                    {adopted.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Settings className="w-5 h-5 text-hub-teal" />
                                Active Development
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {adopted.map(p => (
                                    <div key={p.id} className="premium-card p-6 border-hub-teal/30 hover:border-hub-teal/50 transition-all group flex flex-col h-[280px]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="px-3 py-1 rounded-full bg-hub-teal/10 text-hub-teal text-[10px] font-bold uppercase tracking-widest border border-hub-teal/20">
                                                {p.status}
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
                                                <Clock className="w-3.5 h-3.5" /> {p.estimated_hours}h
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold mb-2 group-hover:text-hub-teal transition-colors line-clamp-2">{p.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-4 flex-1">{p.description}</p>
                                        <div className="pt-4 border-t border-border/50 flex justify-between items-center mt-auto">
                                            <span className="text-xs font-bold text-muted-foreground">Difficulty: <span className="text-foreground">{p.difficulty}</span></span>
                                            {p.status === 'in_progress' ? (
                                                <button className="text-xs font-bold text-hub-teal hover:underline flex items-center gap-1">Update Status <ArrowRight className="w-3 h-3" /></button>
                                            ) : (
                                                <div className="flex items-center gap-1 text-hub-teal text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Suggestions */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-hub-indigo" />
                                Custom AI Suggestions
                            </h2>
                        </div>
                        
                        {suggestions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {suggestions.map(p => (
                                    <div key={p.id} className="bg-card p-6 rounded-2xl border border-border/50 hover:border-hub-indigo/50 transition-all group shadow-sm hover:shadow-2xl hover:shadow-hub-indigo/5 flex flex-col h-[280px]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="px-3 py-1 rounded-full bg-accent text-foreground text-[10px] font-bold uppercase tracking-widest border border-border">
                                                New Idea
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
                                                <Clock className="w-3.5 h-3.5" /> {p.estimated_hours}h
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold mb-2 group-hover:text-hub-indigo transition-colors line-clamp-2">{p.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-4 flex-1">{p.description}</p>
                                        <div className="pt-4 border-t border-border/50 flex justify-between items-center mt-auto">
                                            <span className="text-xs font-bold text-muted-foreground">Difficulty: <span className="text-foreground">{p.difficulty}</span></span>
                                            <button 
                                                onClick={() => handleAdopt(p.id)}
                                                className="px-4 py-2 bg-hub-indigo/10 text-hub-indigo hover:bg-hub-indigo hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                                            >
                                                Adopt Idea <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-border/50 rounded-2xl p-12 text-center flex flex-col items-center bg-accent/5">
                                <Briefcase className="w-10 h-10 text-muted-foreground/50 mb-4" />
                                <h3 className="font-outfit font-bold text-lg">No sparks generated yet</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-6">Complete courses to train the engine, then generate project pitches perfectly fitted to your Skill DNA.</p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="px-6 py-2.5 bg-hub-indigo/10 text-hub-indigo rounded-xl font-bold flex items-center gap-2 transition-colors hover:bg-hub-indigo/20 disabled:opacity-50"
                                >
                                    {generating ? "Brainstorming..." : "Generate AI Sparks"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
