import { LabData } from '@/types/lesson-json';
import { Terminal, Target, Package, ListChecks, CheckSquare, Upload } from 'lucide-react';

export function LabBlock({ data }: { data: LabData }) {
    return (
        <div className="rounded-2xl border border-hub-teal/20 bg-gradient-to-br from-hub-teal/3 to-transparent overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-hub-teal/20 bg-hub-teal/5">
                <div className="w-9 h-9 rounded-xl bg-hub-teal/15 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-hub-teal" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hub-teal">Cisco-Style Lab</p>
                    <p className="font-bold text-sm font-outfit text-foreground">{data.title}</p>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Objective */}
                <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-hub-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Objective</p>
                        <p className="text-sm text-foreground/80">{data.objective}</p>
                    </div>
                </div>

                {/* Requirements */}
                {data.requirements.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-hub-amber shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Requirements</p>
                            <ul className="space-y-1">
                                {data.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                        <span className="text-hub-amber mt-1 shrink-0">▸</span>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Steps */}
                {data.steps.length > 0 && (
                    <div className="flex items-start gap-3">
                        <ListChecks className="w-4 h-4 text-hub-indigo shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Steps</p>
                            <ol className="space-y-2">
                                {data.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                        <span className="w-5 h-5 rounded-full bg-hub-indigo/10 text-hub-indigo flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )}

                {/* Expected Output */}
                {data.expected_output.length > 0 && (
                    <div className="flex items-start gap-3">
                        <CheckSquare className="w-4 h-4 text-hub-teal shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Expected Output</p>
                            <div className="rounded-lg bg-black/5 dark:bg-white/5 border border-border/40 p-3 space-y-1 font-mono">
                                {data.expected_output.map((out, i) => (
                                    <p key={i} className="text-xs text-hub-teal">$ {out}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submission */}
                {data.submission_instructions && (
                    <div className="flex items-start gap-3 rounded-xl border border-hub-indigo/20 bg-hub-indigo/5 p-3">
                        <Upload className="w-4 h-4 text-hub-indigo shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo mb-1">Submission</p>
                            <p className="text-sm text-foreground/80">{data.submission_instructions}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
