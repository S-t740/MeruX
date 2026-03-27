"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, BookOpen, Calendar, ArrowRight, Activity, Users2 } from "lucide-react";
import { createCohort } from "@/lib/actions/cohorts";
import { cn } from "@/lib/utils";

export default function InstructorCohortsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [newCohort, setNewCohort] = useState({
        courseId: "",
        name: "",
        description: "",
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch courses taught by this instructor
                const { data: coursesData } = await supabase
                    .from("courses")
                    .select("id, title")
                    .eq("instructor_id", user.id);

                setCourses(coursesData || []);

                if (coursesData && coursesData.length > 0) {
                    const courseIds = coursesData.map(c => c.id);
                    
                    // Fetch cohorts for these courses
                    const { data: cohortsData } = await supabase
                        .from("cohorts")
                        .select("*, courses(title), cohort_members(count)")
                        .in("course_id", courseIds)
                        .order("created_at", { ascending: false });
                        
                    setCohorts(cohortsData || []);
                    if (coursesData.length > 0) {
                        setNewCohort(prev => ({ ...prev, courseId: coursesData[0].id }));
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await createCohort(
                newCohort.courseId, 
                newCohort.name, 
                newCohort.description, 
                newCohort.startDate, 
                newCohort.endDate
            );
            
            if (res.error) throw new Error(res.error);
            
            // Immediately redirect to the new cohort details page
            if (res.cohort?.id) {
                router.push(`/dashboard/instructor/cohorts/${res.cohort.id}`);
            }
        } catch (error: any) {
            alert(error.message || "Failed to create cohort");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <Users2 className="w-4 h-4" /> Cohort Management
                    </div>
                    <h1 className="page-title">Active Cohorts</h1>
                    <p className="page-description">Create and manage student batches, track group progress, and foster peer learning.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cohorts List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center animate-pulse">
                            <Activity className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                    ) : cohorts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {cohorts.map(cohort => (
                                <div key={cohort.id} 
                                    onClick={() => router.push(`/dashboard/instructor/cohorts/${cohort.id}`)}
                                    className="premium-card p-6 flex flex-col group cursor-pointer hover:border-hub-indigo/40 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 border border-hub-indigo/20 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-hub-indigo group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-accent text-[10px] font-bold uppercase tracking-widest">
                                            {cohort.cohort_members?.[0]?.count || 0} Members
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-outfit font-bold group-hover:text-hub-indigo transition-colors">{cohort.name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 mb-4">
                                        Course: <span className="text-foreground">{cohort.courses?.title || 'Unknown'}</span>
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center text-xs">
                                        <span className="flex items-center gap-1.5 text-muted-foreground font-bold">
                                            <Calendar className="w-4 h-4" />
                                            {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'No dates set'}
                                        </span>
                                        <span className="text-hub-indigo font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Manage <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="premium-card p-12 text-center border-dashed border-border/50 bg-accent/20">
                            <Users2 className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                            <h3 className="text-lg font-outfit font-bold">No Cohorts Yet</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Group your students into manageable classes or intakes to build a better learning experience.</p>
                        </div>
                    )}
                </div>

                {/* Create Cohort Form */}
                <div className="lg:col-span-1">
                    <div className="premium-card sticky top-8">
                        <h2 className="text-lg font-outfit font-bold flex items-center gap-2 mb-6">
                            <Plus className="w-5 h-5 text-hub-teal" /> New Cohort
                        </h2>
                        
                        {courses.length === 0 && !loading ? (
                            <div className="p-4 bg-hub-rose/10 border border-hub-rose/20 rounded-xl text-center text-sm font-bold text-hub-rose">
                                You must create a Course before you can create a Cohort.
                            </div>
                        ) : (
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Course</label>
                                    <select 
                                        required
                                        value={newCohort.courseId}
                                        onChange={e => setNewCohort({...newCohort, courseId: e.target.value})}
                                        className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all"
                                    >
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cohort Name</label>
                                    <input 
                                        required
                                        placeholder="e.g. Fall 2026 Batch"
                                        value={newCohort.name}
                                        onChange={e => setNewCohort({...newCohort, name: e.target.value})}
                                        className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                                    <textarea 
                                        placeholder="Optional details..."
                                        rows={3}
                                        value={newCohort.description}
                                        onChange={e => setNewCohort({...newCohort, description: e.target.value})}
                                        className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Date</label>
                                        <input 
                                            type="date"
                                            value={newCohort.startDate}
                                            onChange={e => setNewCohort({...newCohort, startDate: e.target.value})}
                                            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">End Date</label>
                                        <input 
                                            type="date"
                                            value={newCohort.endDate}
                                            onChange={e => setNewCohort({...newCohort, endDate: e.target.value})}
                                            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newCohort.courseId || !newCohort.name}
                                    className="w-full mt-4 bg-hub-indigo hover:bg-hub-indigo/90 text-white font-bold py-3 px-4 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isCreating ? "Creating..." : "Launch Cohort"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
