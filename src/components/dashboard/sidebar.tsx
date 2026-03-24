"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Database,
    Rocket,
    GraduationCap,
    Settings,
    LogOut,
    Loader2,
    BarChart3,
    Bell,
    Moon,
    Sun,
    Shield,
    ClipboardCheck,
    Award
} from "lucide-react";
import { useUserRole } from "@/lib/hooks/useUserRole";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { role, isAdmin, isInstructor, isResearcher, isReviewer, loading: roleLoading } = useUserRole();
    const [loggingOut, setLoggingOut] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDark(savedTheme === 'dark');
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(isDarkSystem);
            if (isDarkSystem) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard", roles: ['student', 'instructor', 'mentor', 'researcher', 'reviewer', 'admin', 'super_admin'] },
        { icon: BookOpen, label: "Courses", href: "/courses", roles: ['student', 'instructor', 'mentor', 'admin', 'super_admin'] },
        { icon: Users, label: "Cohorts", href: "/cohorts", roles: ['student', 'instructor', 'admin', 'super_admin'] },
        { icon: Database, label: "Research Hub", href: "/research", roles: ['researcher', 'reviewer', 'admin', 'super_admin'] },
        { icon: Rocket, label: "Project Lab", href: "/projects", roles: ['student', 'mentor', 'admin', 'super_admin'] },
        { icon: GraduationCap, label: "Mentorship", href: "/mentorship", roles: ['student', 'mentor', 'admin', 'super_admin'] },
        { icon: Award, label: "Certifications", href: "/certifications", roles: ['student', 'admin', 'super_admin'] },
        { icon: ClipboardCheck, label: "Gradebook", href: "/dashboard/instructor/gradebook", roles: ['instructor', 'admin', 'super_admin'] },
        { icon: Shield, label: "System Auth", href: "/dashboard/super_admin", roles: ['super_admin'] },
        { icon: BarChart3, label: "Analytics", href: "/analytics", roles: ['student', 'instructor', 'mentor', 'researcher', 'reviewer', 'admin', 'super_admin'] },
        { icon: Bell, label: "Notifications", href: "/notifications", roles: ['student', 'instructor', 'mentor', 'researcher', 'reviewer', 'admin', 'super_admin'] },
        { icon: Settings, label: "Settings", href: "/settings", roles: ['student', 'instructor', 'mentor', 'researcher', 'reviewer', 'admin', 'super_admin'] },
    ];

    const filteredNavItems = navItems.filter(item => !role || item.roles.includes(role));

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        setIsDark(!isDark);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            setLoggingOut(false);
        }
    };

    return (
        <div className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-50">
            <div className="p-6 flex flex-col gap-6">
                <Link href="/" className="font-outfit font-bold text-xl tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-hub-indigo flex items-center justify-center text-white text-xs shadow-lg shadow-hub-indigo/20">MX</div>
                    <span>Meru<span className="text-hub-indigo">X</span></span>
                </Link>

                <button
                    onClick={toggleTheme}
                    disabled={!mounted}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-sm font-medium border border-border/50 bg-accent/20"
                >
                    {isDark ? (
                        <Sun className="w-4 h-4 text-hub-amber" />
                    ) : (
                        <Moon className="w-4 h-4 text-hub-indigo" />
                    )}
                    <span className="flex-1 text-left">{isDark ? 'Light' : 'Dark'} Mode</span>
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {roleLoading ? (
                    <div className="px-3 py-10 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-hub-indigo mx-auto" />
                    </div>
                ) : (
                    filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-medium",
                                pathname === item.href
                                    ? "bg-hub-indigo/10 text-hub-indigo shadow-sm border border-hub-indigo/10"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-all duration-300",
                                pathname === item.href ? "text-hub-indigo scale-110" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            {item.label}
                        </Link>
                    ))
                )}
            </nav>

            <div className="p-4 border-t border-border space-y-1 bg-card/30">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loggingOut ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    )}
                    {loggingOut ? "Logging out..." : "Logout"}
                </button>
            </div>
        </div>
    );
}
