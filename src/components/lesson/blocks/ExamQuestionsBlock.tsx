'use client';

import { ExamQuestionsData, ExamQuestion } from '@/types/lesson-json';
import { useState } from 'react';
import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';

function ExamCard({ q, index }: { q: ExamQuestion; index: number }) {
    const [open, setOpen] = useState(false);

    const typeBadge = {
        mcq: 'bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20',
        short_answer: 'bg-hub-teal/10 text-hub-teal border-hub-teal/20',
        scenario: 'bg-hub-purple/10 text-hub-purple border-hub-purple/20',
    }[q.type] || 'bg-accent text-muted-foreground border-border';

    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-accent/20 transition-colors"
            >
                <div className="w-7 h-7 rounded-lg bg-hub-rose/10 text-hub-rose flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${typeBadge}`}>
                            {q.type.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
                </div>
                <div className="shrink-0 mt-1">
                    {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {open && (
                <div className="px-4 pb-4 pl-[3.75rem] space-y-3 animate-fade-in">
                    {q.options && q.options.length > 0 && (
                        <div className="grid gap-1.5">
                            {q.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`px-3 py-2 rounded-lg text-sm border ${opt === q.correct_answer
                                        ? 'bg-hub-teal/10 border-hub-teal/30 text-hub-teal font-semibold'
                                        : 'bg-accent/30 border-border/40 text-foreground/70'
                                        }`}
                                >
                                    {opt === q.correct_answer && '✓ '}{opt}
                                </div>
                            ))}
                        </div>
                    )}
                    {q.type === 'short_answer' && (
                        <div className="rounded-lg bg-hub-teal/5 border border-hub-teal/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-hub-teal mb-1">Model Answer</p>
                            <p className="text-sm text-foreground/80">{q.correct_answer}</p>
                        </div>
                    )}
                    {q.explanation && (
                        <div className="rounded-lg bg-accent/30 p-3 border border-border/30">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Explanation</p>
                            <p className="text-sm text-foreground/70">{q.explanation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ExamQuestionsBlock({ data }: { data: ExamQuestionsData }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-hub-rose" />
                <p className="font-bold text-sm font-outfit">{data.title}</p>
            </div>
            <div className="space-y-2">
                {data.questions.map((q, i) => (
                    <ExamCard key={i} q={q} index={i} />
                ))}
            </div>
        </div>
    );
}
