"use client"

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Video, Users, Clock, BookOpen, Lock, Globe, CheckCircle,
    ArrowRight, ChevronLeft, Mic, MicOff, VideoOff, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const sessionInfo = {
    id: "demo",
    title: "React State Management Deep Dive",
    host: "Dr. Kemi Adeyemi",
    course: "Full Stack Engineering",
    scheduled_at: new Date(Date.now() + 900000).toISOString(),
    status: "scheduled",
    access_type: "enrollment",
    participant_count: 18,
    max_participants: 25,
    is_recorded: true,
    description: "A comprehensive live session covering Redux, Redux Toolkit, and Zustand with live coding exercises and Q&A.",
};

export default function SessionJoinPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params?.sessionId as string;

    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [joining, setJoining] = useState(false);

    const handleJoin = async () => {
        setJoining(true);
        // In production: call /api/studio/join to validate access
        await new Promise(r => setTimeout(r, 800));
        router.push(`/studio/${sessionId}`);
    };

    const scheduledTime = new Date(sessionInfo.scheduled_at);
    const isLive = sessionInfo.status === "live";

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-6">
                <Link href="/studio" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Studio
                </Link>

                {/* Session Info */}
                <div className="premium-card p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-hub-indigo/10 flex items-center justify-center shrink-0">
                            <Video className="w-6 h-6 text-hub-indigo" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {isLive ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-hub-rose uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-hub-rose animate-pulse" /> Live Now
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-hub-amber uppercase tracking-widest">Starting Soon</span>
                                )}
                            </div>
                            <h1 className="font-outfit font-bold text-xl">{sessionInfo.title}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Hosted by {sessionInfo.host}</p>
                        </div>
                    </div>

                    {sessionInfo.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                            {sessionInfo.description}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 shrink-0" />
                            <span>{sessionInfo.participant_count} / {sessionInfo.max_participants} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {sessionInfo.course && (
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 shrink-0" />
                                <span className="truncate">{sessionInfo.course}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {sessionInfo.access_type === 'open' ? <Globe className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
                            <span className="capitalize">{sessionInfo.access_type} access</span>
                        </div>
                    </div>

                    {sessionInfo.is_recorded && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-hub-rose/5 border border-hub-rose/20 rounded-xl text-xs font-medium text-hub-rose">
                            <div className="w-2 h-2 rounded-full bg-hub-rose" />
                            This session will be recorded for enrolled students
                        </div>
                    )}
                </div>

                {/* Device Preview */}
                <div className="premium-card p-5 space-y-4">
                    <h2 className="font-bold text-sm">Check your devices before joining</h2>

                    {/* Camera Preview */}
                    <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                        {camOn ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-hub-indigo/20 to-hub-purple/20 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white font-bold text-2xl">
                                    Y
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <VideoOff className="w-8 h-8 text-white/30 mx-auto" />
                                <p className="text-white/40 text-sm">Camera off</p>
                            </div>
                        )}
                        <p className="absolute bottom-3 left-3 text-white/80 text-xs font-bold">You</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setMicOn(!micOn)}
                            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all",
                                micOn ? "bg-hub-teal/10 border-hub-teal/40 text-hub-teal" : "bg-accent/30 border-border/60 text-muted-foreground hover:text-foreground"
                            )}>
                            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            {micOn ? 'Mic On' : 'Mic Off'}
                        </button>
                        <button
                            onClick={() => setCamOn(!camOn)}
                            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all",
                                camOn ? "bg-hub-teal/10 border-hub-teal/40 text-hub-teal" : "bg-accent/30 border-border/60 text-muted-foreground hover:text-foreground"
                            )}>
                            {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                            {camOn ? 'Cam On' : 'Cam Off'}
                        </button>
                    </div>
                </div>

                {/* Access Verification */}
                <div className="flex items-center gap-2 px-4 py-3 bg-hub-teal/5 border border-hub-teal/20 rounded-xl text-sm text-hub-teal">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">Access verified — you are enrolled in {sessionInfo.course}</span>
                </div>

                {/* Join Button */}
                <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full py-4 bg-hub-indigo text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:bg-hub-indigo/90 transition-all shadow-xl shadow-hub-indigo/25 active:scale-[0.98] disabled:opacity-60"
                >
                    {joining ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                    ) : (
                        <><Video className="w-5 h-5" /> Join Session <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
