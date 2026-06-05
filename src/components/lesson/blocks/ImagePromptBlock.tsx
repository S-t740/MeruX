import { ImagePromptData } from '@/types/lesson-json';
import { ImageIcon, Layers } from 'lucide-react';

const styleColors: Record<string, string> = {
    'infographic': 'bg-hub-purple/10 text-hub-purple border-hub-purple/20',
    'flat illustration': 'bg-hub-teal/10 text-hub-teal border-hub-teal/20',
    'flow diagram': 'bg-hub-indigo/10 text-hub-indigo border-hub-indigo/20',
    'network topology': 'bg-hub-amber/10 text-hub-amber border-hub-amber/20',
    'modern icon style': 'bg-hub-rose/10 text-hub-rose border-hub-rose/20',
};

export function ImagePromptBlock({ data }: { data: ImagePromptData }) {
    const styleClass = styleColors[data.style] || 'bg-accent text-muted-foreground border-border';

    return (
        <div className="rounded-2xl border border-dashed border-hub-indigo/30 bg-hub-indigo/3 p-5 space-y-3 hover:border-hub-indigo/50 transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-hub-indigo/10 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-hub-indigo" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">Suggested Visual</p>
                        <p className="font-bold text-sm text-foreground">{data.title}</p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${styleClass}`}>
                    {data.style}
                </span>
            </div>

            <div className="pl-1 space-y-2">
                <div className="rounded-lg bg-accent/40 px-4 py-3 border border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Image Prompt</p>
                    <p className="text-sm text-foreground/80 italic">"{data.prompt}"</p>
                </div>
                <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{data.purpose}</p>
                </div>
            </div>
        </div>
    );
}
