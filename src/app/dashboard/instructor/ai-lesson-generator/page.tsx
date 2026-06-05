"use client"

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Sparkles, BookOpen, Layers, FileText, ChevronDown,
    Copy, Download, RefreshCw, CheckCircle2, AlertCircle,
    Loader2, Wand2, Clock, Hash, ArrowLeft, Send, X,
    ChevronRight, Save, Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LessonJSON } from "@/types/lesson-json";
import { LessonRenderer } from "@/components/lesson/LessonRenderer";
import { AdoptToCourseModal } from "@/components/lesson/AdoptToCourseModal";

/* ─────────────── Types ─────────────── */
type Difficulty = "beginner" | "intermediate" | "advanced";
type ActiveTab = "form" | "preview";

interface FormState {
    courseTitle: string;
    moduleTitle: string;
    lessonTitle: string;
    difficulty: Difficulty;
    rawNotes: string;
}

/* ─────────────── Helpers ─────────────── */
function wordCount(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function readTime(words: number) {
    return Math.max(1, Math.ceil(words / 200));
}



/* ─────────────── Empty State ─────────────── */
function EmptyPreview() {
    const sections = [
        "📋 Lesson Metadata (JSON)",
        "🎯 Overview & Learning Outcomes",
        "📚 Key Concepts with Examples",
        "📊 Comparison Tables",
        "🖼️ Image Placeholder Prompts",
        "🌍 Real-World Use Cases",
        "🃏 Flashcards & Mini Quiz",
        "🔬 Hands-on Practice Lab",
        "📝 Exam-Style Questions",
        "📖 Glossary & Summary",
        "🔗 Next Lesson Bridge",
        "✅ Instructor Review Checklist",
    ];
    return (
        <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center space-y-8">
            <div className="w-20 h-20 rounded-3xl bg-hub-indigo/10 border border-hub-indigo/20 flex items-center justify-center">
                <Wand2 className="w-9 h-9 text-hub-indigo" />
            </div>
            <div className="space-y-3 max-w-sm">
                <h3 className="text-xl font-outfit font-bold">AI Will Generate</h3>
                <p className="text-sm text-muted-foreground">Fill in the form and click <span className="text-hub-indigo font-bold">Generate Lesson</span> — your structured lesson will appear here, streamed live.</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
                {sections.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-left px-4 py-2 rounded-xl bg-accent/20 border border-border/30">
                        <span className="text-sm">{s}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────── Main Page ─────────────── */
export default function AILessonGeneratorPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({
        courseTitle: "",
        moduleTitle: "",
        lessonTitle: "",
        difficulty: "beginner",
        rawNotes: "",
    });
    const [output, setOutput] = useState("");
    const [lessonJSON, setLessonJSON] = useState<LessonJSON | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("form");
    const [showAdoptModal, setShowAdoptModal] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    /* ── Input handlers ── */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /* ── Generate ── */
    const handleGenerate = useCallback(async () => {
        setError(null);
        setOutput("");
        setLessonJSON(null);

        if (!form.courseTitle.trim() || !form.moduleTitle.trim() || !form.lessonTitle.trim()) {
            setError("Please fill in Course Title, Module Title, and Lesson Title.");
            return;
        }
        if (form.rawNotes.trim().length < 50) {
            setError("Raw notes must be at least 50 characters.");
            return;
        }

        setIsGenerating(true);
        setActiveTab("preview");

        try {
            const res = await fetch("/api/ai/lesson-generator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || `Server error ${res.status}`);
            }

            const lesson = data.lesson as LessonJSON;
            setLessonJSON(lesson);
            setOutput(JSON.stringify(lesson, null, 2));
        } catch (err: any) {
            setError(err.message || "Generation failed. Please try again.");
            setActiveTab("form");
        } finally {
            setIsGenerating(false);
        }
    }, [form]);

    /* ── Copy JSON ── */
    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* ── Download JSON ── */
    const handleDownload = () => {
        const safeName = (form.lessonTitle || "lesson").replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const blob = new Blob([output], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_somaflow.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const words = wordCount(output);
    const hasOutput = output.length > 0;
    const notesLength = form.rawNotes.trim().length;

    /* ── Difficulty colors ── */
    const difficultyColor: Record<Difficulty, string> = {
        beginner: "text-hub-teal bg-hub-teal/10 border-hub-teal/20",
        intermediate: "text-hub-amber bg-hub-amber/10 border-hub-amber/20",
        advanced: "text-hub-rose bg-hub-rose/10 border-hub-rose/20",
    };

    return (
        <div className="flex flex-col h-full min-h-0 space-y-0 pb-0 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8">

            {/* Adopt Modal */}
            {showAdoptModal && lessonJSON && (
                <AdoptToCourseModal
                    lessonJSON={lessonJSON}
                    onClose={() => setShowAdoptModal(false)}
                />
            )}

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl bg-accent/40 hover:bg-accent border border-border/50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Tools
                            </div>
                            <h1 className="text-2xl font-outfit font-bold leading-tight">Lesson Generator</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Paste raw notes → get a fully structured, interactive lesson</p>
                        </div>
                    </div>

                    {/* Preview toolbar (desktop) */}
                    {hasOutput && (
                        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                            <div className="flex items-center gap-3 px-4 py-2 bg-accent/30 rounded-xl border border-border/50 text-xs text-muted-foreground font-medium">
                                <Hash className="w-3.5 h-3.5" />
                                {lessonJSON?.blocks.length ?? 0} blocks
                                <span className="w-px h-3 bg-border" />
                                <Clock className="w-3.5 h-3.5" />
                                ~{lessonJSON?.metadata.estimated_time_minutes ?? readTime(words)} min
                            </div>
                            <button onClick={handleCopy} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all", copied ? "bg-hub-teal/10 border-hub-teal/30 text-hub-teal" : "bg-accent/30 border-border/50 hover:bg-accent")}>
                                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy JSON"}
                            </button>
                            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/30 border border-border/50 text-xs font-bold hover:bg-accent transition-all">
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </button>
                            <button onClick={() => setShowAdoptModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hub-teal text-white text-xs font-bold hover:bg-hub-teal/90 transition-all shadow-lg shadow-hub-teal/20">
                                <Send className="w-3.5 h-3.5" />
                                Adopt to Course
                            </button>
                            <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hub-indigo/10 border border-hub-indigo/20 text-hub-indigo text-xs font-bold hover:bg-hub-indigo/20 transition-all disabled:opacity-50">
                                <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                                Regenerate
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile tab bar */}
                <div className="sm:hidden flex mt-4 bg-accent/30 rounded-xl p-1 max-w-xs">
                    {(['form', 'preview'] as ActiveTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn("flex-1 py-2 px-4 rounded-lg text-xs font-bold capitalize transition-all", activeTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                        >
                            {tab === 'form' ? '📝 Form' : '👁️ Preview'}
                            {tab === 'preview' && isGenerating && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-hub-indigo animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Error Banner ───────────────────────────────────── */}
            {error && (
                <div className="px-4 md:px-6 lg:px-8 py-3 bg-red-500/10 border-b border-red-500/20">
                    <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
                    </div>
                </div>
            )}

            {/* ── Main Split Pane ─────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>

                {/* LEFT: Input Form */}
                <div className={cn(
                    "w-full sm:w-[42%] lg:w-[38%] shrink-0 border-r border-border/50 overflow-y-auto custom-scrollbar bg-background",
                    "sm:!block",
                    activeTab !== "form" && "hidden sm:block"
                )}>
                    <div className="p-6 space-y-6">

                        {/* Course Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <BookOpen className="w-3.5 h-3.5" />
                                Course Title <span className="text-hub-rose">*</span>
                            </label>
                            <input
                                name="courseTitle"
                                value={form.courseTitle}
                                onChange={handleChange}
                                placeholder="e.g. Introduction to Networking"
                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/40 focus:border-hub-indigo/50 text-sm font-medium transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Module Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <Layers className="w-3.5 h-3.5" />
                                Module Title <span className="text-hub-rose">*</span>
                            </label>
                            <input
                                name="moduleTitle"
                                value={form.moduleTitle}
                                onChange={handleChange}
                                placeholder="e.g. Module 2: TCP/IP Fundamentals"
                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/40 focus:border-hub-indigo/50 text-sm font-medium transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Lesson Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <FileText className="w-3.5 h-3.5" />
                                Lesson Title <span className="text-hub-rose">*</span>
                            </label>
                            <input
                                name="lessonTitle"
                                value={form.lessonTitle}
                                onChange={handleChange}
                                placeholder="e.g. Lesson 3: IP Addressing"
                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/40 focus:border-hub-indigo/50 text-sm font-medium transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <ChevronDown className="w-3.5 h-3.5" />
                                Difficulty Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                                        className={cn(
                                            "py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all",
                                            form.difficulty === d
                                                ? difficultyColor[d]
                                                : "bg-accent/20 border-border/50 text-muted-foreground hover:bg-accent"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Raw Notes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    📝 Raw Notes <span className="text-hub-rose">*</span>
                                </label>
                                <span className={cn("text-[10px] font-bold tabular-nums", notesLength < 50 ? "text-hub-rose" : "text-hub-teal")}>
                                    {notesLength} / 50 min chars
                                </span>
                            </div>
                            <textarea
                                name="rawNotes"
                                value={form.rawNotes}
                                onChange={handleChange}
                                rows={16}
                                placeholder={"Paste your raw lesson notes here...\n\nThis can be:\n• Bullet points or outlines\n• Copied text from a doc\n• Rough notes from a lecture\n• A topic list with key ideas\n\nThe AI will structure it into a full interactive lesson."}
                                className="w-full bg-accent/30 border border-border/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-indigo/40 focus:border-hub-indigo/50 text-sm font-medium resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed"
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95",
                                isGenerating
                                    ? "bg-accent border border-border/50 text-muted-foreground cursor-not-allowed opacity-70"
                                    : "bg-gradient-to-r from-hub-indigo to-hub-indigo/80 text-white hover:from-hub-indigo/90 hover:to-hub-indigo/70 shadow-hub-indigo/25"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating... (30–60s)
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Lesson ✨
                                </>
                            )}
                        </button>

                        {/* Adopt button (mobile) */}
                        {hasOutput && (
                            <div className="sm:hidden flex gap-2">
                                <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/30 border border-border/50 text-xs font-bold hover:bg-accent transition-all">
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-hub-teal" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied!" : "Copy JSON"}
                                </button>
                                <button onClick={() => setShowAdoptModal(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-hub-teal text-white text-xs font-bold hover:bg-hub-teal/90 transition-all">
                                    <Send className="w-4 h-4" />
                                    Adopt
                                </button>
                            </div>
                        )}

                        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                            Powered by Gemini 2.5 Flash · SomaFlow Standardized JSON · Always review before publishing
                        </p>
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className={cn(
                    "flex-1 overflow-y-auto custom-scrollbar bg-accent/5",
                    "sm:!block",
                    activeTab !== "preview" && "hidden sm:block"
                )}>
                    {!hasOutput && !isGenerating ? (
                        <EmptyPreview />
                    ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-hub-indigo/10 to-hub-purple/10 border border-hub-indigo/20 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-hub-indigo animate-pulse" />
                                </div>
                                <div className="absolute inset-0 rounded-3xl border-2 border-hub-indigo/20 animate-ping" />
                            </div>
                            <div>
                                <p className="font-bold font-outfit text-lg">Building Your Lesson...</p>
                                <p className="text-sm text-muted-foreground mt-1">Generating a standardized 17-section SomaFlow lesson.</p>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-hub-indigo animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    ) : lessonJSON ? (
                        <div className="p-6 lg:p-8">
                            <LessonRenderer lesson={lessonJSON} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
