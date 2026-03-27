"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addBankQuestion, updateBankQuestion, deleteBankQuestion } from "@/lib/actions/question-bank";
import { cn } from "@/lib/utils";
import {
    Plus, Trash2, Edit2, CheckCircle2, X, ChevronDown, ChevronUp,
    BookOpen, Filter, Search, Lightbulb
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const TYPES = ["mcq", "true_false", "short_answer", "scenario"] as const;

export default function QuestionBankPage() {
    const supabase = createClient();
    const [questions, setQuestions] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterDiff, setFilterDiff] = useState("");

    // Form state
    const [form, setForm] = useState({
        topic: "", difficulty: "medium" as typeof DIFFICULTIES[number],
        question_type: "mcq" as typeof TYPES[number],
        question_text: "", explanation: "",
        options: [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
        ],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: coursesData } = await supabase.from("courses").select("id, title").eq("instructor_id", user.id);
        setCourses(coursesData || []);
        if (coursesData && coursesData.length > 0 && !selectedCourse) {
            setSelectedCourse(coursesData[0].id);
        }
        setLoading(false);
    };

    const loadQuestions = async () => {
        if (!selectedCourse) return;
        const { data } = await supabase
            .from("question_bank")
            .select("*, question_options(id, option_text, is_correct, position)")
            .eq("course_id", selectedCourse)
            .order("topic").order("created_at", { ascending: false });
        setQuestions(data || []);
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { loadQuestions(); }, [selectedCourse]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSaving(true);
        try {
            const options = ["mcq", "true_false"].includes(form.question_type) ? form.options : undefined;
            const res = await addBankQuestion(selectedCourse, userId, {
                topic: form.topic, difficulty: form.difficulty,
                question_type: form.question_type, question_text: form.question_text,
                explanation: form.explanation || undefined, options,
            });
            if (res.error) throw new Error(res.error);
            setShowForm(false);
            resetForm();
            loadQuestions();
        } catch (e: any) { setError(e.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this question?")) return;
        await deleteBankQuestion(id);
        loadQuestions();
    };

    const resetForm = () => setForm({
        topic: "", difficulty: "medium", question_type: "mcq",
        question_text: "", explanation: "",
        options: [
            { option_text: "", is_correct: true }, { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }, { option_text: "", is_correct: false },
        ],
    });

    const diffColor = (d: string) =>
        d === "hard" ? "text-hub-rose bg-hub-rose/10 border-hub-rose/20" :
        d === "medium" ? "text-amber-600 bg-amber-500/10 border-amber-300/20" :
        "text-hub-teal bg-hub-teal/10 border-hub-teal/20";

    const filtered = questions.filter(q =>
        (!filterDiff || q.difficulty === filterDiff) &&
        (!search || q.question_text.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading…</div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-hub-indigo" /> Question Bank
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage your reusable question pool for auto-generated quizzes.</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); resetForm(); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/20">
                    <Plus className="w-4 h-4" /> Add Question
                </button>
            </div>

            {/* Course Selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Course:</span>
                {courses.map(c => (
                    <button key={c.id} onClick={() => setSelectedCourse(c.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all border",
                            selectedCourse === c.id ? "bg-hub-indigo text-white border-hub-indigo" : "border-border/50 text-muted-foreground hover:bg-accent")}>
                        {c.title}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search questions…"
                        className="bg-accent/20 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all w-64" />
                </div>
                {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => setFilterDiff(filterDiff === d ? "" : d)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                            filterDiff === d ? diffColor(d) : "border-border/50 text-muted-foreground hover:bg-accent")}>
                        {d}
                    </button>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">{filtered.length} question{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSave} className="premium-card p-8 space-y-5 border-hub-indigo/20">
                    <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5 text-hub-indigo" /> New Question
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topic</label>
                            <input required value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                                placeholder="e.g. Networking" className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Difficulty</label>
                            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as any }))}
                                className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all">
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                            <select value={form.question_type} onChange={e => setForm(p => ({ ...p, question_type: e.target.value as any }))}
                                className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all">
                                {TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question Text</label>
                        <textarea required rows={3} value={form.question_text} onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
                            placeholder="Type your question here…"
                            className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all resize-none" />
                    </div>

                    {["mcq", "true_false"].includes(form.question_type) && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Answer Options <span className="text-hub-teal">(click radio to set correct)</span>
                            </label>
                            {(form.question_type === "true_false" ? form.options.slice(0, 2) : form.options).map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <button type="button"
                                        onClick={() => setForm(p => ({ ...p, options: p.options.map((o, j) => ({ ...o, is_correct: i === j })) }))}
                                        className={cn("w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center",
                                            opt.is_correct ? "border-hub-teal bg-hub-teal" : "border-muted-foreground/40 hover:border-hub-teal")}>
                                        {opt.is_correct && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </button>
                                    <input value={form.question_type === "true_false" ? (i === 0 ? "True" : "False") : opt.option_text}
                                        readOnly={form.question_type === "true_false"}
                                        onChange={e => setForm(p => ({ ...p, options: p.options.map((o, j) => j === i ? { ...o, option_text: e.target.value } : o) }))}
                                        placeholder={`Option ${i + 1}`}
                                        className="flex-1 bg-accent/20 border border-border/50 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all" />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Explanation (shown after attempt)</label>
                        <input value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                            placeholder="Why is this the correct answer?"
                            className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-hub-indigo/50 transition-all" />
                    </div>

                    {error && <p className="text-hub-rose text-sm font-medium bg-hub-rose/10 px-4 py-2 rounded-xl">{error}</p>}

                    <div className="flex gap-3">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all disabled:opacity-50">
                            {saving ? "Saving…" : "Save Question"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="px-6 py-2.5 border border-border/50 text-muted-foreground rounded-xl font-bold hover:bg-accent transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Question List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="premium-card p-10 text-center space-y-3">
                        <Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                        <p className="text-muted-foreground font-medium">No questions found. Add your first question above.</p>
                    </div>
                ) : filtered.map(q => (
                    <div key={q.id} className="premium-card p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", diffColor(q.difficulty))}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-accent text-muted-foreground px-2 py-0.5 rounded border border-border/30">
                                        {q.question_type}
                                    </span>
                                    {q.topic && <span className="text-xs text-muted-foreground font-medium">{q.topic}</span>}
                                </div>
                                <p className="font-medium text-sm line-clamp-2">{q.question_text}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                                    {expandedId === q.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleDelete(q.id)}
                                    className="p-1.5 text-muted-foreground hover:text-hub-rose rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {expandedId === q.id && (
                            <div className="space-y-2 pt-2 border-t border-border/30">
                                {q.question_options?.map((opt: any) => (
                                    <div key={opt.id} className={cn("flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                                        opt.is_correct ? "bg-hub-teal/10 text-hub-teal font-bold" : "text-muted-foreground")}>
                                        {opt.is_correct ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />}
                                        {opt.option_text}
                                    </div>
                                ))}
                                {q.explanation && (
                                    <div className="flex items-start gap-2 bg-hub-indigo/5 border border-hub-indigo/10 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground mt-2">
                                        <Lightbulb className="w-3.5 h-3.5 text-hub-indigo shrink-0 mt-0.5" />
                                        <span>{q.explanation}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
