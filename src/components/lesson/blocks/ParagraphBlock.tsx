import { ParagraphData } from '@/types/lesson-json';

export function ParagraphBlock({ data }: { data: ParagraphData }) {
    return (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {data.text}
        </p>
    );
}
