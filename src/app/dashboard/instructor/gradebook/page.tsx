"use client"

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock,
    FileText,
    User,
    ExternalLink,
    Send,
    MessageSquare,
    Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function GradebookPage() {
    const supabase = createClient();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [grade, setGrade] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const { data, error } = await supabase
                    .from("submissions")
                    .select("*, assignments!assignment_id(title, max_score), profiles!user_id(first_name, last_name, avatar_url)")
                    .order("submitted_at", { ascending: false });

                if (error) {
                    console.error("Gradebook error:", error.message, error.details, error.hint);
                    throw error;
                }
                setSubmissions(data || []);
            } catch (error: any) {
                console.error("Error fetching submissions:", error?.message || JSON.stringify(error));
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [supabase]);

    const submitGrade = async () => {
        if (!selectedSubmission || !grade) return;

        try {
            const { error } = await supabase
                .from("grades")
                .upsert({
                    submission_id: selectedSubmission.id,
                    score: parseInt(grade),
                    feedback: feedback,
                    grader_id: (await supabase.auth.getUser()).data.user?.id
                }, {
                    onConflict: 'submission_id'
                });

            if (error) throw error;

            await supabase
                .from("submissions")
                .update({ status: 'graded', graded_at: new Date().toISOString() })
                .eq("id", selectedSubmission.id);

            alert("Grade submitted successfully!");
            setSelectedSubmission(null);
            // Refresh list (simplified)
            setSubmissions(prev => prev.map(s =>
                s.id === selectedSubmission.id
                    ? { ...s, status: 'graded' }
                    : s
            ));
        } catch (error: any) {
            console.error("Error submitting grade:", error?.message || JSON.stringify(error, null, 2), error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Accessing Gradebook...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="page-title">Instructor Gradebook</h1>
                <p className="page-description">Review student submissions, provide technical feedback, and award performance scores.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-hub-indigo" />
                        Pending Submissions
                    </h2>

                    {submissions.length > 0 ? (
                        <div className="space-y-4">
                            {submissions.map((sub) => (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    className={cn(
                                        "premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-accent/30 transition-all group",
                                        selectedSubmission?.id === sub.id && "border-hub-indigo shadow-lg shadow-hub-indigo/10 bg-hub-indigo/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center border border-border/50">
                                            {sub.profiles?.avatar_url ? (
                                                <img src={sub.profiles.avatar_url} alt="" className="w-full h-full rounded-full" />
                                            ) : (
                                                <User className="w-6 h-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{sub.assignments?.title}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {sub.profiles?.first_name ? `${sub.profiles.first_name} ${sub.profiles.last_name || ""}` : "Student Innovator"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Submitted</p>
                                            <p className="text-sm font-bold font-outfit">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                            sub.status === 'graded'
                                                ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20"
                                                : "bg-hub-amber/10 text-hub-amber border-hub-amber/20"
                                        )}>
                                            {sub.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center premium-card border-dashed bg-accent/10 border-border">
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No submissions to display yet.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <Award className="w-5 h-5 text-hub-indigo" />
                        Grading Panel
                    </h2>

                    {selectedSubmission ? (
                        <div className="premium-card p-8 space-y-8 sticky top-24">
                            <div className="space-y-4">
                                <h3 className="font-outfit font-bold text-lg">{selectedSubmission.assignments?.title}</h3>
                                <div className="p-4 bg-accent/20 rounded-xl border border-border/50 text-sm italic text-muted-foreground">
                                    &quot;{selectedSubmission.content || "No text content submitted."}&quot;
                                </div>
                                {selectedSubmission.file_url && (
                                    <a
                                        href={selectedSubmission.file_url}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-hub-indigo hover:underline"
                                    >
                                        View Attached File <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            <div className="space-y-4 border-t border-border/50 pt-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Score (Out of {selectedSubmission.assignments?.max_score})</label>
                                    <input
                                        type="number"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder="Enter score"
                                        className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Feedback</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Constructive feedback for the student..."
                                        rows={4}
                                        className="w-full bg-accent/30 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium"
                                    />
                                </div>
                                <button
                                    onClick={submitGrade}
                                    className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Submit Grade
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="premium-card p-12 text-center space-y-4 border-dashed bg-accent/10 border-border h-96 flex flex-col justify-center items-center">
                            <MessageSquare className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest max-w-[200px]">Select a submission to begin assessment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
