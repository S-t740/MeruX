'use client';

import { FlashcardsData } from '@/types/lesson-json';
import { useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export function FlashcardsBlock({ data }: { data: FlashcardsData }) {
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const card = data.cards[current];
    const total = data.cards.length;

    const next = () => { setFlipped(false); setTimeout(() => setCurrent(i => Math.min(i + 1, total - 1)), 150); };
    const prev = () => { setFlipped(false); setTimeout(() => setCurrent(i => Math.max(i - 1, 0)), 150); };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-hub-purple" />
                    <p className="font-bold text-sm font-outfit">{data.title}</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{current + 1} / {total}</span>
            </div>

            {/* Card */}
            <div
                onClick={() => setFlipped(f => !f)}
                className="relative h-48 cursor-pointer group"
                style={{ perspective: '1000px' }}
            >
                <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {/* Front */}
                    <div
                        className="absolute inset-0 rounded-2xl border border-hub-purple/20 bg-gradient-to-br from-hub-purple/5 to-hub-indigo/5 flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-hub-purple mb-3">Question</p>
                        <p className="text-base font-medium text-foreground leading-snug">{card.question}</p>
                        <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Click to reveal answer
                        </p>
                    </div>
                    {/* Back */}
                    <div
                        className="absolute inset-0 rounded-2xl border border-hub-teal/20 bg-gradient-to-br from-hub-teal/5 to-hub-indigo/5 flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-hub-teal mb-3">Answer</p>
                        <p className="text-base font-medium text-foreground leading-snug">{card.answer}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={prev}
                    disabled={current === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-accent/30 text-sm font-bold disabled:opacity-30 hover:bg-accent transition-all"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="flex gap-1.5">
                    {data.cards.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setFlipped(false); setCurrent(i); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-hub-purple' : 'w-1.5 bg-border'}`}
                        />
                    ))}
                </div>
                <button
                    onClick={next}
                    disabled={current === total - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-accent/30 text-sm font-bold disabled:opacity-30 hover:bg-accent transition-all"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
