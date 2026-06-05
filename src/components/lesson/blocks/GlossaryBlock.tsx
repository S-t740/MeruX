'use client';

import { GlossaryData } from '@/types/lesson-json';
import { useState } from 'react';
import { Book, Search } from 'lucide-react';

export function GlossaryBlock({ data }: { data: GlossaryData }) {
    const [search, setSearch] = useState('');

    const filtered = data.terms.filter(t =>
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-hub-amber" />
                    <p className="font-bold text-sm font-outfit">{data.title}</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{data.terms.length} terms</span>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search terms..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-accent/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-hub-amber/30 transition-all"
                />
            </div>

            <div className="grid gap-2">
                {filtered.map((term, i) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-accent/20 px-2 rounded-lg transition-colors">
                        <dt className="font-bold text-sm text-hub-amber shrink-0 min-w-[130px] pt-0.5">
                            {term.term}
                        </dt>
                        <dd className="text-sm text-foreground/70 leading-relaxed">{term.definition}</dd>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No terms match your search.</p>
                )}
            </div>
        </div>
    );
}
