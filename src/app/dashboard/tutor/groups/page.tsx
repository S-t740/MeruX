"use client"

import { useState } from "react";
import {
    UsersRound, Plus, Target, Users, BookOpen, ChevronRight,
    TrendingUp, Activity, Settings, Trash2, UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MentorshipGroup } from "@/types";

const mockGroups: (MentorshipGroup & { avgProgress: number; members: { name: string; progress: number }[] })[] = [
    {
        id: "g1", name: "Full Stack Cohort A", description: "Advanced React and Node.js learners targeting deployment skills.",
        tutor_id: "t1", course_id: "c1", member_ids: ["1", "2", "5", "8"],
        max_members: 8, status: "active",
        goals: ["Complete React module by June 30", "Deploy a full-stack app", "Score 80%+ on final assessment"],
        created_at: "2026-05-01T00:00:00Z", avgProgress: 52,
        members: [
            { name: "Amara Nwosu", progress: 78 }, { name: "Kwame Asante", progress: 45 },
            { name: "Nneka Obi", progress: 32 }, { name: "Aisha Bello", progress: 18 }
        ]
    },
    {
        id: "g2", name: "AI Excellence Track", description: "High-performing ML learners preparing for advanced certifications.",
        tutor_id: "t1", course_id: "c2", member_ids: ["3", "4"],
        max_members: 6, status: "active",
        goals: ["Complete TensorFlow certification", "Build and deploy an ML model", "Publish a mini research paper"],
        created_at: "2026-05-10T00:00:00Z", avgProgress: 77,
        members: [
            { name: "Fatima Al-Hassan", progress: 63 }, { name: "Sipho Dlamini", progress: 91 }
        ]
    },
    {
        id: "g3", name: "Data Science Bootcamp", description: "Intensive data science program with weekly challenges.",
        tutor_id: "t1", course_id: "c3", member_ids: ["6", "7"],
        max_members: 10, status: "active",
        goals: ["Complete Python and Pandas module", "Kaggle competition entry"],
        created_at: "2026-05-15T00:00:00Z", avgProgress: 71,
        members: [
            { name: "Chidi Okeke", progress: 55 }, { name: "Lerato Mokoena", progress: 87 }
        ]
    },
];

function NewGroupModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ name: '', description: '', max_members: 8, goal: '' });
    const [goals, setGoals] = useState<string[]>([]);

    const addGoal = () => {
        if (form.goal.trim()) { setGoals(g => [...g, form.goal]); setForm(f => ({...f, goal: ''})); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-slide-up">
                <div>
                    <h2 className="font-outfit font-bold text-xl">Create Mentorship Group</h2>
                    <p className="text-sm text-muted-foreground mt-1">Build a focused learning group with shared goals.</p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Group Name</label>
                        <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                            placeholder="e.g. React Advanced Track"
                            className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                            placeholder="Describe the group's focus and target learners..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all resize-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Members</label>
                        <input type="number" value={form.max_members} min={2} max={50}
                            onChange={e => setForm(f => ({...f, max_members: +e.target.value}))}
                            className="w-full px-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Learning Goals</label>
                        <div className="flex gap-2">
                            <input value={form.goal} onChange={e => setForm(f => ({...f, goal: e.target.value}))}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                placeholder="Add a goal and press Enter"
                                className="flex-1 px-4 py-2 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                            <button onClick={addGoal} className="px-3 py-2 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        {goals.length > 0 && (
                            <div className="space-y-1">
                                {goals.map((g, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-hub-indigo/5 border border-hub-indigo/20 rounded-lg text-sm">
                                        <Target className="w-3.5 h-3.5 text-hub-indigo shrink-0" />
                                        <span className="flex-1">{g}</span>
                                        <button onClick={() => setGoals(gl => gl.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-hub-rose">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-accent/50 border border-border/60 rounded-xl text-sm font-bold hover:bg-accent transition-all">Cancel</button>
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25">
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GroupsPage() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="space-y-8 pb-10">
            {showModal && <NewGroupModal onClose={() => setShowModal(false)} />}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <UsersRound className="w-4 h-4" /> Tutor Mode
                    </div>
                    <h1 className="page-title">Mentorship Groups</h1>
                    <p className="page-description">Organize your learners into focused groups with shared goals and collaborative learning experiences.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-hub-indigo text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-hub-indigo/90 transition-all shadow-lg shadow-hub-indigo/25 active:scale-95 shrink-0">
                    <Plus className="w-4 h-4" /> New Group
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Active Groups",   value: mockGroups.filter(g => g.status === 'active').length, icon: UsersRound, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Total Members",   value: mockGroups.reduce((a, g) => a + g.member_ids.length, 0), icon: Users, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Avg. Progress",   value: `${Math.round(mockGroups.reduce((a, g) => a + g.avgProgress, 0) / mockGroups.length)}%`, icon: TrendingUp, color: "text-hub-purple", bg: "bg-hub-purple/10" },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-4 flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                            <s.icon className={cn("w-5 h-5", s.color)} />
                        </div>
                        <div>
                            <p className="text-xl font-outfit font-bold">{s.value}</p>
                            <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {mockGroups.map(group => (
                    <div key={group.id} className="premium-card p-5 space-y-4 group">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{group.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>
                            </div>
                            <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                                group.status === 'active' ? "bg-hub-teal/10 text-hub-teal" : "bg-accent text-muted-foreground"
                            )}>
                                {group.status}
                            </span>
                        </div>

                        {/* Member Avatars */}
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {group.members.slice(0, 4).map((m, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple border-2 border-card flex items-center justify-center text-white text-[10px] font-bold">
                                        {m.name.charAt(0)}
                                    </div>
                                ))}
                                {group.member_ids.length > 4 && (
                                    <div className="w-7 h-7 rounded-full bg-accent border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                        +{group.member_ids.length - 4}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">{group.member_ids.length} / {group.max_members} members</span>
                        </div>

                        {/* Avg Progress */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-muted-foreground">Group Progress</span>
                                <span>{group.avgProgress}%</span>
                            </div>
                            <div className="h-2 bg-accent rounded-full overflow-hidden">
                                <div className="h-full bg-hub-indigo rounded-full" style={{ width: `${group.avgProgress}%` }} />
                            </div>
                        </div>

                        {/* Goals */}
                        {group.goals && group.goals.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Goals</p>
                                {group.goals.slice(0, 2).map((goal, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Target className="w-3 h-3 shrink-0 mt-0.5 text-hub-indigo" />
                                        <span className="line-clamp-1">{goal}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-hub-indigo/10 text-hub-indigo text-xs font-bold hover:bg-hub-indigo/20 transition-all">
                                <UserPlus className="w-3.5 h-3.5" /> Add Members
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent/50 border border-border/60 text-xs font-bold hover:bg-accent transition-all text-muted-foreground">
                                <Settings className="w-3.5 h-3.5" /> Manage
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Group Card */}
                <button onClick={() => setShowModal(true)}
                    className="border-2 border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-hub-indigo hover:border-hub-indigo/50 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center group-hover:bg-hub-indigo/10 transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm">New Group</p>
                        <p className="text-xs opacity-70">Organize learners by focus area</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
