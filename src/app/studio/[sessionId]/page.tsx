"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Users,
    MessageSquare, Hand, Smile, Settings, BarChart3, ChevronLeft, ChevronRight,
    Sparkles, Send, X, Plus, Circle, Play, Pause, Square, BookOpen,
    ThumbsUp, Heart, Zap, Star, AlertCircle, CheckCircle, BarChart2,
    PenLine, Layers, Volume2, VolumeX, Radio, Clock, Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type PanelType = 'chat' | 'participants' | 'qa' | 'polls' | 'ai' | null;
type Reaction = 'hand' | 'thumbs_up' | 'heart' | 'laugh' | 'clap' | null;

interface ChatMessage { id: string; sender: string; text: string; type: 'chat' | 'system' | 'question'; time: string; isOwn?: boolean; }
interface Participant { id: string; name: string; role: 'host' | 'tutor' | 'student'; isMuted: boolean; isVideoOn: boolean; handRaised: boolean; reaction?: Reaction; }
interface PollData { id: string; question: string; options: { text: string; votes: number }[]; totalVotes: number; isActive: boolean; myVote: number | null; }
interface Slide { id: number; title: string; content: string; type: 'lesson' | 'slide' | 'code'; }

// ─── Mock Data ────────────────────────────────────────────────────────────────
const sessionInfo = { title: "React State Management Deep Dive", host: "Dr. Kemi Adeyemi", course: "Full Stack Engineering", startedAt: Date.now() - 900000, isRecording: true };

const initParticipants: Participant[] = [
    { id: "host", name: "Dr. Kemi Adeyemi", role: "host",    isMuted: false, isVideoOn: true,  handRaised: false },
    { id: "p1",   name: "Amara Nwosu",       role: "student", isMuted: true,  isVideoOn: false, handRaised: false },
    { id: "p2",   name: "Kwame Asante",      role: "student", isMuted: true,  isVideoOn: true,  handRaised: true  },
    { id: "p3",   name: "Fatima Al-Hassan",  role: "student", isMuted: true,  isVideoOn: false, handRaised: false, reaction: 'heart' },
    { id: "p4",   name: "Sipho Dlamini",     role: "student", isMuted: true,  isVideoOn: true,  handRaised: false },
];

const initMessages: ChatMessage[] = [
    { id: "1", sender: "System",          text: "Session started. Welcome everyone!",                    type: "system",   time: "14:32" },
    { id: "2", sender: "Dr. Kemi",        text: "Hello everyone! Let's get started with Redux today.",  type: "chat",     time: "14:32" },
    { id: "3", sender: "Amara Nwosu",     text: "Excited for this session!",                            type: "chat",     time: "14:33" },
    { id: "4", sender: "Kwame Asante",    text: "Quick question — will we cover Zustand too?",          type: "question", time: "14:34" },
    { id: "5", sender: "Dr. Kemi",        text: "Yes Kwame, we'll touch on Zustand in the second half", type: "chat",     time: "14:34" },
];

const mockSlides: Slide[] = [
    { id: 1, type: "lesson", title: "State Management in React", content: `<h2>Why State Management?</h2><p>As React applications grow, passing data through component props becomes complex. State management libraries solve this by providing a centralized store.</p><h3>Key Challenges</h3><ul><li>Prop drilling across multiple levels</li><li>Shared state between unrelated components</li><li>Complex state mutations and side effects</li></ul>` },
    { id: 2, type: "slide",  title: "Redux Architecture",       content: `<h2>The Redux Data Flow</h2><p>Redux follows a strict unidirectional data flow pattern:</p><ol><li><strong>Action</strong> — Describes what happened</li><li><strong>Reducer</strong> — Specifies how state changes</li><li><strong>Store</strong> — Holds the application state</li><li><strong>View</strong> — Renders based on store state</li></ol>` },
    { id: 3, type: "code",   title: "Redux Toolkit Setup",      content: `<h2>Modern Redux with RTK</h2><p>Redux Toolkit simplifies Redux by providing utilities to reduce boilerplate:</p><pre><code>import { createSlice } from '@reduxjs/toolkit';\n\nconst counterSlice = createSlice({\n  name: 'counter',\n  initialState: { value: 0 },\n  reducers: {\n    increment: state => { state.value += 1 },\n    decrement: state => { state.value -= 1 },\n  }\n});</code></pre>` },
    { id: 4, type: "lesson", title: "Zustand: Simpler State",   content: `<h2>When to Use Zustand</h2><p>Zustand offers a lightweight alternative with minimal boilerplate. Perfect for medium-sized applications that don't need the full Redux ecosystem.</p><h3>Key Benefits</h3><ul><li>Minimal setup, maximum flexibility</li><li>No providers or wrappers needed</li><li>Works seamlessly with React hooks</li></ul>` },
    { id: 5, type: "slide",  title: "Comparison & Best Practices", content: `<h2>Choosing the Right Tool</h2><p>The right state management solution depends on your application's complexity and team preferences.</p><table><tr><th>Redux</th><th>Zustand</th></tr><tr><td>Large apps</td><td>Small-medium apps</td></tr><tr><td>Complex state</td><td>Simple state</td></tr><tr><td>DevTools support</td><td>Lightweight</td></tr></table>` },
];

