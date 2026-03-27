"use client"

import { useEffect, useState } from "react";
import {
    Shield,
    Users,
    Settings as SettingsIcon,
    Activity,
    Database,
    Lock,
    Server,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    AlertTriangle,
    RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
    const supabase = createClient();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSessions: 0,
        dbSize: "—",
        uptime: "99.98%"
    });

    useEffect(() => {
        const fetchSystemData = async () => {
            try {
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (profilesError) throw profilesError;
                setProfiles(profilesData || []);

                // Count active sessions (users with recent activity in last 24 hours)
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { data: activeSessions, error: sessionsError } = await supabase
                    .from("profiles")
                    .select("id")
                    .gt("last_sign_in_at", yesterday);

                const activeSessCount = activeSessions?.length || 0;

                setStats(prev => ({ 
                    ...prev, 
                    totalUsers: profilesData?.length || 0,
                    activeSessions: activeSessCount
                }));
            } catch (error) {
                console.error("Error fetching system data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSystemData();
    }, [supabase]);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-hub-rose uppercase tracking-widest mb-2">
                        <Shield className="w-4 h-4" />
                        System Authority
                    </div>
                    <h1 className="page-title">Super Admin Control</h1>
                    <p className="page-description">Global configuration, user permission escalation, and system health monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-accent/30 rounded-xl font-bold flex items-center gap-2 border border-border/50 text-sm hover:bg-accent transition-all">
                        <RefreshCw className="w-4 h-4" /> System Audit
                    </button>
                    <button className="px-6 py-3 bg-hub-rose text-white rounded-xl font-bold hover:bg-hub-rose/90 transition-all text-sm shadow-xl shadow-hub-rose/20 active:scale-95">
                        <Lock className="w-4 h-4 mr-2" /> Global Lock
                    </button>
                </div>
            </div>

            {/* Critical Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-hub-indigo", bg: "bg-hub-indigo/10" },
                    { label: "Active Sessions", value: stats.activeSessions, icon: Activity, color: "text-hub-teal", bg: "bg-hub-teal/10" },
                    { label: "Database Size", value: stats.dbSize, icon: Database, color: "text-hub-amber", bg: "bg-hub-amber/10" },
                    { label: "System Uptime", value: stats.uptime, icon: Server, color: "text-hub-rose", bg: "bg-hub-rose/10" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card p-6 flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <p className="text-3xl font-outfit font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Management Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-hub-indigo" />
                            Global Directory
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Filter users..."
                                    className="bg-accent/30 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-hub-indigo transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-0 overflow-hidden border border-border/50">
                        <table className="w-full text-left">
                            <thead className="bg-accent/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {profiles.map((user, i) => (
                                    <tr key={i} className="group hover:bg-accent/20 transition-all cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent border border-border/50 flex items-center justify-center font-bold text-[10px]">
                                                    {(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : "")?.charAt(0) || "U"}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold font-outfit leading-tight group-hover:text-hub-indigo transition-colors">{(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : "") || "Nexus User"}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="px-2 py-1 rounded-lg bg-hub-indigo/10 text-hub-indigo text-[9px] font-bold uppercase tracking-wider inline-block">
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-hub-teal" />
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-outfit">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-accent rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* System Notifications */}
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-hub-rose" />
                            System Health
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-hub-teal/5 border border-hub-teal/20 rounded-2xl">
                                <CheckCircle2 className="w-5 h-5 text-hub-teal shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold font-outfit">Core Services Ready</p>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Supabase API and Row-Level Security are functioning optimally.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-hub-amber/5 border border-hub-amber/20 rounded-2xl">
                                <AlertTriangle className="w-5 h-5 text-hub-amber shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold font-outfit">Storage Nearing Capacity</p>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">System bucket used: 84%. Consider expanding the institutional tier.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Global Settings Preview */}
                    <div className="premium-card p-8 space-y-6">
                        <h2 className="text-xl font-outfit font-bold flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                            Global Config
                        </h2>
                        <div className="space-y-4">
                            {[
                                { label: "Multi-Factor Required", enabled: true },
                                { label: "Open Self-Enrollment", enabled: false },
                                { label: "Research Public Access", enabled: true },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                    <div className={cn(
                                        "w-10 h-5 rounded-full relative transition-all cursor-pointer",
                                        s.enabled ? "bg-hub-indigo" : "bg-accent border border-border/50"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 w-3 h-3 rounded-full transition-all",
                                            s.enabled ? "right-1 bg-white" : "left-1 bg-muted-foreground/30"
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
