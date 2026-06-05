"use client"

import { useState } from "react";
import Link from "next/link";
import {
    PlayCircle, Search, Filter, Clock, Users, Calendar, BookOpen,
    Download, Share2, Lock, Globe, Video, ChevronRight, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionRecording } from "@/types";

const mockRecordings: SessionRecording[] = [
    { id: "r1", session_id: "s4", session_title: "Data Structures: Trees & Graphs", host_name: "Dr. Kemi Adeyemi", course_title: "Full Stack Engineering", duration_seconds: 5432, file_url: "/recordings/r1", thumbnail_url: "", file_size_mb: 245, participant_count: 22, recorded_at: new Date(Date.now() - 86400000).toISOString(), is_public: true,  created_at: new Date().toISOString() },
    { id: "r2", session_id: "s5", session_title: "Introduction to Neural Networks",  host_name: "Prof. James Osei", course_title: "AI & Machine Learning",   duration_seconds: 6721, file_url: "/recordings/r2", thumbnail_url: "", file_size_mb: 318, participant_count: 15, recorded_at: new Date(Date.now() - 172800000).toISOString(), is_public: false, created_at: new Date().toISOString() },
    { id: "r3", session_id: "s6", session_title: "Python for Data Science",          host_name: "Dr. Kemi Adeyemi", course_title: "Data Science Foundations", duration_seconds: 4200, file_url: "/recordings/r3", thumbnail_url: "", file_size_mb: 189, participant_count: 18, recorded_at: new Date(Date.now() - 259200000).toISOString(), is_public: true,  created_at: new Date().toISOString() },
    { id: "r4", session_id: "s7", session_title: "React Hooks Deep Dive",            host_name: "Dr. Kemi Adeyemi", course_title: "Full Stack Engineering",   duration_seconds: 7812, file_url: "/recordings/r4", thumbnail_url: "", file_size_mb: 412, participant_count: 24, recorded_at: new Date(Date.now() - 432000000).toISOString(), is_public: true,  created_at: new Date().toISOString() },
    { id: "r5", session_id: "s8", session_title: "Office Hours — Q&A Session",       host_name: "Tutor Sarah Mbeki", course_title: undefined,                duration_seconds: 2890, file_url: "/recordings/r5", thumbnail_url: "", file_size_mb: 98,  participant_count: 11, recorded_at: new Date(Date.now() - 518400000).toISOString(), is_public: false, created_at: new Date().toISOString() },
    { id: "r6", session_id: "s9", session_title: "Model Deployment Workshop",         host_name: "Prof. James Osei", course_title: "AI & Machine Learning",   duration_seconds: 8932, file_url: "/recordings/r6", thumbnail_url: "", file_size_mb: 534, participant_count: 17, recorded_at: new Date(Date.now() - 604800000).toISOString(), is_public: true,  created_at: new Date().toISOString() },
];

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
}

function formatDate(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000)  return "Today";
    if (diff < 172800000) return "Yesterday";
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
}

const courseColors: Record<string, string> = {
    "Full Stack Engineering":   "text-hub-indigo bg-hub-indigo/10",
    "AI & Machine Learning":    "text-hub-purple bg-hub-purple/10",
    "Data Science Foundations": "text-hub-teal   bg-hub-teal/10",
};

function RecordingThumbnail({ recording }: { recording: SessionRecording }) {
    const colors = ["from-hub-indigo/30 to-hub-purple/30", "from-hub-teal/30 to-hub-indigo/30", "from-hub-purple/30 to-hub-rose/30"];
    const idx = recording.id.charCodeAt(1) % colors.length;
    return (
        <div className={cn("w-full aspect-video rounded-xl bg-gradient-to-br relative overflow-hidden flex items-center justify-center", colors[idx], "bg-zinc-900")}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlayCircle className="w-7 h-7 text-white" fill="white" fillOpacity={0.8} />
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded-md text-white text-[10px] font-bold">
                {formatDuration(recording.duration_seconds)}
            </div>
            {recording.is_public
                ? <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-hub-teal/80 flex items-center justify-center"><Globe className="w-3 h-3 text-white" /></div>
                : <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"><Lock className="w-3 h-3 text-white/70" /></div>
            }
        </div>
    );
}

