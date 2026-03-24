"use client"

import { useEffect, useState } from "react";
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Send,
    ExternalLink,
    MessageCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function StudentAssignmentsPage() {
    const supabase = createClient();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [submissionContent, setSubmissionContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch assignments for enrolled courses and their submissions
                const { data, error } = await supabase
                    .from("assignments")
                    .select(`
                        *,
                        courses(title),
                        submissions!left(*)
                    `)
                    .order("due_date", { ascending: true });

                if (error) throw error;
                setAssignments(data || []);
            } catch (error) {
                console.error("Error fetching assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [supabase]);

    const handleSubmit = async () => {
        if (!selectedAssignment || !submissionContent) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from("submissions")
                .upsert({
                    assignment_id: selectedAssignment.id,
                    user_id: user?.id,
                    content: submissionContent,
                    file_url: fileUrl,
                    status: 'submitted',
                    submitted_at: new Date().toISOString()
                });

            if (error) throw error;

            alert("Assignment submitted successfully!");
            setSelectedAssignment(null);
            // Refresh list (simplified)
            setAssignments(prev => prev.map(a =>
                a.id === selectedAssignment.id
                    ? { ...a, submissions: [{ status: 'submitted' }] }
                    : a
            ));
        } catch (error) {
            console.error("Error submitting assignment:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Synchronizing assignments...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="page-title">My Assignments</h1>
                <p className="page-description">Track your upcoming deadlines, submit project deliverables, and review instructor feedback.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-hub-indigo" />
                        Upcoming & Active
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.length > 0 ? (
                            assignments.map((assignment) => {
                                const submission = assignment.submissions?.[0];
                                const isOverdue = new Date(assignment.due_date) < new Date() && !submission;

                                return (
                                    <div
                                        key={assignment.id}
                                        onClick={() => setSelectedAssignment(assignment)}
                                        className={cn(
                                            "premium-card p-6 cursor-pointer hover:bg-accent/30 transition-all group border-l-4",
                                            submission?.status === 'graded' ? "border-l-hub-teal" :
                                                isOverdue ? "border-l-rose-500" : "border-l-hub-indigo",
                                            selectedAssignment?.id === assignment.id && "bg-hub-indigo/5 border-hub-indigo shadow-lg shadow-hub-indigo/10"
                                        )}
                                    >
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{assignment.courses?.title}</p>
                                                <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{assignment.title}</h3>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-border/30">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(assignment.due_date).toLocaleDateString()}
                                                </div>
                                                <div className={cn(
                                                    "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider",
                                                    submission?.status === 'graded' ? "bg-hub-teal/10 text-hub-teal" :
                                                        submission?.status === 'submitted' ? "bg-hub-indigo/10 text-hub-indigo" :
                                                            isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-accent text-muted-foreground"
                                                )}>
                                                    {submission?.status || (isOverdue ? "Overdue" : "Pending")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full p-12 text-center premium-card border-dashed bg-accent/10">
                                <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No active assignments found.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <Send className="w-5 h-5 text-hub-indigo" />
                        Submission Portal
                    </h2>

                    {selectedAssignment ? (
                        <div className="premium-card p-8 space-y-6 sticky top-24">
                            <div className="space-y-4">
                                <h3 className="font-outfit font-bold text-lg">{selectedAssignment.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{selectedAssignment.description}</p>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-border/50">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Submission Text</label>
                                    <textarea
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        placeholder="Enter your notes, links, or content here..."
                                        rows={6}
                                        className="w-full bg-accent/30 border border-border/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resource URL (Optional)</label>
                                    <div className="relative">
                                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={fileUrl}
                                            onChange={(e) => setFileUrl(e.target.value)}
                                            placeholder="GitHub PR, Drive Link, or Dataset"
                                            className="w-full bg-accent/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Assignment
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="premium-card p-12 text-center space-y-4 border-dashed bg-accent/10 h-96 flex flex-col justify-center items-center">
                            <AlertCircle className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Select an assignment to start your submission</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
