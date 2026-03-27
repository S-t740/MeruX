"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCourseResults } from "@/lib/actions/assessment";
import { cn } from "@/lib/utils";
import {
    Award, CheckCircle2, X, Star, BarChart2, Clipboard,
    FileText, Trophy, Download, ExternalLink, ChevronLeft
} from "lucide-react";

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const dash = (score / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90">
                    <circle cx={48} cy={48} r={radius} fill="none" stroke="currentColor" strokeWidth={8} className="text-accent" />
                    <circle
                        cx={48} cy={48} r={radius} fill="none"
                        stroke={color} strokeWidth={8}
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-outfit font-bold text-xl">
                    {Math.round(score)}%
                </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">{label}</p>
        </div>
    );
}

export default function CourseResultsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const supabase = createClient();
    const [results, setResults] = useState<any>(null);
    const [certificate, setCertificate] = useState<any>(null);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const [resData, courseRes] = await Promise.all([
                getCourseResults(user.id, id),
                supabase.from("courses").select("title, instructor_id, profiles!instructor_id(full_name)").eq("id", id).single(),
            ]);

            setResults(resData.results);
            setCertificate(resData.certificate);
            setCourse(courseRes.data);
            setLoading(false);
        };
        load();
    }, [id, supabase, router]);

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading results…</div>;

    const gradeColors: Record<string, string> = {
        distinction: "#6d5dfc",
        credit: "#00c4a7",
        pass: "#f59e0b",
        fail: "#f43f5e",
    };
    const gradeColor = gradeColors[results?.grade || "fail"] || "#888";

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
            <button
                onClick={() => router.push(`/courses/${id}`)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-hub-indigo transition-colors font-bold group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Course
            </button>

            {/* Header Result Banner */}
            <div className={cn(
                "premium-card p-10 text-center space-y-4 border-2",
                results?.status === "pass" ? "border-hub-teal/30 bg-hub-teal/5" :
                    results?.status === "fail" ? "border-hub-rose/30 bg-hub-rose/5" :
                        "border-border/50"
            )}>
                <div className={cn(
                    "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
                    results?.status === "pass" ? "bg-hub-teal/10 text-hub-teal" :
                        results?.status === "fail" ? "bg-hub-rose/10 text-hub-rose" : "bg-accent text-muted-foreground"
                )}>
                    {results?.status === "pass" ? <Trophy className="w-10 h-10" /> :
                        results?.status === "fail" ? <X className="w-10 h-10" /> :
                            <BarChart2 className="w-10 h-10" />}
                </div>
                <h1 className="text-3xl font-outfit font-bold">
                    {results?.status === "pass" ? "Course Passed!" :
                        results?.status === "fail" ? "Not Passed" : "In Progress"}
                </h1>
                <p className="text-muted-foreground font-medium text-lg">{course?.title}</p>

                {results?.grade && (
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-lg"
                        style={{ backgroundColor: gradeColor }}>
                        <Star className="w-5 h-5" />
                        {results.grade.charAt(0).toUpperCase() + results.grade.slice(1)}
                    </div>
                )}
            </div>

            {/* Score Breakdown */}
            {results && (
                <div className="premium-card p-8 space-y-6">
                    <h2 className="font-outfit font-bold text-lg">Score Breakdown</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                        <ScoreRing score={results.quiz_average || 0} label="Quiz Average" color="#6d5dfc" />
                        <ScoreRing score={results.skills_score || 0} label="Skills Assessment" color="#00c4a7" />
                        <ScoreRing score={results.final_exam_score || 0} label="Final Exam" color="#f59e0b" />
                        <ScoreRing score={results.overall_score || 0} label="Overall Score" color={gradeColor} />
                    </div>

                    <div className="bg-accent/20 border border-border/30 rounded-xl p-4 space-y-2 text-sm font-medium">
                        <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Weighted Formula</p>
                        <p className="text-foreground/80">
                            Overall = (<span className="text-hub-indigo font-bold">Quiz {results.quiz_average}%</span> × 0.3) +
                            (<span className="text-hub-teal font-bold">Skills {results.skills_score}%</span> × 0.2) +
                            (<span className="text-amber-500 font-bold">Final {results.final_exam_score}%</span> × 0.5)
                            = <span className="text-foreground font-bold">{results.overall_score}%</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className={cn("rounded-xl p-4 border font-medium",
                            results.final_exam_score >= 60 ? "border-hub-teal/30 bg-hub-teal/5 text-hub-teal" : "border-hub-rose/30 bg-hub-rose/5 text-hub-rose"
                        )}>
                            {results.final_exam_score >= 60 ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <X className="w-4 h-4 inline mr-2" />}
                            Final Exam ≥ 60% ({results.final_exam_score}%)
                        </div>
                        <div className={cn("rounded-xl p-4 border font-medium",
                            results.overall_score >= 70 ? "border-hub-teal/30 bg-hub-teal/5 text-hub-teal" : "border-hub-rose/30 bg-hub-rose/5 text-hub-rose"
                        )}>
                            {results.overall_score >= 70 ? <CheckCircle2 className="w-4 h-4 inline mr-2" /> : <X className="w-4 h-4 inline mr-2" />}
                            Overall ≥ 70% ({results.overall_score}%)
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate */}
            {certificate && (
                <div className="premium-card p-8 bg-gradient-to-br from-hub-indigo/10 via-hub-teal/5 to-background border-hub-indigo/20 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center text-hub-indigo">
                            <Award className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">Certificate of Completion</p>
                            <h3 className="font-outfit font-bold text-xl">Certificate Issued</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-background/50 border border-border/30 rounded-xl p-3 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certificate Code</p>
                            <p className="font-bold font-mono text-xs tracking-wider">{certificate.certificate_code}</p>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-3 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued On</p>
                            <p className="font-bold text-sm">{new Date(certificate.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href={`/certificate/${certificate.certificate_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-hub-indigo text-white rounded-xl font-bold text-sm hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20"
                        >
                            <ExternalLink className="w-4 h-4" /> View Certificate
                        </a>
                    </div>
                </div>
            )}

            {!results && (
                <div className="premium-card p-8 text-center text-muted-foreground space-y-2">
                    <BarChart2 className="w-10 h-10 mx-auto opacity-40" />
                    <p className="font-medium">No results yet. Complete the course assessments to see your scores here.</p>
                </div>
            )}
        </div>
    );
}
