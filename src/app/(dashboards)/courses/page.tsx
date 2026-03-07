"use client"

import { Plus, Search, Filter, MoreVertical, Book } from "lucide-react";

export default function CourseManagement() {
    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-outfit font-bold tracking-tight">Courses</h1>
                    <p className="text-muted-foreground font-medium text-sm">Manage your curriculum and student enrollments.</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-hub-indigo text-white rounded-xl font-semibold hover:bg-hub-indigo/90 transition-all text-sm shadow-lg shadow-hub-indigo/20">
                    <Plus className="w-4 h-4" />
                    Create New Course
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses, instructors, or cohorts..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hub-indigo/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <select className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none">
                        <option>All Status</option>
                        <option>Published</option>
                        <option>Draft</option>
                        <option>Archived</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <CourseListItem
                    title="Full Stack Web Engineering"
                    students={142}
                    status="Published"
                    level="Advanced"
                    lastUpdated="2 days ago"
                />
                <CourseListItem
                    title="Artificial Intelligence & ML"
                    students={89}
                    status="Published"
                    level="Intermediate"
                    lastUpdated="5 days ago"
                />
                <CourseListItem
                    title="Cybersecurity Fundamentals"
                    students={0}
                    status="Draft"
                    level="Beginner"
                    lastUpdated="1 hour ago"
                />
                <CourseListItem
                    title="Cloud Architecture with AWS"
                    students={64}
                    status="Published"
                    level="Advanced"
                    lastUpdated="1 week ago"
                />
                <CourseListItem
                    title="Innovation & Entrepreneurship"
                    students={210}
                    status="Published"
                    level="Beginner"
                    lastUpdated="3 weeks ago"
                />
            </div>
        </div>
    );
}

function CourseListItem({ title, students, status, level, lastUpdated }: any) {
    return (
        <div className="premium-card group">
            <div className="h-32 bg-accent/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-black/40 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </div>
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {level}
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                            status === "Published" ? "bg-hub-teal/10 text-hub-teal border-hub-teal/20" : "bg-muted text-muted-foreground border-border"
                        )}>
                            {status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">Updated {lastUpdated}</span>
                    </div>
                    <h3 className="font-outfit font-bold text-lg leading-tight group-hover:text-hub-indigo transition-colors">{title}</h3>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                        <Book className="w-4 h-4" />
                        <span>12 Modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-accent flex items-center justify-center text-[10px] font-bold">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">+{students} enrolled</span>
                    </div>
                </div>

                <button className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all group-hover:border-hub-indigo/30">
                    Edit Course
                </button>
            </div>
        </div>
    );
}
