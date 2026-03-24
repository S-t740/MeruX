"use client"

import { useEffect, useState } from "react";
import { Bell, MessageCircle, Search, Send, CheckCircle2, Clock, AlertCircle, Info, Loader2, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
    const [search, setSearch] = useState("");
    const [markingId, setMarkingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [notifRes, msgRes] = await Promise.all([
                    supabase
                        .from("notifications")
                        .select("*")
                        .eq("user_id", user.id)
                        .not("type", "like", "cohort_%")  // exclude cohort messages
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("messages")
                        .select("*, sender:profiles!sender_id(first_name, last_name, avatar_url)")
                        .eq("receiver_id", user.id)
                        .order("created_at", { ascending: false })
                ]);

                setNotifications(notifRes.data || []);
                setMessages(msgRes.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [supabase]);

    const markAsRead = async (notifId: string) => {
        setMarkingId(notifId);
        try {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notifId);
            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
            );
        } finally {
            setMarkingId(null);
        }
    };

    const markAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const dismissNotification = async (notifId: string) => {
        await supabase.from("notifications").delete().eq("id", notifId);
        setNotifications(prev => prev.filter(n => n.id !== notifId));
    };

    const markMessageRead = async (msgId: string) => {
        await supabase.from("messages").update({ is_read: true }).eq("id", msgId);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
    };

    const filteredNotifications = notifications.filter(n =>
        search === "" || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredMessages = messages.filter(m =>
        search === "" || (m.sender?.first_name ? `${m.sender?.first_name} ${m.sender?.last_name || ''}`.trim() : "")?.toLowerCase().includes(search.toLowerCase()) || m.content?.toLowerCase().includes(search.toLowerCase())
    );

    const unreadNotifCount = notifications.filter(n => !n.is_read).length;
    const unreadMsgCount = messages.filter(m => !m.is_read).length;

    if (loading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Connecting to Nexus Core...</div>;
    }

    const notifIcon = (type: string) => {
        if (type === "deadline") return <Clock className="w-6 h-6" />;
        if (type === "announcement") return <AlertCircle className="w-6 h-6" />;
        return <Info className="w-6 h-6" />;
    };

    const notifColor = (type: string) => {
        if (type === "deadline") return "bg-hub-rose/10 border-hub-rose/20 text-hub-rose";
        if (type === "announcement") return "bg-hub-amber/10 border-hub-amber/20 text-hub-amber";
        return "bg-hub-teal/10 border-hub-teal/20 text-hub-teal";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="page-header">
                <h1 className="page-title">Collaboration Hub</h1>
                <p className="page-description">Manage your institutional alerts, course updates, and direct technical correspondence.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="space-y-4">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border font-bold text-sm",
                            activeTab === 'notifications'
                                ? "bg-hub-indigo text-white border-hub-indigo shadow-xl shadow-hub-indigo/20"
                                : "bg-card/50 text-muted-foreground border-border/50 hover:bg-accent/50"
                        )}
                    >
                        <Bell className={cn("w-5 h-5", activeTab === 'notifications' ? "text-white" : "text-hub-indigo")} />
                        <span>Notifications</span>
                        {unreadNotifCount > 0 && (
                            <span className={cn("ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold",
                                activeTab === 'notifications' ? "bg-white/20 text-white" : "bg-hub-indigo/10 text-hub-indigo"
                            )}>{unreadNotifCount}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('messages')}
                        className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border font-bold text-sm",
                            activeTab === 'messages'
                                ? "bg-hub-indigo text-white border-hub-indigo shadow-xl shadow-hub-indigo/20"
                                : "bg-card/50 text-muted-foreground border-border/50 hover:bg-accent/50"
                        )}
                    >
                        <MessageCircle className={cn("w-5 h-5", activeTab === 'messages' ? "text-white" : "text-hub-indigo")} />
                        <span>Messages</span>
                        {unreadMsgCount > 0 && (
                            <span className={cn("ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold",
                                activeTab === 'messages' ? "bg-white/20 text-white" : "bg-hub-indigo/10 text-hub-indigo"
                            )}>{unreadMsgCount}</span>
                        )}
                    </button>

                    <div className="pt-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-accent/30 border border-border/30 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-hub-indigo transition-all outline-none"
                            />
                        </div>
                        {activeTab === 'notifications' && unreadNotifCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-hub-teal bg-hub-teal/10 rounded-xl hover:bg-hub-teal/20 transition-all"
                            >
                                <CheckCircle2 className="w-3 h-3" /> Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-4">
                    {activeTab === 'notifications' ? (
                        filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "premium-card p-6 flex items-start gap-5 group transition-all",
                                        !notif.is_read && "border-hub-indigo/20 bg-hub-indigo/5"
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border", notifColor(notif.type))}>
                                        {notifIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-outfit font-bold">{notif.title}</h3>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                disabled={markingId === notif.id}
                                                className="p-2 hover:bg-hub-teal/10 rounded-lg transition-all"
                                                title="Mark as read"
                                            >
                                                {markingId === notif.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin text-hub-teal" />
                                                    : <CheckCircle2 className="w-4 h-4 text-hub-teal" />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => dismissNotification(notif.id)}
                                            className="p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Dismiss"
                                        >
                                            <X className="w-4 h-4 text-rose-500" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center premium-card border-dashed bg-accent/10 h-80 flex flex-col justify-center items-center">
                                <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                    {search ? "No matching notifications" : "Inbox Zero"}
                                </p>
                                <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest font-bold">
                                    You are all caught up!
                                </p>
                            </div>
                        )
                    ) : (
                        filteredMessages.length > 0 ? (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => markMessageRead(msg.id)}
                                    className={cn(
                                        "premium-card p-6 flex items-center gap-5 group cursor-pointer transition-all",
                                        !msg.is_read && "border-hub-indigo/20 bg-hub-indigo/5"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent border border-border/50 flex items-center justify-center shrink-0">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-outfit font-bold group-hover:text-hub-indigo transition-colors">
                                                {(msg.sender?.first_name ? `${msg.sender?.first_name} ${msg.sender?.last_name || ''}`.trim() : "") || "Platform User"}
                                            </h3>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic truncate">"{msg.content}"</p>
                                    </div>
                                    {!msg.is_read && <div className="w-2 h-2 rounded-full bg-hub-indigo animate-pulse shrink-0" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center premium-card border-dashed bg-accent/10 h-80 flex flex-col justify-center items-center">
                                <MessageCircle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                                    {search ? "No matching messages" : "No Messages"}
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
