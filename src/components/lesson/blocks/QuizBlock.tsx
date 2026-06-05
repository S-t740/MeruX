'use client';

import { QuizData, QuizQuestion } from '@/types/lesson-json';
import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

function QuestionCard({ q, index }: { q: QuizQuestion; index: number }) {
    const [selected, setSelected] = useState<string | null>(null);
    const isAnswered = selected !== null;
    const isCorrect = selected === q.correct_answer;

    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-hub-indigo/10 flex items-center justify-center text-hub-indigo font-bold text-xs shrink-0 mt-0.5">
                    {index + 1}
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{q.question}</p>
            </div>

            <div className="grid gap-2 pl-10">
                {q.options.map((opt, i) => {
                    const isSelected = selected === opt;
                    const isRight = opt === q.correct_answer;
                    let style = 'border-border/50 bg-accent/20 hover:bg-accent/50 hover:border-hub-indigo/30 text-foreground/80';
                    if (isAnswered) {
                        if (isRight) style = 'border-hub-teal/50 bg-hub-teal/10 text-hub-teal font-semibold';
                        else if (isSelected && !isRight) style = 'border-hub-rose/50 bg-hub-rose/10 text-hub-rose';
                        else style = 'border-border/30 bg-accent/10 text-muted-foreground opacity-60';
                    }
                    return (
                        <button
                            key={i}
                            onClick={() => !isAnswered && setSelected(opt)}
                            disabled={isAnswered}
                            className={cn('w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all', style)}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className={cn('ml-10 flex items-start gap-2 rounded-xl p-3 text-sm', isCorrect ? 'bg-hub-teal/5 border border-hub-teal/20' : 'bg-hub-rose/5 border border-hub-rose/20')}>
                    {isCorrect
                        ? <CheckCircle className="w-4 h-4 text-hub-teal shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-hub-rose shrink-0 mt-0.5" />
                    }
                    <p className={cn('text-sm leading-relaxed', isCorrect ? 'text-hub-teal' : 'text-hub-rose')}>
                        {q.explanation}
                    </p>
                </div>
            )}
        </div>
    );
}

export function QuizBlock({ data }: { data: QuizData }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-hub-amber" />
                    <p className="font-bold text-sm font-outfit">{data.title}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {data.time_limit_minutes} min
                </div>
            </div>
            <div className="space-y-3">
                {data.questions.map((q, i) => (
                    <QuestionCard key={i} q={q} index={i} />
                ))}
            </div>
        </div>
    );
}
