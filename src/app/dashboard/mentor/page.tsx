"use client"

import { Users, Target, CheckCircle, MessageSquare, Award, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MentorDashboard() {
    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="page-title">Mentorship Hub</h1>
                <p className="page-description">Guide and support your mentees&apos; learning journey, track milestones, and provide valuable feedback.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="w-5 h-5 text-hub-indigo" />}
                    label="Active Mentees"
                    value="12"
                    trend="5 new this month"
                />
                <StatCard
                    icon={<Target className="w-5 h-5 text-hub-teal" />}
                    label="Projects Mentored"
                    value="8"
                    trend="2 completed"
                />
                <StatCard
                    icon={<MessageSquare className="w-5 h-5 text-hub-amber" />}
                    label="Pending Feedback"
                    value="6"
                    trend="2 urgent"
                />
                <StatCard
                    icon={<Award className="w-5 h-5 text-hub-purple" />}
                    label="Mentee Success Rate"
                    value="92%"
                    trend="Course completions"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed: Mentees */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold tracking-tight">Your Mentees</h2>
                        <button className="text-sm font-medium text-hub-indigo hover:underline flex items-center gap-1 group">
                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <MenteeCard
                            name="Ahmed Hassan"
                            program="Full Stack Engineering"
                            project="E-commerce Platform"
                            progress={65}
                            status="on_track"
                            last_meeting="2 days ago"
                        />
                        <MenteeCard
                            name="Jane Okonkwo"
                            program="AI & ML"
                            project="Predictive Analytics Model"
                            progress={48}
                            status="on_track"
                            last_meeting="4 days ago"
                        />
                        <MenteeCard
                            name="Marcus Chen"
                            program="Innovation Incubator"
                            project="SaaS Application"
                            progress={82}
                            status="ahead"
                            last_meeting="1 day ago"
                        />
                    </div>
                </div>

                {/* Sidebar: Feedback Queue & Meetings */}
                <div className="space-y-6">
                    <h2 className="text-xl font-outfit font-bold tracking-tight">Pending Feedback</h2>
                    <div className="space-y-3">
                        <FeedbackItem
                            mentee="Ahmed Hassan"
                            type="Project Review"
                            submitted="6 hours ago"
                            priority="high"
                        />
                        <FeedbackItem
                            mentee="Jane Okonkwo"
                            type="Code Review"
                            submitted="1 day ago"
                            priority="medium"
                        />
                        <FeedbackItem
                            mentee="Marcus Chen"
                            type="Pitch Deck"
                            submitted="2 days ago"
                            priority="low"
                        />
                        <FeedbackItem
                            mentee="Sarah Kipchoge"
                            type="Research Paper"
                            submitted="3 days ago"
                            priority="medium"
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-outfit font-bold mb-3">Upcoming Meetings</h3>
                        <div className="space-y-2 text-sm">
                            <div className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                <p className="font-medium">Ahmed Hassan</p>
                                <p className="text-[10px] text-muted-foreground">Today at 3:00 PM</p>
                            </div>
                            <div className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                <p className="font-medium">Team Standup</p>
                                <p className="text-[10px] text-muted-foreground">Tomorrow at 10:00 AM</p>
                            </div>
                        </div>
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

function MenteeCard({ name, program, project, progress, status, last_meeting }: any) {
    const statusColors = {
        "on_track": { bg: "bg-hub-teal/10", text: "text-hub-teal", label: "On Track" },
        "ahead": { bg: "bg-hub-indigo/10", text: "text-hub-indigo", label: "Ahead of Schedule" },
        "at_risk": { bg: "bg-hub-amber/10", text: "text-hub-amber", label: "At Risk" }
    };

    const colors = statusColors[status as keyof typeof statusColors];

    return (
        <div className="premium-card p-6 space-y-4 group cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">{name}</h3>
                    <p className="text-sm text-muted-foreground">{program}</p>
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full", colors.bg, colors.text)}>
                    {colors.label}
                </span>
            </div>

            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">📋 {project}</p>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                            className="h-full bg-hub-indigo transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">Last meeting: {last_meeting}</p>
        </div>
    );
}

function FeedbackItem({ mentee, type, submitted, priority }: any) {
    const priorityColors = {
        high: "text-hub-rose",
        medium: "text-hub-amber",
        low: "text-hub-teal"
    };

    return (
        <div className="p-3 rounded-xl border border-border/50 hover:bg-accent transition-colors cursor-pointer space-y-2">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-bold">{mentee}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                </div>
                <span className={cn("text-lg", priorityColors[priority as keyof typeof priorityColors])}>●</span>
            </div>
            <p className="text-xs text-muted-foreground">{submitted}</p>
        </div>
    );
}