const mockPoll: PollData = {
    id: "poll1", question: "Which state management tool do you use most?",
    options: [{ text: "Redux / RTK", votes: 8 }, { text: "Zustand", votes: 5 }, { text: "Context API", votes: 4 }, { text: "Jotai / Recoil", votes: 2 }],
    totalVotes: 19, isActive: true, myVote: null
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function ParticipantTile({ participant, isLarge = false }: { participant: Participant; isLarge?: boolean }) {
    const colors = ["from-hub-indigo to-hub-purple", "from-hub-teal to-hub-indigo", "from-hub-purple to-hub-rose", "from-hub-amber to-hub-rose"];
    const colorIdx = participant.id.charCodeAt(0) % colors.length;
    return (
        <div className={cn("relative rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center aspect-video", isLarge && "rounded-2xl")}>
            {participant.isVideoOn ? (
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", colors[colorIdx])} />
            ) : null}
            <div className={cn("relative z-10 flex flex-col items-center gap-2")}>
                <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold", colors[colorIdx], isLarge ? "w-20 h-20 text-3xl" : "w-10 h-10 text-base")}>
                    {participant.name.charAt(0)}
                </div>
                {isLarge && <p className="text-white/80 text-sm font-medium">{participant.name}</p>}
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className={cn("text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-full truncate max-w-[80%]", isLarge && "text-sm")}>
                    {participant.name} {participant.role === 'host' ? '(Host)' : ''}
                </span>
                <div className="flex gap-1">
                    {participant.isMuted && <div className="w-5 h-5 rounded-full bg-hub-rose/80 flex items-center justify-center"><MicOff className="w-3 h-3 text-white" /></div>}
                    {participant.handRaised && <div className="w-5 h-5 rounded-full bg-hub-amber/80 flex items-center justify-center"><Hand className="w-3 h-3 text-white" /></div>}
                </div>
            </div>
            {participant.reaction && <div className="absolute top-2 right-2 text-xl animate-bounce">{participant.reaction === 'heart' ? '❤️' : participant.reaction === 'thumbs_up' ? '👍' : '👏'}</div>}
        </div>
    );
}

function Timer({ startedAt }: { startedAt: number }) {
    const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
    useEffect(() => { const i = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(i); }, []);
    const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
    return <span className="font-outfit font-bold tabular-nums">{h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
}

// ─── AI Teaching Assistant Panel ──────────────────────────────────────────────
function AITeachingPanel({ currentSlide }: { currentSlide: Slide }) {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
        { role: 'ai', text: `I'm your AI Teaching Assistant. I can see we're on "${currentSlide.title}". Ask me anything about this topic!` }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const quickPrompts = ["Explain this concept simply", "Give me an example", "What are common mistakes?", "Summarize this slide"];

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        setMessages(m => [...m, { role: 'user', text }]);
        setInput("");
        setLoading(true);
        // Simulate AI response
        await new Promise(r => setTimeout(r, 1200));
        const responses: Record<string, string> = {
            "Explain this concept simply": `Great question! ${currentSlide.title} is about organizing how your app's data (state) is stored and updated. Think of it like a library — you need a system to organize books so anyone can find and update them easily.`,
            "Give me an example": `Here's a practical example for ${currentSlide.title}: Imagine a shopping cart. The cart items are your "state". Every time you add/remove items, you need a consistent way to update this data across your entire app — that's exactly what state management solves.`,
            "What are common mistakes?": `Common mistakes with ${currentSlide.title} include: 1) Over-engineering — using Redux for simple apps, 2) Storing too much in global state (keep local state local), 3) Not using selectors to memoize derived data, 4) Mutating state directly instead of using immutable updates.`,
            "Summarize this slide": `${currentSlide.title} summary: This slide covers the core concepts and architecture patterns. The key takeaway is understanding when and how to apply these patterns in real applications.`,
        };
        setMessages(m => [...m, { role: 'ai', text: responses[text] || `That's a great question about ${currentSlide.title}! This topic involves understanding how React components share and update data. The core principle is maintaining a single source of truth for your application state.` }]);
        setLoading(false);
    };

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-hub-indigo/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-hub-indigo" />
                </div>
                <div>
                    <p className="text-xs font-bold">AI Teaching Assistant</p>
                    <p className="text-[10px] text-muted-foreground">Context: {currentSlide.title}</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'ai' ? "bg-hub-indigo/10" : "bg-hub-purple/10"
                        )}>
                            {msg.role === 'ai' ? <Sparkles className="w-3 h-3 text-hub-indigo" /> : <span className="text-[9px] font-bold text-hub-purple">You</span>}
                        </div>
                        <div className={cn("px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[80%]",
                            msg.role === 'ai' ? "bg-accent/50 border border-border/50" : "bg-hub-indigo text-white"
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-hub-indigo/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3 h-3 text-hub-indigo animate-pulse" />
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-accent/50 border border-border/50 flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-hub-indigo animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-hub-indigo animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-hub-indigo animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-border/50 space-y-2">
                <div className="flex flex-wrap gap-1">
                    {quickPrompts.map(p => (
                        <button key={p} onClick={() => sendMessage(p)}
                            className="text-[9px] font-bold px-2 py-1 bg-hub-indigo/10 text-hub-indigo rounded-full hover:bg-hub-indigo/20 transition-all border border-hub-indigo/20">
                            {p}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                        placeholder="Ask anything..."
                        className="flex-1 px-3 py-2 bg-accent/30 border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                    <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                        className="w-8 h-8 bg-hub-indigo text-white rounded-xl flex items-center justify-center hover:bg-hub-indigo/90 transition-all disabled:opacity-40">
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ messages, onSend }: { messages: ChatMessage[]; onSend: (t: string) => void }) {
    const [input, setInput] = useState("");
    const [filter, setFilter] = useState<'all' | 'questions'>('all');
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const filtered = filter === 'questions' ? messages.filter(m => m.type === 'question') : messages;

    const handleSend = () => { if (!input.trim()) return; onSend(input); setInput(""); };

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border/50 flex gap-1">
                {(['all', 'questions'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                            filter === f ? "bg-hub-indigo/10 text-hub-indigo" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {f} {f === 'questions' && <span className="ml-1 bg-hub-amber text-white text-[9px] px-1 rounded-full">
                            {messages.filter(m => m.type === 'question').length}
                        </span>}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filtered.map(msg => (
                    <div key={msg.id} className={cn(msg.type === 'system' ? "text-center" : "")}>
                        {msg.type === 'system' ? (
                            <p className="text-[10px] text-muted-foreground bg-accent/50 px-3 py-1 rounded-full inline-block">{msg.text}</p>
                        ) : (
                            <div className={cn("space-y-0.5", msg.isOwn && "items-end flex flex-col")}>
                                <div className="flex items-center gap-2">
                                    {!msg.isOwn && <span className="text-[10px] font-bold text-hub-indigo">{msg.sender}</span>}
                                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                    {msg.type === 'question' && <span className="text-[9px] bg-hub-amber/10 text-hub-amber px-1.5 py-0.5 rounded-full font-bold">Question</span>}
                                </div>
                                <div className={cn("px-3 py-2 rounded-xl text-xs max-w-[85%]",
                                    msg.isOwn ? "bg-hub-indigo text-white" :
                                    msg.type === 'question' ? "bg-hub-amber/10 border border-hub-amber/20" : "bg-accent/50"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-border/50 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-accent/30 border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-hub-indigo/30 outline-none transition-all" />
                <button onClick={handleSend} disabled={!input.trim()}
                    className="w-8 h-8 bg-hub-indigo text-white rounded-xl flex items-center justify-center hover:bg-hub-indigo/90 transition-all disabled:opacity-40">
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Participants Panel ───────────────────────────────────────────────────────
function ParticipantsPanel({ participants }: { participants: Participant[] }) {
    const raised = participants.filter(p => p.handRaised);
    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border/50">
                <p className="text-xs font-bold">{participants.length} Participants</p>
            </div>
            {raised.length > 0 && (
                <div className="p-3 border-b border-border/50 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-hub-amber">✋ Hand Raised ({raised.length})</p>
                    {raised.map(p => (
                        <div key={p.id} className="flex items-center gap-2 p-2 bg-hub-amber/5 border border-hub-amber/20 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-hub-amber/20 flex items-center justify-center text-[10px] font-bold text-hub-amber">{p.name.charAt(0)}</div>
                            <span className="text-xs font-medium flex-1">{p.name}</span>
                            <button className="text-[10px] text-hub-amber font-bold hover:underline">Unmute</button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hub-indigo to-hub-purple flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {p.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium flex-1 truncate">{p.name} {p.role === 'host' && '(Host)'}</span>
                        <div className="flex gap-1">
                            {p.isMuted && <MicOff className="w-3.5 h-3.5 text-hub-rose" />}
                            {!p.isVideoOn && <VideoOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            {p.handRaised && <Hand className="w-3.5 h-3.5 text-hub-amber" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Poll Panel ───────────────────────────────────────────────────────────────
function PollPanel({ poll, onVote }: { poll: PollData; onVote: (i: number) => void }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-hub-indigo" />
                <p className="text-xs font-bold">Live Poll</p>
                {poll.isActive && <span className="w-1.5 h-1.5 rounded-full bg-hub-rose animate-pulse ml-auto" />}
            </div>
            <div className="p-4 space-y-4">
                <p className="font-bold text-sm">{poll.question}</p>
                <div className="space-y-2">
                    {poll.options.map((opt, i) => {
                        const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        const isMyVote = poll.myVote === i;
                        return (
                            <button key={i} onClick={() => onVote(i)}
                                className={cn("w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden",
                                    isMyVote ? "border-hub-indigo/50 bg-hub-indigo/10" : "border-border/60 bg-accent/20 hover:border-hub-indigo/30"
                                )}>
                                <div className="absolute inset-0 bg-hub-indigo/10 transition-all" style={{ width: `${pct}%` }} />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                            isMyVote ? "border-hub-indigo bg-hub-indigo" : "border-border"
                                        )}>
                                            {isMyVote && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <span className="text-xs font-medium">{opt.text}</span>
                                    </div>
                                    <span className="text-xs font-bold text-hub-indigo">{pct}%</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">{poll.totalVotes} votes · Poll by host</p>
            </div>
        </div>
    );
}

// ─── MAIN SESSION ROOM ────────────────────────────────────────────────────────
export default function SessionRoom() {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const [activePanel, setActivePanel] = useState<PanelType>('chat');
    const [isMuted,     setIsMuted]     = useState(false);
    const [isVideoOn,   setIsVideoOn]   = useState(true);
    const [isSharing,   setIsSharing]   = useState(false);
    const [handRaised,  setHandRaised]  = useState(false);
    const [participants, setParticipants] = useState<Participant[]>(initParticipants);
    const [messages,    setMessages]    = useState<ChatMessage[]>(initMessages);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [poll, setPoll] = useState<PollData>(mockPoll);
    const [showReactions, setShowReactions] = useState(false);
    const [presentationMode, setPresentationMode] = useState(true);
    const isHost = true; // In production: check against user ID

    const sendChat = (text: string) => {
        const now = new Date();
        setMessages(m => [...m, {
            id: String(Date.now()), sender: "You", text,
            type: text.endsWith('?') ? 'question' : 'chat',
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true
        }]);
    };

    const handleVote = (optionIdx: number) => {
        if (poll.myVote !== null) return;
        setPoll(p => ({
            ...p, myVote: optionIdx, totalVotes: p.totalVotes + 1,
            options: p.options.map((o, i) => i === optionIdx ? { ...o, votes: o.votes + 1 } : o)
        }));
    };

    const toggleHand = () => {
        setHandRaised(h => !h);
        setParticipants(ps => ps.map(p => p.id === 'p1' ? { ...p, handRaised: !handRaised } : p));
    };

    const panelButtons: { id: PanelType; icon: any; label: string; badge?: number }[] = [
        { id: 'chat',         icon: MessageSquare, label: 'Chat',        badge: messages.filter(m => m.type !== 'system').length },
        { id: 'participants', icon: Users,         label: 'People',      badge: participants.length },
        { id: 'polls',        icon: BarChart2,     label: 'Poll'                          },
        { id: 'ai',           icon: Sparkles,      label: 'AI Assistant'                   },
    ];

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/studio" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" /> Exit
                    </Link>
                    <div className="w-px h-4 bg-white/10" />
                    <div>
                        <p className="font-outfit font-bold text-sm">{sessionInfo.title}</p>
                        <p className="text-xs text-white/50">{sessionInfo.course}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {sessionInfo.isRecording && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-hub-rose/20 border border-hub-rose/30 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-hub-rose animate-pulse" />
                            <span className="text-[10px] font-bold text-hub-rose uppercase tracking-wider">REC</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <Timer startedAt={sessionInfo.startedAt} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-white/60">
                        <Users className="w-4 h-4" />
                        <span>{participants.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Video + Presentation */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Presentation / Content Area */}
                    <div className="flex-1 bg-zinc-950 relative overflow-hidden">
                        {presentationMode ? (
                            <div className="h-full flex flex-col p-6">
                                {/* Slide Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            mockSlides[currentSlide].type === 'code' ? "bg-hub-amber/20 text-hub-amber" :
                                            mockSlides[currentSlide].type === 'slide' ? "bg-hub-indigo/20 text-hub-indigo" :
                                            "bg-hub-teal/20 text-hub-teal"
                                        )}>
                                            {mockSlides[currentSlide].type}
                                        </span>
                                        <span className="text-white/50 text-xs">Slide {currentSlide + 1} of {mockSlides.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setCurrentSlide(Math.min(mockSlides.length - 1, currentSlide + 1))} disabled={currentSlide === mockSlides.length - 1}
                                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Slide Dots */}
                                <div className="flex gap-1 mb-5">
                                    {mockSlides.map((_, i) => (
                                        <button key={i} onClick={() => setCurrentSlide(i)}
                                            className={cn("h-1 rounded-full transition-all", i === currentSlide ? "bg-hub-indigo w-6" : "bg-white/20 w-3 hover:bg-white/40")} />
                                    ))}
                                </div>

                                {/* Slide Content */}
                                <div className="flex-1 max-w-4xl mx-auto w-full overflow-y-auto">
                                    <div
                                        className={cn(
                                            "prose prose-invert max-w-none h-full",
                                            "[&_h2]:text-2xl [&_h2]:font-outfit [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:text-white",
                                            "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-white/90",
                                            "[&_p]:text-white/75 [&_p]:leading-relaxed [&_p]:mb-3",
                                            "[&_ul]:space-y-2 [&_li]:text-white/70 [&_li]:pl-1",
                                            "[&_ol]:space-y-2 [&_strong]:text-white",
                                            "[&_pre]:bg-black/50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto",
                                            "[&_code]:text-hub-teal [&_code]:font-mono [&_code]:text-sm",
                                            "[&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_th]:border-white/20 [&_th]:font-bold",
                                            "[&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-white/10 [&_td]:text-white/70",
                                        )}
                                        dangerouslySetInnerHTML={{ __html: mockSlides[currentSlide].content }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Video Grid Mode */
                            <div className="h-full p-4 grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
                                {participants.map((p, i) => (
                                    <ParticipantTile key={p.id} participant={p} isLarge={i === 0} />
                                ))}
                            </div>
                        )}

                        {/* View Toggle */}
                        <button onClick={() => setPresentationMode(!presentationMode)}
                            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-all">
                            {presentationMode ? <><Video className="w-3.5 h-3.5" /> Cameras</> : <><BookOpen className="w-3.5 h-3.5" /> Slides</>}
                        </button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="shrink-0 bg-zinc-900/90 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center gap-3">
                        {/* A/V Controls */}
                        <div className="flex gap-2">
                            <button onClick={() => setIsMuted(!isMuted)}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    isMuted ? "bg-hub-rose/20 text-hub-rose border border-hub-rose/30 hover:bg-hub-rose/30" :
                                    "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                )}>
                                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setIsVideoOn(!isVideoOn)}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    !isVideoOn ? "bg-hub-rose/20 text-hub-rose border border-hub-rose/30 hover:bg-hub-rose/30" :
                                    "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                )}>
                                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                            </button>
                            {isHost && (
                                <button onClick={() => setIsSharing(!isSharing)}
                                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        isSharing ? "bg-hub-teal/20 text-hub-teal border border-hub-teal/30" :
                                        "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                    )}>
                                    <Monitor className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="w-px h-6 bg-white/10" />

                        {/* Interaction */}
                        <div className="flex gap-2">
                            <button onClick={toggleHand}
                                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    handRaised ? "bg-hub-amber/20 text-hub-amber border border-hub-amber/30 animate-pulse" :
                                    "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                )}>
                                <Hand className="w-4 h-4" />
                            </button>
                            <div className="relative">
                                <button onClick={() => setShowReactions(!showReactions)}
                                    className="w-10 h-10 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all text-base">
                                    😊
                                </button>
                                {showReactions && (
                                    <div className="absolute bottom-12 left-0 flex gap-2 bg-zinc-900/95 border border-white/20 rounded-2xl px-3 py-2">
                                        {['👍','❤️','😂','🎉','👏','🔥'].map(r => (
                                            <button key={r} onClick={() => setShowReactions(false)} className="text-xl hover:scale-125 transition-transform">{r}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel Toggles */}
                        <div className="ml-auto flex gap-2">
                            {panelButtons.map(btn => {
                                const Icon = btn.icon;
                                return (
                                    <button key={btn.id} onClick={() => setActivePanel(activePanel === btn.id ? null : btn.id)}
                                        className={cn("relative w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            activePanel === btn.id
                                                ? "bg-hub-indigo text-white border border-hub-indigo/50"
                                                : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white"
                                        )}>
                                        <Icon className="w-4 h-4" />
                                        {btn.badge && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-hub-rose text-[9px] font-bold text-white flex items-center justify-center">
                                                {btn.badge > 99 ? '99+' : btn.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* End / Leave */}
                        <div className="w-px h-6 bg-white/10" />
                        <Link href="/studio"
                            className="flex items-center gap-2 px-4 py-2 bg-hub-rose text-white rounded-xl text-sm font-bold hover:bg-hub-rose/90 transition-all">
                            <PhoneOff className="w-4 h-4" /> Leave
                        </Link>
                    </div>
                </div>

                {/* Right Panel */}
                {activePanel && (
                    <div className="w-80 shrink-0 border-l border-white/10 bg-card text-foreground flex flex-col">
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                            {panelButtons.map(btn => {
                                const Icon = btn.icon;
                                return (
                                    <button key={btn.id} onClick={() => setActivePanel(btn.id)}
                                        className={cn("flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-all",
                                            activePanel === btn.id ? "bg-hub-indigo/10 text-hub-indigo" : "text-muted-foreground hover:text-foreground"
                                        )}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                );
                            })}
                            <button onClick={() => setActivePanel(null)} className="text-muted-foreground hover:text-foreground p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {activePanel === 'chat'         && <ChatPanel messages={messages} onSend={sendChat} />}
                            {activePanel === 'participants' && <ParticipantsPanel participants={participants} />}
                            {activePanel === 'polls'        && <PollPanel poll={poll} onVote={handleVote} />}
                            {activePanel === 'ai'           && <AITeachingPanel currentSlide={mockSlides[currentSlide]} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
