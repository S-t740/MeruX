"use client"

import { useEffect, useState } from "react";
import { FileUp, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Link as LinkIcon, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function AssignmentSubmissionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const aid = params.aid as string;
    const supabase = createClient();
    const [assignment, setAssignment] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        content_url: "",
        content: ""
    });
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignmentRes, submissionRes] = await Promise.all([
                    supabase.from("assignments").select("*").eq("id", aid).single(),
                    user ? supabase.from("submissions").select("*").eq("assignment_id", aid).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null })
                ]);

                setAssignment(assignmentRes.data);
                setSubmission(submissionRes.data);
                if (submissionRes.data) {
                    setFormData({
                        content_url: submissionRes.data.content_url || "",
                        content: submissionRes.data.content || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching assignment:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [aid, user, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.content_url && !formData.content) {
            setMessage({ type: "error", text: "Please provide a link or some content" });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from("submissions").upsert({
                assignment_id: aid,
                user_id: user.id,
                file_url: formData.content_url,
                content: formData.content,
                status: 'Pending',
                submitted_at: new Date().toISOString()
            });

            if (error) throw new Error(error.message || JSON.stringify(error));
            setMessage({ type: "success", text: "Assignment submitted successfully! Redirecting..." });
            setTimeout(() => router.push(`/courses/${id}`), 2000);
        } catch (error: any) {
            console.error("Submission failed:", error?.message || error);
            setMessage({ type: "error", text: error?.message || "Failed to submit assignment. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">Establishing secure link...</div>;
    }

    if (!assignment) {
        return <div className="p-12 text-center text-muted-foreground">Assignment not found.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-border/50 pb-8 mb-8">
                <div className="page-header mb-0">
                    <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-hub-indigo mb-4 transition-colors uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3" /> Back to Course
                    </Link>
                    <h1 className="page-title">{assignment.title}</h1>
                    <p className="page-description">Official submission portal for module evaluation.</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deadline</span>
                    <p className="text-hub-amber font-outfit font-bold">{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No deadline'}</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === "success"
                    ? "bg-hub-teal/10 border border-hub-teal/20 text-hub-teal"
                    : "bg-hub-amber/10 border border-hub-amber/20 text-hub-amber"
                    }`}>
                    {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold font-outfit">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="premium-card p-8 space-y-4">
                        <div className="flex items-center gap-3 text-hub-indigo">
                            <Info className="w-5 h-5" />
                            <h2 className="text-xl font-outfit font-bold">Assignment Instructions</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            {assignment.description || "Follow the course material provided in the modules to complete this assignment."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="premium-card p-8 space-y-6 border-hub-indigo/30">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                                    <FileUp className="w-6 h-6 text-hub-indigo" />
                                    Submission Form
                                </h2>
                                {submission && (
                                    <span className="px-2 py-1 rounded bg-hub-teal/10 text-hub-teal text-[10px] font-bold uppercase tracking-widest border border-hub-teal/20">
                                        Update Submission
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold font-outfit flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                        Repository or Documentation Link
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.content_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                                        placeholder="https://github.com/..."
                                        className="w-full bg-accent/30 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold font-outfit">Additional Notes & Context</label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Briefly explain your approach or any challenges faced..."
                                        className="w-full bg-accent/30 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 font-medium h-32 resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || (!formData.content_url && !formData.content)}
                                className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-5 h-5" />
                                        <span>{submission ? "Update Submission" : "Submit Assignment"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="premium-card p-6 space-y-4">
                        <h3 className="text-lg font-outfit font-bold">Status Hub</h3>
                        <div className="space-y-4">
                            <StatusItem label="Current Status" value={submission?.status || "Not Submitted"} accent={submission?.status === 'Graded' ? 'teal' : 'amber'} />
                            <StatusItem label="Grade Received" value={submission?.score ? `${submission.score}%` : "Pending"} accent="indigo" />
                            <StatusItem label="Attempt Date" value={submission ? new Date(submission.submitted_at).toLocaleDateString() : "N/A"} />
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-hub-indigo/5 border border-hub-indigo/10 space-y-3">
                        <h4 className="font-bold font-outfit text-sm">Need Help?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">If you're experiencing technical issues with your submission, please contact your instructor or the support team.</p>
                        <button className="text-xs font-bold text-hub-indigo hover:underline">Contact Support</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, value, accent }: any) {
    const accents: any = {
        teal: "text-hub-teal",
        amber: "text-hub-amber",
        indigo: "text-hub-indigo"
    };
    return (
        <div className="p-3 bg-accent/20 rounded-xl border border-border/50">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className={cn("text-sm font-bold font-outfit", accent && accents[accent])}>{value}</p>
        </div>
    );
}
