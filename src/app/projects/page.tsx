"use client"

import { useEffect, useState } from "react";
import { Plus, Search, Filter, TrendingUp, Users, Target, Zap, Loader2, X, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { completeVentureAndAwardDna } from "@/lib/actions/projects";

export default function IncubatorPage() {
    const { user } = useAuth();
    const supabase = createClient();
    const [projects, setProjects] = useState<any[]>([]);
    const [userSkills, setUserSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", status: "proposal" });
    const [successMsg, setSuccessMsg] = useState("");

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from("projects")
                .select("*, mentor:profiles!mentor_id(first_name, last_name), project_skills(skills(name))")
                .order("created_at", { ascending: false });
            if (!error) setProjects(data || []);

            if (user?.id) {
                const { data: us } = await supabase.from('user_skills').select('skills(name)').eq('user_id', user.id);
                if (us) {
                    const skillsArray = us.map((u: any) => {
                        const s = u.skills;
                        return Array.isArray(s) ? s[0]?.name : s?.name;
                    }).filter(Boolean);
                    setUserSkills(skillsArray);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (projectId: string) => {
        if (!user) return;
        try {
            const res = await completeVentureAndAwardDna(projectId, user.id);
            if (res.error) {
                alert(res.error);
            } else {
                setSuccessMsg("Venture completed! +200 Soft Skill DNA Awarded 🧬");
                fetchProjects();
                setTimeout(() => setSuccessMsg(""), 4000);
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    useEffect(() => { fetchProjects(); }, [supabase, user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from("projects").insert({
                title: formData.title,
                description: formData.description,
                status: formData.status,
                owner_id: user.id
            });
            if (error) throw error;
            setSuccessMsg("Venture launched successfully!");
            setShowModal(false);
            setFormData({ title: "", description: "", status: "proposal" });
            fetchProjects();
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = projects.filter(p => {
        const matchSearch = search === "" || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const recommendedProjects = projects.filter(p => {
        const reqSkills = p.project_skills?.map((ps: any) => {
            const s = ps.skills;
            return Array.isArray(s) ? s[0]?.name : s?.name;
        }).filter(Boolean) || [];
        return reqSkills.some((r: string) => userSkills.includes(r));
    });

    const statuses = ["all", "proposal", "approved", "in-progress", "completed"];

    if (loading) return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Synchronizing venture data...</div>;

    return (
        <div className="space-y-8">
            {/* Launch Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold">Launch New Venture</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-accent rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Project Title *</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. AgriTech Smart Irrigation"
                                    className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-amber/50 text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe your venture's mission and innovation..."
                                    rows={4}
                                    className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-amber/50 text-sm resize-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Stage</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                    className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-amber/50 text-sm"
                                >
                                    <option value="proposal">Proposal</option>
                                    <option value="approved">Approved</option>
                                    <option value="in-progress">In Progress</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-accent rounded-xl font-bold text-sm hover:bg-accent/80 transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-hub-amber text-white rounded-xl font-bold text-sm hover:bg-hub-amber/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {submitting ? "Launching..." : "Launch Venture"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <h1 className="page-title">Innovation Hub</h1>
                    <p className="page-description">Launch your innovation, iterate on your MVP, and track your startup growth platform-wide.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-hub-amber text-white rounded-xl font-bold hover:bg-hub-amber/90 transition-all text-sm shadow-xl shadow-hub-amber/20 active:scale-95">
                    <Plus className="w-4 h-4" /> Launch Venture
                </button>
            </div>

            {successMsg && (
                <div className="flex items-center gap-3 p-4 bg-hub-teal/10 border border-hub-teal/30 rounded-xl text-hub-teal text-sm font-medium">
                    <CheckCircle2 className="w-5 h-5" /> {successMsg}
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search projects or innovations..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hub-amber/50 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium capitalize"
                >
                    {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Stages" : s}</option>)}
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Projects", value: projects.length },
                    { label: "Proposals", value: projects.filter(p => p.status === "proposal").length },
                    { label: "In Progress", value: projects.filter(p => p.status === "in-progress").length },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-5 space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                        <p className="text-3xl font-outfit font-bold">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recommended Projects (Matchmaking) */}
            {recommendedProjects.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-hub-amber" />
                        <h2 className="text-xl font-outfit font-bold">Recommended For You</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-hub-amber/10 text-hub-amber font-bold uppercase tracking-widest border border-hub-amber/20 hidden sm:inline-block">Skill DNA Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground">These projects are looking for your specific skill set.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {recommendedProjects.slice(0, 3).map(project => (
                            <ProjectCard key={`rec-${project.id}`} project={project} onComplete={handleComplete} />
                        ))}
                    </div>
                </div>
            )}

            {/* Project Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-border/50">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold">Active Projects</h2>
                        <span className="text-sm text-muted-foreground">{filtered.length} results</span>
                    </div>
                    {filtered.length > 0 ? filtered.map(project => (
                        <ProjectCard key={project.id} project={project} onComplete={handleComplete} />
                    )) : (
                        <div className="premium-card p-20 text-center text-muted-foreground">
                            {search || statusFilter !== "all" ? "No matching projects." : "No projects yet. Be the first to launch!"}
                        </div>
                    )}
                </div>

                {/* Resources */}
                <div className="space-y-4">
                    <h2 className="text-xl font-outfit font-bold">Venture Resources</h2>
                    {[
                        { icon: <Target className="w-5 h-5 text-hub-amber" />, title: "Pitch Deck Template", desc: "Investor-ready presentation" },
                        { icon: <Users className="w-5 h-5 text-hub-rose" />, title: "Capital Network", desc: "Connect with 40+ angels" },
                        { icon: <Zap className="w-5 h-5 text-hub-amber" />, title: "Innovation Guide", desc: "Complete startup playbook" },
                    ].map((r, i) => (
                        <button key={i} className="w-full p-4 rounded-xl border border-border/50 hover:bg-accent transition-all group bg-card/20 text-left flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                {r.icon}
                            </div>
                            <div>
                                <p className="font-bold text-sm font-outfit group-hover:text-hub-amber transition-colors">{r.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const STATUS_COLORS: Record<string, string> = {
    proposal: "bg-hub-amber/10 text-hub-amber",
    approved: "bg-hub-teal/10 text-hub-teal",
    "in-progress": "bg-hub-indigo/10 text-hub-indigo",
    completed: "bg-hub-rose/10 text-hub-rose",
};

function ProjectCard({ project, onComplete }: { project: any, onComplete?: (id: string) => void }) {
    const { user } = useAuth();
    // Assuming 'owner_id' or 'user_id' establishes ownership for Gamification UI display
    const isOwner = user?.id === project.user_id || user?.id === project.owner_id;

    const reqSkills = project.project_skills?.map((ps: any) => {
            const s = ps.skills;
            return Array.isArray(s) ? s[0]?.name : s?.name;
    }).filter(Boolean) || [];

    return (
        <div className="premium-card p-6 space-y-4 hover:shadow-lg transition-all group cursor-pointer">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-outfit font-bold text-lg group-hover:text-hub-amber transition-colors">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                </div>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0", STATUS_COLORS[project.status] || "bg-accent text-muted-foreground")}>
                    {project.status}
                </span>
            </div>
            {reqSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {reqSkills.map((s: string, idx: number) => (
                        <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-accent text-muted-foreground border border-border/50">
                            {s}
                        </span>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span>{(project.mentor?.first_name ? `${project.mentor?.first_name} ${project.mentor?.last_name || ''}`.trim() : "") ? `Mentor: ${(project.mentor.first_name ? `${project.mentor.first_name} ${project.mentor.last_name || ''}`.trim() : "")}` : "No mentor assigned"}</span>
                <div className="flex items-center gap-3">
                    {onComplete && isOwner && project.status !== 'completed' && project.status !== 'proposal' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onComplete(project.id); }} 
                            className="flex items-center gap-1 text-hub-teal font-bold hover:underline"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Finish & Get DNA
                        </button>
                    )}
                    <div className="flex items-center gap-1 text-hub-amber font-bold">
                        <TrendingUp className="w-4 h-4" />
                        View Details
                    </div>
                </div>
            </div>
        </div>
    );
}
