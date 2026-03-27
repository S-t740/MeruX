"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkillsSubmissionForm } from "@/components/assessment/SkillsSubmissionForm";
import { ChevronLeft, ClipboardCheck } from "lucide-react";

export default function AssessmentPage() {
    const { id, assessmentId } = useParams<{ id: string; assessmentId: string }>();
    const router = useRouter();
    const supabase = createClient();
    const [assessment, setAssessment] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [userId, setUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }
            setUserId(user.id);

            const [asmRes, subRes] = await Promise.all([
                supabase.from("skills_assessments").select("*").eq("id", assessmentId).single(),
                supabase.from("skills_submissions").select("*").eq("assessment_id", assessmentId).eq("student_id", user.id).maybeSingle(),
            ]);

            if (asmRes.data) setAssessment(asmRes.data);
            if (subRes.data) setSubmission(subRes.data);
            setLoading(false);
        };
        load();
    }, [assessmentId, supabase, router]);

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading assessment…</div>;
    if (!assessment) return <div className="p-12 text-center text-muted-foreground">Assessment not found.</div>;

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <button
                onClick={() => router.push(`/courses/${id}`)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-hub-indigo transition-colors font-bold group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Course
            </button>

            {/* Header */}
            <div className="premium-card p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center text-hub-indigo">
                        <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">Skills Assessment</p>
                        <h1 className="text-2xl font-outfit font-bold">{assessment.title}</h1>
                    </div>
                </div>

                {assessment.description && (
                    <div className="bg-accent/20 border border-border/30 rounded-xl p-5 text-sm text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">
                        {assessment.description}
                    </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="bg-accent/20 border border-border/30 rounded-lg px-3 py-1.5 font-medium">
                        Max Score: <span className="font-bold text-foreground">{assessment.max_score}</span>
                    </div>
                    <div className="bg-accent/20 border border-border/30 rounded-lg px-3 py-1.5 font-medium">
                        Passing: <span className="font-bold text-foreground">{assessment.passing_score}</span>
                    </div>
                    <div className="bg-accent/20 border border-border/30 rounded-lg px-3 py-1.5 font-medium capitalize">
                        Grading: <span className="font-bold text-foreground">{assessment.grading_type}</span>
                    </div>
                    {assessment.due_date && (
                        <div className="bg-hub-rose/10 border border-hub-rose/20 rounded-lg px-3 py-1.5 font-medium text-hub-rose">
                            Due: <span className="font-bold">{new Date(assessment.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <SkillsSubmissionForm
                assessment={assessment}
                studentId={userId}
                existingSubmission={submission}
            />
        </div>
    );
}
