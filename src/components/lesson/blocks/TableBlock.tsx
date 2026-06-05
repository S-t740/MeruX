import { TableData } from '@/types/lesson-json';

export function TableBlock({ data }: { data: TableData }) {
    return (
        <div className="space-y-2">
            {data.title && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {data.title}
                </p>
            )}
            <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-hub-indigo/5 border-b border-border/60">
                            {data.columns.map((col, i) => (
                                <th key={i} className="px-4 py-3 text-left font-bold text-hub-indigo text-xs uppercase tracking-widest whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/30 hover:bg-accent/30 transition-colors last:border-0">
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-4 py-3 text-foreground/80 text-sm align-top">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
