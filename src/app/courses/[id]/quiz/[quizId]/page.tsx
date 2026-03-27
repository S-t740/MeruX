"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getQuizForStudent, getAttemptCount } from "@/lib/actions/question-bank";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { Lock, Clock, AlertTriangle, ChevronLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizPage() {
    const { id, quizId } = useParams<{ id: string; quizId: string }>();
    const router = useRouter();
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attemptCount, setAttemptCount] = useState(0);
    const [error, setError] = useState("");
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }

            const [quizRes, count] = await Promise.all([
                getQuizForStudent(quizId),
                getAttemptCount(quizId, user.id),
            ]);

            if (quizRes.error) { setError(quizRes.error); setLoading(false); return; }
            setQuiz(quizRes.data);
            setAttemptCount(count);
            setLoading(false);
        };
        load();
    }, [quizId, router]);

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">Loading assessment…</div>;

    if (error) return (
        <div className="p-12 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-hub-rose mx-auto" />
            <p className="text-muted-foreground">{error}</p>
        </div>
    );

    const attemptsExhausted = quiz && quiz.type !== "practice" && quiz.max_attempts > 0 && attemptCount >= quiz.max_attempts;

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <button
                onClick={() => router.push(`/courses/${id}`)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-hub-indigo transition-colors font-bold group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Course
            </button>

            {!started ? (
                /* ── Pre-quiz lobby ── */
                <div className="premium-card p-10 space-y-6 text-center">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center",
                        quiz.type === "final" ? "bg-hub-rose/10 text-hub-rose" :
                            quiz.type === "practice" ? "bg-hub-teal/10 text-hub-teal" :
                                "bg-hub-indigo/10 text-hub-indigo"
                    )}>
                        <BookOpen className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-outfit font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground font-medium">{quiz.description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        {[
                            { label: "Questions", value: quiz.questions?.length || 0 },
                            { label: "Time Limit", value: quiz.time_limit ? `${quiz.time_limit} min` : "No limit" },
                            { label: "Passing Score", value: `${quiz.passing_score}%` },
                            { label: "Max Attempts", value: quiz.type === "practice" ? "Unlimited" : quiz.max_attempts },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-accent/20 border border-border/30 rounded-xl p-3 space-y-0.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                                <p className="font-outfit font-bold text-lg">{value}</p>
                            </div>
                        ))}
                    </div>

                    {attemptCount > 0 && quiz.type !== "practice" && (
                        <p className="text-sm text-amber-600 bg-amber-500/10 border border-amber-300/30 rounded-xl px-4 py-2 font-medium">
                            ⚠️ You have used {attemptCount} of {quiz.max_attempts} attempt{quiz.max_attempts > 1 ? "s" : ""}.
                        </p>
                    )}

                    {attemptsExhausted ? (
                        <div className="flex flex-col items-center gap-3 pt-4">
                            <div className="text-hub-rose flex items-center gap-2 font-bold">
                                <Lock className="w-5 h-5" /> Maximum attempts reached
                            </div>
                            <p className="text-sm text-muted-foreground">Contact your instructor if you need an exception.</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setStarted(true)}
                            className={cn(
                                "w-full py-4 text-white rounded-xl font-bold text-lg shadow-xl transition-all active:scale-95",
                                quiz.type === "final" ? "bg-hub-rose hover:bg-hub-rose/90 shadow-hub-rose/20" :
                                    quiz.type === "practice" ? "bg-hub-teal hover:bg-hub-teal/90 shadow-hub-teal/20" :
                                        "bg-hub-indigo hover:bg-hub-indigo/90 shadow-hub-indigo/20"
                            )}
                        >
                            {attemptCount > 0 ? "Retake" : "Begin"} {quiz.type === "final" ? "Final Exam" : quiz.type === "practice" ? "Practice" : "Quiz"}
                        </button>
                    )}
                </div>
            ) : (
                /* ── Quiz Player ── */
                <QuizPlayer quiz={quiz} courseId={id} attemptNumber={attemptCount + 1} />
            )}
        </div>
    );
}
