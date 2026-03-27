"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { gradeSkillsSubmission, getPendingSubmissions } from "@/lib/actions/assessment";
import { cn } from "@/lib/utils";
import {
    ClipboardCheck, User, ExternalLink, CheckCircle2, Clock,
    Star, AlertCircle, ChevronDown, ChevronUp, Send
} from "lucide-react";

export default function InstructorAssessmentsPage() {
    const supabase = createClient();
    const [userId, setUserId] = useState("");
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadSubmissions = async (courseId: string) => {
        const res = await getPendingSubmissions(courseId);
        setSubmissions(res.data || []);
    };

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data: coursesData } = await supabase.from("courses").select("id, title").eq("instructor_id", user.id);
            setCourses(coursesData || []);
            if (coursesData && coursesData.length > 0) {
                setSelectedCourse(coursesData[0].id);
                await loadSubmissions(coursesData[0].id);
            }
            setLoading(false);
        };
        load();
    }, [supabase]);

    useEffect(() => {
        if (selectedCourse) loadSubmissions(selectedCourse);
    }, [selectedCourse]);

    const handleGrade = async (submissionId: string) => {
        setSaving(true); setError("");
        const score = parseInt(gradeForm.score);
        if (isNaN(score) || score < 0) { setError("Enter a valid score."); setSaving(false); return; }

        const res = await gradeSkillsSubmission(submissionId, userId, {
            score, feedback: gradeForm.feedback,
        });

        if (res.error) { setError(res.error); setSaving(false); return; }
        setGradingId(null); setGradeForm({ score: "", feedback: "" });
        await loadSubmissions(selectedCourse);
        setSaving(false);
    };

    const statusBadge = (status: string) =>
        status === "graded" ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20" :
        status === "under_review" ? "bg-amber-500/10 text-amber-600 border-amber-300/20" :
        "bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20";

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading…</div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
                        <ClipboardCheck className="w-7 h-7 text-hub-indigo" /> Skills Grading Panel
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Review and grade student practical submissions.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-hub-rose/10 border border-hub-rose/20 rounded-xl px-4 py-2">
                    <AlertCircle className="w-4 h-4 text-hub-rose" />
                    <span className="text-hub-rose font-bold text-sm">{submissions.length} Pending</span>
                </div>
            </div>

            {/* Course Selector */}
            <div className="flex items-center gap-3 flex-wrap">
                {courses.map(c => (
                    <button key={c.id} onClick={() => setSelectedCourse(c.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all border",
                            selectedCourse === c.id ? "bg-hub-indigo text-white border-hub-indigo" : "border-border/50 text-muted-foreground hover:bg-accent")}>
                        {c.title}
                    </button>
                ))}
            </div>

            {/* Submissions */}
            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <div className="premium-card p-10 text-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-hub-teal/40 mx-auto" />
                        <p className="text-muted-foreground font-medium">No pending submissions — all caught up! 🎉</p>
                    </div>
                ) : submissions.map(sub => {
                    const isExpanded = expandedId === sub.id;
                    const isGrading = gradingId === sub.id;
                    const maxScore = sub.skills_assessments?.max_score || 100;
                    const passScore = sub.skills_assessments?.passing_score || 60;

                    return (
                        <div key={sub.id} className="premium-card overflow-hidden">
                            <div className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold">{sub.profiles?.full_name || "Student"}</p>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", statusBadge(sub.status))}>
                                            {sub.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                        {sub.skills_assessments?.title} ·
                                        Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {sub.score !== null && (
                                    <div className={cn("text-2xl font-outfit font-bold",
                                        sub.score >= passScore ? "text-hub-teal" : "text-hub-rose")}>
                                        {sub.score}/{maxScore}
                                    </div>
                                )}
                                <button onClick={() => { setExpandedId(isExpanded ? null : sub.id); setGradingId(null); }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-border/50 p-5 space-y-4 bg-accent/5">
                                    {/* Submission Content */}
                                    {sub.submission_url && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submitted Link</p>
                                            <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-hub-indigo font-medium text-sm hover:underline">
                                                <ExternalLink className="w-4 h-4 shrink-0" />
                                                {sub.submission_url}
                                            </a>
                                        </div>
                                    )}
                                    {sub.submission_text && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Written Response</p>
                                            <div className="bg-background/60 border border-border/30 rounded-xl p-4 text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {sub.submission_text}
                                            </div>
                                        </div>
                                    )}
                                    {sub.notes && (
                                        <div className="text-xs text-muted-foreground bg-accent/20 rounded-lg px-3 py-2">
                                            <strong>Notes:</strong> {sub.notes}
                                        </div>
                                    )}

                                    {/* Grading Section */}
                                    {sub.status !== "graded" && !isGrading && (
                                        <button onClick={() => { setGradingId(sub.id); setError(""); setGradeForm({ score: "", feedback: "" }); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all">
                                            <Star className="w-4 h-4" /> Grade This Submission
                                        </button>
                                    )}

                                    {isGrading && (
                                        <div className="space-y-3 pt-2 border-t border-border/30">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assign Grade</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-muted-foreground font-bold">Score (out of {maxScore})</label>
                                                    <input type="number" min={0} max={maxScore} value={gradeForm.score}
                                                        onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))}
                                                        className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground font-bold">Feedback</label>
                                                <textarea rows={3} value={gradeForm.feedback}
                                                    onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))}
                                                    placeholder="Explain the grade and provide actionable feedback…"
                                                    className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all resize-none" />
                                            </div>
                                            {error && <p className="text-hub-rose text-sm font-medium">{error}</p>}
                                            <div className="flex gap-2">
                                                <button onClick={() => handleGrade(sub.id)} disabled={saving}
                                                    className="flex items-center gap-2 px-5 py-2 bg-hub-teal text-white rounded-xl text-sm font-bold hover:bg-hub-teal/90 transition-all disabled:opacity-50">
                                                    <Send className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Grade"}
                                                </button>
                                                <button onClick={() => setGradingId(null)}
                                                    className="px-4 py-2 border border-border/50 text-muted-foreground rounded-xl text-sm font-bold hover:bg-accent transition-all">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {sub.status === "graded" && sub.feedback && (
                                        <div className="bg-hub-teal/5 border border-hub-teal/20 rounded-xl p-4 text-sm font-medium space-y-1">
                                            <p className="font-bold text-hub-teal text-xs uppercase tracking-widest">Feedback Sent</p>
                                            <p className="text-muted-foreground">{sub.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
