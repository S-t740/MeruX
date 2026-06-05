import { NextLessonData } from '@/types/lesson-json';
import { ArrowRight, Sparkles } from 'lucide-react';

export function NextLessonBlock({ data }: { data: NextLessonData }) {
    return (
        <div className="rounded-2xl border border-hub-teal/20 bg-gradient-to-r from-hub-teal/5 to-hub-indigo/5 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-hub-teal/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-hub-teal" />
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-hub-teal">Coming Up Next</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{data.text}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-hub-teal shrink-0 mt-1.5" />
        </div>
    );
}
