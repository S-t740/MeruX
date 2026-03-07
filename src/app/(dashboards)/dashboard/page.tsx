"use client"

import { BookOpen, Clock, Award, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-outfit font-bold">Good Morning, Innovation Hub!</h1>
                <p className="text-muted-foreground font-medium">Here&apos;s a look at your learning progress.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<BookOpen className="w-5 h-5 text-hub-indigo" />}
                    label="Active Courses"
                    value="4"
                    trend="+1 this month"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-hub-teal" />}
                    label="Learning Hours"
                    value="24.5"
                    trend="Top 5% in Cohort"
                />
                <StatCard
                    icon={<Award className="w-5 h-5 text-hub-amber" />}
                    label="Certifications"
                    value="2"
                    trend="Next: AI Ethics"
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-hub-purple" />}
                    label="Incubator Rank"
                    value="#12"
                    trend="Seed Stage"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed: Active Courses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold tracking-tight">Active Learning</h2>
                        <button className="text-sm font-medium text-hub-indigo hover:underline flex items-center gap-1 group">
                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CourseCard
                            title="Full Stack Web Engineering"
                            cohort="Cohort 2026-A"
                            progress={65}
                            nextLesson="Authentication Middleware"
                        />
                        <CourseCard
                            title="AI & Machine Learning Foundations"
                            cohort="Hub Labs"
                            progress={32}
                            nextLesson="Neural Network Architecture"
                        />
                    </div>
                </div>

                {/* Sidebar Feed: Tasks & Deadlines */}
                <div className="space-y-6">
                    <h2 className="text-xl font-outfit font-bold tracking-tight">Upcoming Deadlines</h2>
                    <div className="space-y-4">
                        <DeadlineItem
                            title="Startup Pitch Deck"
                            time="2 days left"
                            type="Incubator"
                            color="amber"
                        />
                        <DeadlineItem
                            title="PostgreSQL Design Lab"
                            time="Next week"
                            type="Assignment"
                            color="indigo"
                        />
                        <DeadlineItem
                            title="Paper Draft Submission"
                            time="Tomorrow"
                            type="Research"
                            color="teal"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend }: any) {
    return (
        <div className="premium-card p-6 space-y-2">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">{icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{trend}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-outfit font-bold">{value}</p>
            </div>
        </div>
    );
}

function CourseCard({ title, cohort, progress, nextLesson }: any) {
    return (
        <div className="premium-card group cursor-pointer">
            <div className="p-6 space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hub-indigo">{cohort}</p>
                    <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors line-clamp-1">{title}</h3>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold font-outfit">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                        <div
                            className="h-full bg-hub-indigo transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                    <Clock className="w-3 h-3" />
                    Up next: {nextLesson}
                </div>
            </div>
        </div>
    );
}

function DeadlineItem({ title, time, type, color }: any) {
    const colorMap: any = {
        amber: "bg-hub-amber",
        indigo: "bg-hub-indigo",
        teal: "bg-hub-teal"
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors group cursor-pointer">
            <div className={cn("w-1.5 h-10 rounded-full", colorMap[color])} />
            <div className="flex-1 space-y-0.5">
                <p className="text-sm font-bold font-outfit group-hover:text-hub-indigo transition-colors">{title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span className="uppercase tracking-widest text-[9px] font-bold opacity-80">{type}</span>
                    <span>•</span>
                    <span>{time}</span>
                </div>
            </div>
        </div>
    );
}
