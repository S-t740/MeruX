"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users2, ArrowLeft, Search, UserPlus, UserMinus, ShieldAlert } from "lucide-react";
import { addStudentToCohort, removeStudentFromCohort } from "@/lib/actions/cohorts";
import { cn } from "@/lib/utils";

export default function CohortDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [cohort, setCohort] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Student Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchCohortData();
    }, [params.id, supabase]);

    const fetchCohortData = async () => {
        try {
            // Fetch cohort details
            const { data: cohortData } = await supabase
                .from("cohorts")
                .select("*, courses(title)")
                .eq("id", params.id)
                .single();

            if (cohortData) setCohort(cohortData);

            // Fetch current members
            const { data: membersData } = await supabase
                .from("cohort_members")
                .select("user_id, joined_at, profiles(id, first_name, last_name, email, avatar_url)")
                .eq("cohort_id", params.id)
                .order("joined_at", { ascending: false });

            setMembers(membersData || []);
        } catch (error) {
            console.error("Error fetching cohort data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchStudents = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            // Search profiles by email, first name, or last name
            const { data, error } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, email, avatar_url, role")
                .eq("role", "student")
                .or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
                .limit(5);
                
            if (error) throw error;
            
            // Filter out existing members
            const existingMemberIds = new Set(members.map(m => m.user_id));
            const filteredResults = (data || []).filter(u => !existingMemberIds.has(u.id));
            setSearchResults(filteredResults);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await addStudentToCohort(params.id, userId);
            if (res.error) throw new Error(res.error);
            
            // Clear search and refresh
            setSearchQuery("");
            setSearchResults([]);
            await fetchCohortData();
        } catch (error: any) {
            alert(error.message || "Failed to add member");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this student from the cohort?")) return;
        
        setActionLoading(userId);
        try {
            const res = await removeStudentFromCohort(params.id, userId);
            if (res.error) throw new Error(res.error);
            
            await fetchCohortData();
        } catch (error: any) {
            alert(error.message || "Failed to remove member");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <Users2 className="w-8 h-8 text-hub-indigo animate-pulse" />
        </div>
    );

    if (!cohort) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <ShieldAlert className="w-12 h-12 text-hub-rose" />
            <h2 className="text-xl font-bold font-outfit">Cohort Not Found</h2>
            <button onClick={() => router.push('/dashboard/instructor/cohorts')} className="text-hub-indigo font-bold hover:underline">
                Back to Cohorts
            </button>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="border-b border-border/50 pb-8 space-y-6">
                <button onClick={() => router.push('/dashboard/instructor/cohorts')}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Cohorts
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="page-header mb-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                            {cohort.courses?.title || 'Unknown Course'}
                        </div>
                        <h1 className="page-title">{cohort.name}</h1>
                        <p className="page-description max-w-2xl">{cohort.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-6 px-6 py-4 bg-accent/20 rounded-2xl border border-border/50">
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Members</p>
                            <p className="text-2xl font-outfit font-bold">{members.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Member Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="premium-card p-0 overflow-hidden">
                        <div className="p-6 border-b border-border/50 flex justify-between items-center">
                            <h2 className="text-lg font-outfit font-bold">Roster</h2>
                        </div>
                        <div className="divide-y divide-border/50">
                            {members.length > 0 ? members.map(member => {
                                const profile = member.profiles || {};
                                const fullName = (profile.first_name ? profile.first_name + " " + (profile.last_name || "") : "Unknown").trim();
                                return (
                                    <div key={member.user_id} className="p-4 flex items-center justify-between hover:bg-accent/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border/50">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-muted-foreground">{fullName.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold font-outfit">{fullName}</p>
                                                <p className="text-xs text-muted-foreground">{profile.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            disabled={actionLoading === member.user_id}
                                            className="p-2 text-muted-foreground hover:text-hub-rose hover:bg-hub-rose/10 rounded-lg transition-colors disabled:opacity-50"
                                            title="Remove from cohort"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            }) : (
                                <div className="p-12 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest italic bg-accent/5">
                                    No students enrolled in this cohort yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Students Panel */}
                <div className="lg:col-span-1">
                    <div className="premium-card sticky top-8">
                        <h2 className="text-lg font-outfit font-bold flex items-center gap-2 mb-6">
                            <UserPlus className="w-5 h-5 text-hub-teal" /> Add Students
                        </h2>
                        
                        <form onSubmit={handleSearchStudents} className="relative flex items-center mb-6">
                            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                            <input 
                                placeholder="Search email or name..."
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    if (!e.target.value) setSearchResults([]);
                                }}
                                className="w-full bg-background border border-border/50 rounded-xl pl-10 pr-24 py-3 text-sm focus:outline-none focus:border-hub-indigo focus:ring-1 focus:ring-hub-indigo transition-all"
                            />
                            <button type="submit" disabled={!searchQuery || isSearching}
                                className="absolute right-2 top-2 bottom-2 bg-accent hover:bg-border px-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                                {isSearching ? '...' : 'Find'}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {searchResults.length > 0 ? searchResults.map(user => {
                                const fullName = (user.first_name ? user.first_name + " " + (user.last_name || "") : "Unknown").trim();
                                return (
                                    <div key={user.id} className="flex flex-col gap-3 p-3 rounded-xl border border-border/50 bg-accent/10">
                                        <div>
                                            <p className="text-xs font-bold font-outfit truncate">{fullName}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleAddMember(user.id)}
                                            disabled={actionLoading === user.id}
                                            className="w-full py-1.5 bg-hub-teal/10 hover:bg-hub-teal/20 text-hub-teal border border-hub-teal/20 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-3 h-3" /> Enroll
                                        </button>
                                    </div>
                                );
                            }) : searchQuery && !isSearching && searchResults.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center italic border border-dashed border-border/50 p-4 rounded-xl">No un-enrolled students found matching that search.</p>
                            ) : null}
                            
                            {!searchQuery && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed text-center opacity-70">
                                    Search for registered students by name or email to add them to this cohort roster.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
