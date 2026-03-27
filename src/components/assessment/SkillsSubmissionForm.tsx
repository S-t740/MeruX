"use client";

import { useState } from "react";
import { submitSkillsAssessment } from "@/lib/actions/assessment";
import { cn } from "@/lib/utils";
import { Link2, FileText, Upload, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";

interface RubricItem { criterion: string; max_points: number; description: string; }
interface Assessment {
    id: string; title: string; description?: string; course_id: string;
    rubric?: RubricItem[]; max_score: number; passing_score: number;
    due_date?: string; grading_type: string;
}
interface SkillsSubmissionFormProps {
    assessment: Assessment;
    studentId: string;
    existingSubmission?: { submission_url?: string; submission_text?: string; status: string; score?: number; feedback?: string } | null;
}

export function SkillsSubmissionForm({ assessment, studentId, existingSubmission }: SkillsSubmissionFormProps) {
    const [submissionUrl, setSubmissionUrl] = useState(existingSubmission?.submission_url || "");
    const [submissionText, setSubmissionText] = useState(existingSubmission?.submission_text || "");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(!!existingSubmission);
    const [error, setError] = useState("");

    const isGraded = existingSubmission?.status === "graded";
    const isResubmittable = existingSubmission?.status === "returned";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!submissionUrl && !submissionText) {
            setError("Please provide a submission URL or written response.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitSkillsAssessment(assessment.id, studentId, {
                submission_url: submissionUrl || undefined,
                submission_text: submissionText || undefined,
                notes: notes || undefined,
            });
            if (res.error) throw new Error(res.error);
            setSubmitted(true);
        } catch (e: any) {
            setError(e.message || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Rubric */}
            {assessment.rubric && assessment.rubric.length > 0 && (
                <div className="premium-card p-6 space-y-4 border-hub-indigo/20">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-hub-indigo" />
                        <h3 className="font-outfit font-bold text-sm uppercase tracking-widest text-hub-indigo">
                            Grading Rubric
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {assessment.rubric.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-accent/20 border border-border/30">
                                <div className="bg-hub-indigo/10 text-hub-indigo text-xs font-bold px-2 py-1 rounded shrink-0">
                                    {item.max_points}pts
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-sm">{item.criterion}</p>
                                    {item.description && (
                                        <p className="text-xs text-muted-foreground font-medium">{item.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Graded Result Banner */}
            {isGraded && existingSubmission && (
                <div className={cn("premium-card p-6 space-y-3",
                    (existingSubmission.score ?? 0) >= assessment.passing_score
                        ? "border-hub-teal/30 bg-hub-teal/5" : "border-hub-rose/30 bg-hub-rose/5"
                )}>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className={cn("w-5 h-5", (existingSubmission.score ?? 0) >= assessment.passing_score ? "text-hub-teal" : "text-hub-rose")} />
                        <h3 className="font-outfit font-bold">Assessment Graded</h3>
                        <span className={cn("ml-auto text-2xl font-bold font-outfit",
                            (existingSubmission.score ?? 0) >= assessment.passing_score ? "text-hub-teal" : "text-hub-rose"
                        )}>
                            {existingSubmission.score ?? 0}/{assessment.max_score}
                        </span>
                    </div>
                    {existingSubmission.feedback && (
                        <div className="bg-background/50 rounded-xl p-4 text-sm text-muted-foreground font-medium border border-border/30">
                            <p className="font-bold text-foreground mb-1">Instructor Feedback</p>
                            <p>{existingSubmission.feedback}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Submission Success */}
            {submitted && !isGraded && !isResubmittable && (
                <div className="premium-card p-8 text-center space-y-4 border-hub-teal/30 bg-hub-teal/5">
                    <CheckCircle2 className="w-12 h-12 text-hub-teal mx-auto" />
                    <h3 className="text-2xl font-outfit font-bold">Submission Received!</h3>
                    <p className="text-muted-foreground font-medium">
                        Your work has been submitted and is pending instructor review.
                        You'll be notified once it's graded.
                    </p>
                </div>
            )}

            {/* Submission Form */}
            {(!submitted || isResubmittable) && !isGraded && (
                <form onSubmit={handleSubmit} className="premium-card p-8 space-y-6">
                    <h3 className="font-outfit font-bold text-lg">Submit Your Work</h3>

                    {/* URL Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5" /> Submission URL
                        </label>
                        <input
                            type="url"
                            placeholder="https://github.com/you/project or hosted link…"
                            value={submissionUrl}
                            onChange={e => setSubmissionUrl(e.target.value)}
                            className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:border-hub-indigo/50 focus:bg-hub-indigo/5 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <div className="flex-1 h-px bg-border/50" />and / or<div className="flex-1 h-px bg-border/50" />
                    </div>

                    {/* Written Response */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Written Response
                        </label>
                        <textarea
                            rows={6}
                            placeholder="Describe your approach, methodology, and results…"
                            value={submissionText}
                            onChange={e => setSubmissionText(e.target.value)}
                            className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:border-hub-indigo/50 focus:bg-hub-indigo/5 transition-all resize-none"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Additional Notes (optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Any context for your instructor…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:border-hub-indigo/50 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-hub-rose bg-hub-rose/10 border border-hub-rose/20 rounded-xl px-4 py-3 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold tracking-wide hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {submitting ? "Submitting…" : isResubmittable ? "Resubmit Work" : "Submit Assessment"}
                    </button>
                </form>
            )}
        </div>
    );
}
