"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Rocket, Users, CheckCircle2, Clock, ArrowLeft, Plus, MessageSquare,
    ExternalLink, Flag, Loader2, X, Trash2, Upload, ArrowRight, Briefcase, DollarSign, Database
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

const STATUSES = ['proposal', 'approved', 'in-progress', 'review', 'completed'];

export default function ProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuth();

    const [project, setProject] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [deliverables, setDeliverables] = useState<any[]>([]);
    const [startupProfile, setStartupProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [advancing, setAdvancing] = useState(false);
    const [isMentor, setIsMentor] = useState(false);

    // Forms
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: "", description: "", due_date: "" });
    const [showDeliverableForm, setShowDeliverableForm] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({ title: "", file_url: "" });
    const [showResearchForm, setShowResearchForm] = useState(false);
    const [newResearch, setNewResearch] = useState({ title: "", url: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        try {
            const [projectRes, membersRes, milestonesRes, deliverablesRes, startupRes, mentorCheckRes] = await Promise.all([
                supabase.from("projects").select("*, profiles:mentor_id(first_name, last_name)").eq("id", id).single(),
                supabase.from("project_members").select("*, profiles(first_name, last_name, avatar_url)").eq("project_id", id),
                supabase.from("project_milestones").select("*").eq("project_id", id).order("created_at"),
                supabase.from("project_deliverables").select("*, profiles:submitted_by(first_name, last_name)").eq("project_id", id).order("created_at", { ascending: false }),
                supabase.from("startup_profiles").select("*").eq("project_id", id).maybeSingle(),
                user ? supabase.from("mentor_profiles").select("id").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null })
            ]);
            setProject(projectRes.data);
            setMembers(membersRes.data || []);
            setMilestones(milestonesRes.data || []);
            setDeliverables(deliverablesRes.data || []);
            setStartupProfile(startupRes.data || null);
            setIsMentor(!!mentorCheckRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [id, supabase]);

    // --- Lifecycle advancement ---
    const advanceStatus = async () => {
        if (!project) return;
        const idx = STATUSES.indexOf(project.status);
        if (idx >= STATUSES.length - 1) return;
        setAdvancing(true);
        try {
            const { error } = await supabase.from("projects").update({ status: STATUSES[idx + 1] }).eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) { console.error(err); alert("Failed to advance status"); }
        finally { setAdvancing(false); }
    };

    const offerMentorship = async () => {
        if (!project || !user) return;
        try {
            const { error } = await supabase.from("projects").update({ mentor_id: user.id }).eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to offer mentorship");
        }
    };

    // --- Milestone CRUD ---
    const addMilestone = async () => {
        if (!newMilestone.title.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("project_milestones").insert({
                project_id: id,
                title: newMilestone.title,
                description: newMilestone.description,
                due_date: newMilestone.due_date || null,
                status: 'pending'
            });
            if (error) throw error;
            setNewMilestone({ title: "", description: "", due_date: "" });
            setShowMilestoneForm(false);
            fetchData();
        } catch (err) { console.error(err); alert("Failed to add milestone"); }
        finally { setSaving(false); }
    };

    const toggleMilestone = async (milestoneId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await supabase.from("project_milestones").update({
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            }).eq("id", milestoneId);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const deleteMilestone = async (milestoneId: string) => {
        try {
            await supabase.from("project_milestones").delete().eq("id", milestoneId);
            fetchData();
        } catch (err) { console.error(err); }
    };

    // --- Deliverables ---
    const addDeliverable = async () => {
        if (!newDeliverable.title.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("project_deliverables").insert({
                project_id: id,
                title: newDeliverable.title,
                file_url: newDeliverable.file_url || null,
                submitted_by: user?.id
            });
            if (error) throw error;
            setNewDeliverable({ title: "", file_url: "" });
            setShowDeliverableForm(false);
            fetchData();
        } catch (err) { console.error(err); alert("Failed to add deliverable"); }
        finally { setSaving(false); }
    };

    const linkResearch = async () => {
        if (!newResearch.title.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("project_deliverables").insert({
                project_id: id,
                title: `[RESEARCH] ${newResearch.title}`,
                file_url: newResearch.url || null,
                submitted_by: user?.id
            });
            if (error) throw error;
            setNewResearch({ title: "", url: "" });
            setShowResearchForm(false);
            fetchData();
        } catch (err) { console.error(err); alert("Failed to link research"); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Synchronizing Project Hub...</div>;
    }

    const currentStatusIdx = STATUSES.indexOf(project?.status || 'proposal');
    const mentorName = project?.profiles?.first_name ? `${project.profiles.first_name} ${project.profiles.last_name || ''}`.trim() : null;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const pureDeliverables = deliverables.filter(d => !d.title.startsWith('[RESEARCH]'));
    const linkedResearch = deliverables.filter(d => d.title.startsWith('[RESEARCH]'));

    return (
        <div className="space-y-8 pb-20">
            <button onClick={() => router.push('/projects')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-hub-indigo transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Portfolio
            </button>

            {/* Hero Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-hub-rose flex items-center justify-center text-white shadow-xl shadow-hub-rose/20">
                            <Rocket className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-outfit font-bold tracking-tight">{project?.title || "Innovation Project"}</h1>
                            <p className="text-muted-foreground font-medium">{project?.description}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {currentStatusIdx < STATUSES.length - 1 && (
                        <button onClick={advanceStatus} disabled={advancing}
                            className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20 active:scale-95 flex items-center gap-2 disabled:opacity-60">
                            {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Advance to {STATUSES[currentStatusIdx + 1]?.replace('-', ' ')}
                        </button>
                    )}
                </div>
            </div>

            {/* Lifecycle Stepper */}
            <div className="premium-card p-8">
                <div className="relative flex justify-between items-center max-w-4xl mx-auto">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent/50 -translate-y-1/2 z-0" />
                    {STATUSES.map((s, i) => (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                i <= currentStatusIdx
                                    ? "bg-hub-indigo border-hub-indigo text-white shadow-lg shadow-hub-indigo/20 scale-110"
                                    : "bg-background border-accent text-muted-foreground"
                            )}>
                                {i < currentStatusIdx ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-bold uppercase">{i + 1}</span>}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.15em]",
                                i <= currentStatusIdx ? "text-hub-indigo" : "text-muted-foreground opacity-50"
                            )}>
                                {s.replace('-', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Milestones */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Flag className="w-5 h-5 text-hub-rose" /> Milestones
                                <span className="text-xs text-muted-foreground font-medium ml-2">({completedMilestones}/{milestones.length})</span>
                            </h2>
                            <button onClick={() => setShowMilestoneForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-hub-rose/10 text-hub-rose rounded-xl font-bold text-xs hover:bg-hub-rose/20 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Milestone
                            </button>
                        </div>

                        {showMilestoneForm && (
                            <div className="premium-card p-5 space-y-3 border-hub-rose/30 bg-hub-rose/5">
                                <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Milestone title..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-rose/50 transition-all" />
                                <textarea value={newMilestone.description} onChange={e => setNewMilestone(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Description..." rows={2} className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-rose/50 resize-none transition-all" />
                                <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone(p => ({ ...p, due_date: e.target.value }))}
                                    className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-rose/50 transition-all" />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowMilestoneForm(false)} className="px-4 py-2 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                    <button onClick={addMilestone} disabled={saving} className="px-4 py-2 bg-hub-rose text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {milestones.map(m => (
                                <div key={m.id} className="premium-card p-5 flex items-center justify-between group hover:bg-accent/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => toggleMilestone(m.id, m.status)}
                                            className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                m.status === 'completed' ? "bg-hub-teal border-hub-teal text-white" : "border-accent hover:border-hub-teal"
                                            )}>
                                            {m.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                        <div>
                                            <h3 className={cn("font-outfit font-bold", m.status === 'completed' && "line-through opacity-60")}>{m.title}</h3>
                                            {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                                            {m.due_date && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Due: {new Date(m.due_date).toLocaleDateString()}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteMilestone(m.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-hub-rose/10 rounded-lg transition-all">
                                        <Trash2 className="w-3.5 h-3.5 text-hub-rose" />
                                    </button>
                                </div>
                            ))}
                            {milestones.length === 0 && !showMilestoneForm && (
                                <div className="premium-card p-12 text-center border-dashed bg-accent/10"><p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No milestones yet</p></div>
                            )}
                        </div>
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Upload className="w-5 h-5 text-hub-teal" /> Deliverables
                            </h2>
                            <button onClick={() => setShowDeliverableForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-hub-teal/10 text-hub-teal rounded-xl font-bold text-xs hover:bg-hub-teal/20 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Deliverable
                            </button>
                        </div>

                        {showDeliverableForm && (
                            <div className="premium-card p-5 space-y-3 border-hub-teal/30 bg-hub-teal/5">
                                <input value={newDeliverable.title} onChange={e => setNewDeliverable(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Deliverable title..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-teal/50 transition-all" />
                                <input value={newDeliverable.file_url} onChange={e => setNewDeliverable(p => ({ ...p, file_url: e.target.value }))}
                                    placeholder="File URL or link..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-teal/50 transition-all" />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowDeliverableForm(false)} className="px-4 py-2 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                    <button onClick={addDeliverable} disabled={saving} className="px-4 py-2 bg-hub-teal text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Submit
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {pureDeliverables.map(d => (
                                <div key={d.id} className="premium-card p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-hub-teal/10 flex items-center justify-center"><Upload className="w-4 h-4 text-hub-teal" /></div>
                                        <div>
                                            <h4 className="text-sm font-bold font-outfit">{d.title}</h4>
                                            <p className="text-[10px] text-muted-foreground">
                                                By {d.profiles?.first_name || "Member"} • {new Date(d.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {d.file_url && (
                                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-accent rounded-lg transition-colors">
                                            <ExternalLink className="w-4 h-4 text-hub-indigo" />
                                        </a>
                                    )}
                                </div>
                            ))}
                            {pureDeliverables.length === 0 && !showDeliverableForm && (
                                <div className="premium-card p-12 text-center border-dashed bg-accent/10"><p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No deliverables yet</p></div>
                            )}
                        </div>
                    </div>

                    {/* Supporting Research Links */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <Database className="w-5 h-5 text-hub-purple" /> Supporting Research
                            </h2>
                            <button onClick={() => setShowResearchForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-hub-purple/10 text-hub-purple rounded-xl font-bold text-xs hover:bg-hub-purple/20 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Pull Dataset
                            </button>
                        </div>

                        {showResearchForm && (
                            <div className="premium-card p-5 space-y-3 border-hub-purple/30 bg-hub-purple/5">
                                <input value={newResearch.title} onChange={e => setNewResearch(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Research paper/dataset title..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-purple/50 transition-all" />
                                <input value={newResearch.url} onChange={e => setNewResearch(p => ({ ...p, url: e.target.value }))}
                                    placeholder="Link to Research Hub or external URL..." className="w-full bg-accent/30 border border-border/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hub-purple/50 transition-all" />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowResearchForm(false)} className="px-4 py-2 bg-accent rounded-lg text-xs font-bold">Cancel</button>
                                    <button onClick={linkResearch} disabled={saving} className="px-4 py-2 bg-hub-purple text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Link Research
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {linkedResearch.map(r => (
                                <div key={r.id} className="premium-card p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-hub-purple/10 flex items-center justify-center"><Database className="w-4 h-4 text-hub-purple" /></div>
                                        <div>
                                            <h4 className="text-sm font-bold font-outfit">{r.title.replace('[RESEARCH] ', '')}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5 text-hub-purple">
                                                Research Data
                                            </p>
                                        </div>
                                    </div>
                                    {r.file_url && (
                                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-accent rounded-lg transition-colors">
                                            <ExternalLink className="w-4 h-4 text-hub-indigo" />
                                        </a>
                                    )}
                                </div>
                            ))}
                            {linkedResearch.length === 0 && !showResearchForm && (
                                <div className="premium-card p-12 text-center border-dashed bg-accent/10"><p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No research linked</p></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Team */}
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2"><Users className="w-5 h-5 text-hub-indigo" /> The Team</h2>
                        <div className="space-y-3">
                            {members.map((m, i) => {
                                const name = m.profiles?.first_name ? `${m.profiles.first_name} ${m.profiles.last_name || ''}`.trim() : "Innovator";
                                return (
                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-xl transition-all border border-transparent hover:border-border/30">
                                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-xs">{name.charAt(0)}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold font-outfit">{name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.role}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mentor Feedback */}
                    <div className="premium-card p-8 space-y-4 border-l-4 border-l-hub-teal">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-hub-teal/10 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-hub-teal" /></div>
                            <h3 className="font-outfit font-bold">Mentor</h3>
                        </div>
                        {mentorName ? (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-hub-teal/10 flex items-center justify-center text-hub-teal font-bold text-xs">{mentorName.charAt(0)}</div>
                                <span className="text-sm font-bold font-outfit">{mentorName}</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground italic">No mentor assigned yet.</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => router.push('/mentorship')} className="px-4 py-2 bg-hub-teal/10 text-hub-teal hover:bg-hub-teal hover:text-white transition-colors text-xs font-bold rounded-xl truncate">
                                        Find a Mentor
                                    </button>
                                    {isMentor && (
                                        <button onClick={offerMentorship} className="px-4 py-2 bg-hub-indigo text-white hover:bg-hub-indigo/90 transition-colors text-xs font-bold rounded-xl truncate shadow-md shadow-hub-indigo/20">
                                            Offer Mentorship
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="premium-card p-6 space-y-4">
                        <h3 className="text-sm font-bold font-outfit uppercase tracking-widest text-hub-indigo">Project Stats</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Status", value: project?.status?.replace('-', ' ') || "—" },
                                { label: "Team Size", value: `${members.length} members` },
                                { label: "Milestones Done", value: `${completedMilestones}/${milestones.length}` },
                                { label: "Deliverables", value: `${deliverables.length} submitted` },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-bold uppercase tracking-widest">{s.label}</span>
                                    <span className="font-bold font-outfit capitalize">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Startup Incubation Profile (Module 7) */}
            {(startupProfile || project?.type === 'startup') && (
                <div className="premium-card p-6 space-y-4 border-l-4 border-l-hub-amber">
                    <h3 className="text-sm font-bold font-outfit uppercase tracking-widest text-hub-amber flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Startup Profile
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Funding Stage</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-md bg-hub-amber/10 border border-hub-amber/20 text-hub-amber text-xs font-bold capitalize">
                                <DollarSign className="w-3.5 h-3.5" />
                                {startupProfile?.funding_stage || "Pre-seed"}
                            </div>
                        </div>

                        {startupProfile?.pitch_deck_url && (
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Materials</p>
                                <a
                                    href={startupProfile.pitch_deck_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 transition-colors rounded-lg text-xs font-bold border border-border/50"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> View Pitch Deck
                                </a>
                            </div>
                        )}

                        {!startupProfile && (
                            <button className="w-full py-2 bg-hub-amber/10 hover:bg-hub-amber/20 transition-colors text-hub-amber rounded-lg text-xs font-bold">
                                Activate Startup Profile
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
