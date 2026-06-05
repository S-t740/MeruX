'use client';

import { FillBlankData } from '@/types/lesson-json';
import { useState } from 'react';
import { Eye, EyeOff, PenLine } from 'lucide-react';

export function FillBlankBlock({ data }: { data: FillBlankData }) {
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});

    const toggle = (index: number) =>
        setRevealed(p => ({ ...p, [index]: !p[index] }));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-hub-teal" />
                <p className="font-bold text-sm font-outfit">{data.title}</p>
            </div>
            <div className="space-y-3">
                {data.items.map((item, i) => {
                    const shown = revealed[i];
                    const parts = item.sentence.split('______');
                    return (
                        <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                {parts.map((part, pi) => (
                                    <span key={pi}>
                                        {part}
                                        {pi < parts.length - 1 && (
                                            <span className={`inline-block px-3 py-0.5 mx-1 rounded-lg border font-bold text-sm transition-all ${shown
                                                ? 'bg-hub-teal/10 border-hub-teal/30 text-hub-teal'
                                                : 'bg-accent border-border text-transparent select-none'
                                                }`}>
                                                {shown ? item.answer : item.answer.replace(/./g, '─')}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </p>
                            <button
                                onClick={() => toggle(i)}
                                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-hub-teal transition-colors"
                            >
                                {shown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {shown ? 'Hide Answer' : 'Reveal Answer'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
