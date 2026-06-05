import { SubheadingData } from '@/types/lesson-json';

export function SubheadingBlock({ data }: { data: SubheadingData }) {
    return (
        <div className="flex items-center gap-3 pt-6 pb-1">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-hub-indigo to-hub-purple shrink-0" />
            <h2 className="text-lg font-outfit font-bold tracking-tight text-foreground">
                {data.text}
            </h2>
        </div>
    );
}
