import { InstructorNoteData } from '@/types/lesson-json';
import { AlertTriangle } from 'lucide-react';

export function InstructorNoteBlock({ data }: { data: InstructorNoteData }) {
    return (
        <div className="rounded-xl border border-hub-amber/40 bg-hub-amber/8 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-hub-amber shrink-0 mt-0.5" />
            <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-hub-amber">Instructor Review Needed</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{data.text}</p>
            </div>
        </div>
    );
}
