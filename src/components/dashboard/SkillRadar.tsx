"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

type SkillData = {
    subject: string;
    A: number; // The score
    fullMark: number;
};

interface SkillRadarProps {
    data: SkillData[];
}

export function SkillRadar({ data }: SkillRadarProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground text-sm font-bold uppercase tracking-widest border border-dashed border-border/50 rounded-xl bg-accent/10">
                No Skill Data Yet
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false} 
                        axisLine={false} 
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
                    />
                    <Radar 
                        name="Skill Level" 
                        dataKey="A" 
                        stroke="#8b5cf6" // hub-indigo
                        fill="#8b5cf6" 
                        fillOpacity={0.5} 
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
