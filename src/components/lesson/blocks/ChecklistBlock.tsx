'use client';

import { ChecklistData } from '@/types/lesson-json';
import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChecklistBlock({ data }: { data: ChecklistData }) {
    const [items, setItems] = useState(data.items);

    const toggle = (i: number) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item));

    const done = items.filter(i => i.checked).length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-hub-teal" />
                    <p className="font-bold text-sm font-outfit">{data.title}</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{done}/{items.length}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-accent/50 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-hub-teal to-hub-indigo rounded-full transition-all duration-500"
                    style={{ width: `${(done / items.length) * 100}%` }}
                />
            </div>

            <div className="space-y-2">
                {items.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => toggle(i)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card hover:bg-accent/20 transition-all text-left group"
                    >
                        <div className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                            item.checked ? 'bg-hub-teal border-hub-teal' : 'border-border group-hover:border-hub-teal/50'
                        )}>
                            {item.checked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn('text-sm transition-colors', item.checked ? 'line-through text-muted-foreground' : 'text-foreground/80')}>
                            {item.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
