import { RecapData } from '@/types/lesson-json';
import { Flag, CheckCircle } from 'lucide-react';

export function RecapBlock({ data }: { data: RecapData }) {
    return (
        <div className="rounded-2xl border border-hub-indigo/20 bg-gradient-to-br from-hub-indigo/5 to-hub-purple/3 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-hub-indigo" />
                <p className="font-bold text-sm font-outfit text-hub-indigo">{data.title}</p>
            </div>
            <ul className="space-y-2.5">
                {data.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-hub-teal shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/80 leading-relaxed">{point}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
