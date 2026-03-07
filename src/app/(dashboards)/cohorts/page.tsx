"use client"

import { Users, Calendar, MessageSquare, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CohortManagement() {
    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-outfit font-bold">Your Cohorts</h1>
                <p className="text-muted-foreground font-medium">Collaborate with your peers and track collective milestones.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Cohort List & Details */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="premium-card overflow-hidden">
                        <div className="px-6 py-4 bg-hub-indigo/10 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-hub-indigo flex items-center justify-center text-white shadow-lg shadow-hub-indigo/20">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-outfit font-bold">AI Engineering 2026-A</h2>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Active Cohort • 42 Members</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-hub-indigo hover:underline">Switch Cohort</button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Lead Mentor</p>
                                    <p className="font-outfit font-bold">Dr. Eric Mbuvi</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Next Milestone</p>
                                    <p className="font-outfit font-bold">Sprint 3 Review</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Collective Progress</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                                            <div className="h-full bg-hub-teal w-[68%]" />
                                        </div>
                                        <span className="text-xs font-bold">68%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Shared Deliverables</h3>
                                <div className="space-y-3">
                                    <SharedFileItem title="Q3 Innovation Roadmap.pdf" date="Mar 05, 2026" size="2.4 MB" />
                                    <SharedFileItem title="Engineering Standards.md" date="Mar 02, 2026" size="15 KB" />
                                    <SharedFileItem title="Database Baseline.sql" date="Feb 28, 2026" size="1.2 MB" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Activity & Comms */}
                <div className="space-y-6">
                    <div className="premium-card p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-outfit font-bold">Cohort Discussion</h3>
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                            <CommentItem
                                author="Sarah Kinoti"
                                text="Does anyone have the link to the Docker lab recording?"
                                time="10m ago"
                            />
                            <CommentItem
                                author="John Doe"
                                text="Check the #resources channel in the Hub platform."
                                time="5m ago"
                            />
                            <CommentItem
                                author="Mentor Alice"
                                text="Remember to submit your peer reviews by midnight tonight!"
                                time="1m ago"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ask your cohort..."
                                className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SharedFileItem({ title, date, size }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-hub-indigo" />
                </div>
                <div>
                    <p className="text-sm font-bold font-outfit truncate max-w-[200px]">{title}</p>
                    <p className="text-[10px] text-muted-foreground">{date} • {size}</p>
                </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-hub-indigo transition-colors" />
        </div>
    );
}

function CommentItem({ author, text, time }: any) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-hub-indigo">{author}</span>
                <span className="text-muted-foreground">{time}</span>
            </div>
            <div className="p-3 bg-accent/30 rounded-xl rounded-tl-none border border-border/50">
                <p className="text-xs leading-relaxed">{text}</p>
            </div>
        </div>
    );
}
