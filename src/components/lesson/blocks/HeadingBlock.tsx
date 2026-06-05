import { HeadingData } from '@/types/lesson-json';

export function HeadingBlock({ data }: { data: HeadingData }) {
    return (
        <div className="pt-2 pb-1">
            <h1 className="text-3xl font-outfit font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-hub-indigo">
                {data.text}
            </h1>
        </div>
    );
}
