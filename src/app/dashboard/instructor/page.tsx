"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Users,
    ClipboardCheck,
    Plus,
    Search,
    MoreVertical,
    BarChart3,
    Clock,
    PlayCircle,
    ArrowUpRight,
    Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { EngagementHeatmap } from "@/components/dashboard/EngagementHeatmap";
import { getInstructorHeatmap } from "@/lib/actions/analytics";

export default function InstructorDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructorData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase
                    .from("courses")
                    .select("*, modules(count), course_enrollments(count)")
                    .eq("instructor_id", user?.id);

                if (error) throw error;
                setCourses(data || []);

                if (user) {
                    const hData = await getInstructorHeatmap(user.id);
                    setHeatmapData(hData || []);
                }
            } catch (error) {
                console.error("Error fetching instructor data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructorData();
    }, [supabase]);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-indigo uppercase tracking-widest mb-2">
                        <BookOpen className="w-4 h-4" />
                        Teaching Studio
                    </div>
                    <h1 className="page-title">Instructor Workspace</h1>
                    <p className="page-description">Design your curriculum, track student engagement, and manage institutional grading flows.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/instructor/gradebook')}
                        className="px-6 py-3 bg-accent/30 rounded-xl font-bold flex items-center gap-2 border border-border/50 text-sm hover:bg-accent transition-all"
                    >
                        <ClipboardCheck className="w-4 h-4" /> Gradebook
                    </button>
                    <button onClick={() => router.push('/courses')} className="px-6 py-3 bg-hub-indigo text-white rounded-xl font-bold hover:bg-hub-indigo/90 transition-all text-sm shadow-xl shadow-hub-indigo/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create Course
                    </button>
                </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Students", value: "342", icon: Users, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Course Completion", value: "82%", icon: BarChart3, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Marking Pending", value: "12", icon: Clock, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-8 flex flex-col justify-between h-36">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <p className="text-3xl font-outfit font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* AI Heatmap Analytics */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-hub-teal" />
                        Engagement Heatmap
                    </h2>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-hub-teal bg-hub-teal/10 px-3 py-1 rounded-full">
                        AI Processed
                    </div>
                </div>
                <div className="premium-card p-8">
                    <div className="mb-6 space-y-2">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Lesson Drop-off & Completion Matrix</h3>
                        <p className="text-xs text-muted-foreground max-w-2xl">This chart analyzes real-time telemetry from student video views and quiz passing rates to help you identify bottleneck lessons that may require curriculum adjustments.</p>
                    </div>
                    <EngagementHeatmap data={heatmapData} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-hub-indigo" />
                        My Curriculum
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="bg-accent/30 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-hub-indigo transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <div key={course.id} className="premium-card p-0 group flex flex-col hover:border-hub-indigo/30 transition-all cursor-pointer overflow-hidden pb-6">
                                {/* Thumbnail Header */}
                                <div className="h-32 bg-accent/50 relative overflow-hidden shrink-0">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white z-10 flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5">
                                            {course.status}
                                        </span>
                                    </div>
                                    <button className="absolute top-3 left-3 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 rounded-lg transition-colors z-10 text-white">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="px-6 flex-1 flex flex-col space-y-6 pt-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-outfit font-bold group-hover:text-hub-indigo transition-colors">{course.title}</h3>
                                        <p className="text-sm text-muted-foreground font-medium line-clamp-2">{course.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enrollments</p>
                                            <p className="text-lg font-bold font-outfit">{course.course_enrollments?.[0]?.count || 0} Students</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modules</p>
                                            <p className="text-lg font-bold font-outfit">{course.modules?.[0]?.count || 0} Sections</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end mt-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/courses/manage?id=${course.id}`);
                                            }}
                                            className="text-xs font-bold text-hub-indigo flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                        >
                                            Edit Curriculum <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full premium-card p-20 text-center border-dashed bg-accent/10 border-border flex flex-col items-center justify-center space-y-4">
                            <BookOpen className="w-12 h-12 text-muted-foreground opacity-20" />
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No active courses</p>
                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Start your institutional impact by creating a course.</p>
                            </div>
                            <button onClick={() => router.push('/courses')} className="mt-4 px-6 py-3 bg-hub-indigo text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-hub-indigo/20 active:scale-95 transition-all">
                                Create Your First Course
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
