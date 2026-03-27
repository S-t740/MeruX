"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitQuizAttempt } from "@/lib/actions/quiz";
import { upsertCourseResult } from "@/lib/actions/assessment";
import { cn } from "@/lib/utils";
import {
    Clock, CheckCircle2, X, ChevronRight, ChevronLeft,
    Gamepad2, AlertTriangle, Lock, Award
} from "lucide-react";

interface Option { id: string; option_text: string; }
interface Question {
    id: string; quiz_id: string; points: number; position: number;
    question_text: string; question_type: string; topic?: string;
    difficulty?: string; options: Option[];
}
interface Quiz {
    id: string; title: string; type: string; time_limit: number | null;
    passing_score: number; max_attempts: number; course_id: string;
    module_id: string | null; show_answers: boolean; questions: Question[];
}

interface QuizPlayerProps {
    quiz: Quiz;
    courseId: string;
    attemptNumber?: number;
}

export function QuizPlayer({ quiz, courseId, attemptNumber = 1 }: QuizPlayerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null);
    const hasAutoSubmitted = useRef(false);

    const questions = quiz.questions || [];
    const currentQ = questions[currentIndex];
    const isPractice = quiz.type === "practice";

    // ── Timer ──────────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null || result) return;
        if (timeLeft <= 0) {
            if (!hasAutoSubmitted.current) { hasAutoSubmitted.current = true; handleSubmit(true); }
            return;
        }
        const tick = setInterval(() => setTimeLeft(p => p !== null ? p - 1 : null), 1000);
        return () => clearInterval(tick);
    }, [timeLeft, result]);

    const formatTime = (secs: number) =>
        `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

    // ── Select answer ──────────────────────────────────────────
    const selectAnswer = (questionId: string, optionId: string) => {
        if (result && !isPractice) return;
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    // ── Submit ─────────────────────────────────────────────────
    const handleSubmit = useCallback(async (isAuto = false) => {
        if (submitting) return;
        if (!isAuto && Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Not authenticated."); return; }

            const res = await submitQuizAttempt(user.id, quiz.id, answers);
            if (res.error) throw new Error(res.error);

            setResult({
                score: res.score,
                passed: res.passed,
                earnedTokens: res.earnedTokens ?? 0,
            });

            // If this was a final exam, recompute course results
            if (quiz.type === "final") {
                await upsertCourseResult(user.id, courseId, { final_exam_score: res.score });
            }
        } catch (e: any) {
            alert(e.message || "Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    }, [answers, quiz.id, submitting, supabase, courseId, quiz.type, questions.length]);

    // ── Difficulty badge ────────────────────────────────────────
    const difficultyColor = (d?: string) =>
        d === "hard" ? "text-hub-rose bg-hub-rose/10" :
            d === "medium" ? "text-hub-amber bg-amber-500/10" :
                "text-hub-teal bg-hub-teal/10";

    // ─────────────────────────────────────────────────────────
    // RESULT SCREEN
    // ─────────────────────────────────────────────────────────
    if (result) {
        return (
            <div className="premium-card p-12 text-center space-y-6 flex flex-col items-center">
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center",
                    result.passed ? "bg-hub-teal/10 text-hub-teal" : "bg-hub-rose/10 text-hub-rose"
                )}>
                    {result.passed ? <Award className="w-12 h-12" /> : <X className="w-10 h-10" />}
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-outfit font-bold">
                        {result.passed ? "✅ Assessment Passed!" : "❌ Not Passed"}
                    </h2>
                    <p className="text-muted-foreground font-medium text-lg">
                        You scored <span className="text-foreground font-bold">{result.score}%</span>
                        &nbsp;· Passing score: <span className="font-bold">{quiz.passing_score}%</span>
                    </p>
                </div>

                {result.earnedTokens > 0 && (
                    <div className="bg-hub-rose/10 border border-hub-rose/20 rounded-xl p-4 flex items-center gap-3">
                        <Gamepad2 className="w-5 h-5 text-hub-rose animate-pulse" />
                        <span className="font-bold text-hub-rose">+{result.earnedTokens} Learning Tokens Earned!</span>
                    </div>
                )}

                {/* Per-question review for practice mode */}
                {isPractice && quiz.show_answers && (
                    <div className="w-full space-y-4 text-left pt-4 border-t border-border/50">
                        <h3 className="font-outfit font-bold text-sm uppercase tracking-widest text-muted-foreground">
                            Answer Review
                        </h3>
                        {questions.map((q, i) => {
                            const chosen = answers[q.id];
                            const correct = q.options.find((o: any) => o.is_correct);
                            const isCorrect = chosen === correct?.id;
                            return (
                                <div key={q.id} className={cn("rounded-xl p-4 border text-sm space-y-2",
                                    isCorrect ? "border-hub-teal/30 bg-hub-teal/5" : "border-hub-rose/30 bg-hub-rose/5"
                                )}>
                                    <p className="font-medium">{i + 1}. {q.question_text}</p>
                                    <p className={isCorrect ? "text-hub-teal font-bold" : "text-hub-rose font-bold"}>
                                        {isCorrect ? "✓ Correct" : "✗ Incorrect"} — Correct: {correct?.option_text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-4 pt-4 w-full">
                    {!result.passed && isPractice && (
                        <button
                            onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); if (quiz.time_limit) setTimeLeft(quiz.time_limit * 60); hasAutoSubmitted.current = false; }}
                            className="flex-1 px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold transition-all"
                        >
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="flex-1 px-6 py-3 bg-accent text-foreground hover:bg-accent/80 rounded-xl font-bold transition-all"
                    >
                        {result.passed ? "Continue" : "Back to Course"}
                    </button>
                    {result.passed && quiz.type === "final" && (
                        <button
                            onClick={() => router.push(`/courses/${courseId}/results`)}
                            className="flex-1 px-6 py-3 bg-hub-teal text-white rounded-xl font-bold shadow-xl shadow-hub-teal/20 transition-all"
                        >
                            View Certificate →
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────
    // QUIZ PLAYER
    // ─────────────────────────────────────────────────────────
    const answeredCount = Object.keys(answers).length;
    const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header bar */}
            <div className="premium-card p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="font-outfit font-bold text-lg">{quiz.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span className={cn("px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
                            quiz.type === "final" ? "bg-hub-rose/10 text-hub-rose" :
                            quiz.type === "practice" ? "bg-hub-teal/10 text-hub-teal" :
                            "bg-hub-indigo/10 text-hub-indigo"
                        )}>
                            {quiz.type === "final" ? "Final Exam" : quiz.type === "practice" ? "Practice Check" : "Module Quiz"}
                        </span>
                        <span>{questions.length} Questions</span>
                        <span>Pass: {quiz.passing_score}%</span>
                        {attemptNumber > 1 && <span className="text-hub-amber">Attempt {attemptNumber}</span>}
                    </div>
                </div>

                {timeLeft !== null && (
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-bold border text-sm shrink-0",
                        timeLeft < 60 ? "bg-hub-rose/10 text-hub-rose border-hub-rose/30 animate-pulse" :
                            timeLeft < 300 ? "bg-amber-500/10 text-amber-600 border-amber-300/30" :
                                "bg-accent/20 text-foreground border-border/50"
                    )}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className="space-y-1.5 px-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>{answeredCount} Answered</span>
                </div>
                <div className="h-2 w-full bg-accent rounded-full overflow-hidden border border-border/50">
                    <div
                        className="h-full bg-hub-indigo transition-all duration-500 rounded-full"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/* Question dots */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {questions.map((q, i) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentIndex(i)}
                            className={cn("w-7 h-7 rounded-lg text-xs font-bold transition-all",
                                i === currentIndex ? "bg-hub-indigo text-white ring-2 ring-hub-indigo/40" :
                                answers[q.id] ? "bg-hub-teal/20 text-hub-teal" :
                                "bg-accent text-muted-foreground hover:bg-accent/80"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Question */}
            {currentQ && (
                <div className="premium-card p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            {currentQ.topic && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-hub-indigo/10 text-hub-indigo px-2 py-0.5 rounded">
                                        {currentQ.topic}
                                    </span>
                                    {currentQ.difficulty && (
                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded", difficultyColor(currentQ.difficulty))}>
                                            {currentQ.difficulty}
                                        </span>
                                    )}
                                </div>
                            )}
                            <h3 className="text-xl font-outfit font-bold leading-relaxed">{currentQ.question_text}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{currentQ.points} point{currentQ.points !== 1 ? "s" : ""}</p>
                        </div>
                    </div>

                    <div className="space-y-3 pl-2">
                        {(currentQ.options || []).map((opt) => {
                            const isSelected = answers[currentQ.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => selectAnswer(currentQ.id, opt.id)}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-xl border transition-all font-medium flex items-center gap-4 group",
                                        isSelected
                                            ? "bg-hub-indigo/10 border-hub-indigo/50 text-hub-indigo"
                                            : "bg-accent/20 border-border hover:bg-accent/40 hover:border-border/80 text-foreground/80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                        isSelected ? "border-hub-indigo bg-hub-indigo" : "border-muted-foreground/40"
                                    )}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span>{opt.option_text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/50 font-bold text-sm disabled:opacity-40 hover:bg-accent transition-all"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentIndex(p => p + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-hub-indigo text-white font-bold text-sm hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-hub-teal text-white font-bold text-sm hover:bg-hub-teal/90 transition-all shadow-lg shadow-hub-teal/20 disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {submitting ? "Submitting..." : "Submit Answers"}
                    </button>
                )}
            </div>

            {/* Unanswered warning */}
            {answeredCount < questions.length && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 px-4 py-2 rounded-lg font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} not yet answered.
                </div>
            )}
        </div>
    );
}
