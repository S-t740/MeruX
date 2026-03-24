"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type HeatmapData = {
    lessonName: string;
    avgTimeSpent: number;
    completionRate: number;
};

interface EngagementHeatmapProps {
    data: HeatmapData[];
}

export function EngagementHeatmap({ data }: EngagementHeatmapProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground text-sm font-bold uppercase tracking-widest border border-dashed border-border/50 rounded-xl bg-accent/10">
                Awaiting Telemetry Data
            </div>
        );
    }

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="lessonName" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis 
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar 
                        yAxisId="left"
                        name="Avg Time (Seconds)"
                        dataKey="avgTimeSpent" 
                        fill="#8b5cf6" // hub-indigo
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                        yAxisId="right"
                        name="Completion Rate (%)"
                        dataKey="completionRate" 
                        fill="#0ea5e9" // hub-teal approx
                        radius={[4, 4, 0, 0]} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
