"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Database,
    Rocket,
    GraduationCap,
    Settings,
    LogOut
} from "lucide-react";

const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: BookOpen, label: "Courses", href: "/dashboard/courses" },
    { icon: Users, label: "Cohorts", href: "/dashboard/cohorts" },
    { icon: Database, label: "Research", href: "/dashboard/research" },
    { icon: Rocket, label: "Innovation", href: "/dashboard/innovation" },
    { icon: GraduationCap, label: "Mentorship", href: "/dashboard/mentorship" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <Link href="/" className="font-outfit font-bold text-xl tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-hub-indigo flex items-center justify-center text-white text-xs">MX</div>
                    <span>MTIH <span className="text-hub-indigo">Learn</span></span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                            pathname === item.href
                                ? "bg-hub-indigo/10 text-hub-indigo shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-transform group-hover:scale-110",
                            pathname === item.href ? "text-hub-indigo" : "text-muted-foreground"
                        )} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border space-y-1">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-sm font-medium"
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all text-sm font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