export default function RecordingsPage() {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [courseFilter, setCourseFilter] = useState<string>('all');

    const courses = ['all', ...Array.from(new Set(mockRecordings.map(r => r.course_title).filter(Boolean) as string[]))];

    const filtered = mockRecordings.filter(r => {
        const matchSearch = r.session_title.toLowerCase().includes(search.toLowerCase()) ||
                            r.host_name.toLowerCase().includes(search.toLowerCase()) ||
                            (r.course_title || '').toLowerCase().includes(search.toLowerCase());
        const matchCourse = courseFilter === 'all' || r.course_title === courseFilter;
        return matchSearch && matchCourse;
    });

    const totalDuration = mockRecordings.reduce((a, r) => a + r.duration_seconds, 0);
    const totalStorage  = mockRecordings.reduce((a, r) => a + (r.file_size_mb || 0), 0);

    return (
        <div className="space-y-8 pb-10">
            <div className="page-header">
                <div className="flex items-center gap-2 text-xs font-bold text-hub-indigo uppercase tracking-widest mb-2">
                    <PlayCircle className="w-4 h-4" /> Learning Studio
                </div>
                <h1 className="page-title">Session Recordings</h1>
                <p className="page-description">Access recorded sessions from your tutor-led classes. Never miss a lesson again.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Recordings", value: mockRecordings.length, icon: Video,    color: "text-hub-indigo" },
                    { label: "Total Duration",   value: formatDuration(totalDuration), icon: Clock, color: "text-hub-teal" },
                    { label: "Courses Covered",  value: courses.length - 1, icon: BookOpen, color: "text-hub-purple" },
                    { label: "Storage Used",     value: `${Math.round(totalStorage / 1024 * 10) / 10} GB`, icon: Filter, color: "text-hub-amber" },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-4 flex items-center gap-3">
                        <s.icon className={cn("w-5 h-5 shrink-0", s.color)} />
                        <div>
                            <p className="font-outfit font-bold text-lg">{s.value}</p>
                            <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Search recordings..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-accent/30 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-hub-indigo/30 focus:border-hub-indigo outline-none transition-all" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {courses.map(c => (
                        <button key={c} onClick={() => setCourseFilter(c)}
                            className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                                courseFilter === c
                                    ? "bg-hub-indigo text-white border-hub-indigo"
                                    : "bg-accent/30 border-border/60 text-muted-foreground hover:text-foreground"
                            )}>
                            {c === 'all' ? 'All Courses' : c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No recordings match your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(recording => (
                        <div key={recording.id} className="premium-card overflow-hidden group hover:shadow-xl transition-all">
                            <RecordingThumbnail recording={recording} />
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-outfit font-bold leading-snug group-hover:text-hub-indigo transition-colors line-clamp-2">
                                        {recording.session_title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">by {recording.host_name}</p>
                                </div>
                                {recording.course_title && (
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", courseColors[recording.course_title] || "text-muted-foreground bg-accent")}>
                                        <Tag className="w-3 h-3" />{recording.course_title}
                                    </span>
                                )}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(recording.recorded_at)}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{recording.participant_count}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(recording.duration_seconds)}</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Link href={`/studio/recordings/${recording.id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-hub-indigo/10 text-hub-indigo rounded-xl text-xs font-bold hover:bg-hub-indigo/20 transition-all border border-hub-indigo/20">
                                        <PlayCircle className="w-3.5 h-3.5" /> Watch
                                    </Link>
                                    <button className="w-9 h-9 flex items-center justify-center bg-accent/50 border border-border/60 rounded-xl hover:bg-accent transition-all">
                                        <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    <button className="w-9 h-9 flex items-center justify-center bg-accent/50 border border-border/60 rounded-xl hover:bg-accent transition-all">
                                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
