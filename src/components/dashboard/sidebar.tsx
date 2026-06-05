"use client"

import Link from "next/link";
import Image from "next/image";
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
    Award,
    Sparkles,
    X,
    Video,
    UserCheck,
    CalendarDays,
    UsersRound,
    FileBarChart2,
    PlayCircle,
    CreditCard,
    TrendingUp
} from "lucide-react";
import { useUserRole } from "@/lib/hooks/useUserRole";

const TUTOR_ROLES = ['tutor', 'admin', 'super_admin'] as const;
const HOST_ROLES = ['tutor', 'instructor', 'admin', 'super_admin'] as const;
const ADMIN_ROLES = ['admin', 'super_admin'] as const;
const ALL_ROLES = ['student', 'instructor', 'mentor', 'tutor', 'researcher', 'reviewer', 'admin', 'super_admin'] as const;

interface NavSection {
    label?: string;
    items: NavItem[];
}

interface NavItem {
    icon: any;
    label: string;
    href: string;
    roles: readonly string[];
    badge?: string;
}

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { role, isAdmin, isInstructor, isResearcher, isReviewer, isTutor, loading: roleLoading } = useUserRole();
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

    const navSections: NavSection[] = [
        {
            items: [
                { icon: LayoutDashboard, label: "Overview", href: "/dashboard", roles: ALL_ROLES },
                { icon: BookOpen, label: "Courses", href: "/courses", roles: ['student', 'instructor', 'mentor', 'tutor', 'admin', 'super_admin'] },
                { icon: Users, label: "Cohorts", href: "/cohorts", roles: ['student', 'instructor', 'admin', 'super_admin'] },
                { icon: Award, label: "Certifications", href: "/certifications", roles: ['student', 'admin', 'super_admin'] },
                { icon: BarChart3, label: "Analytics", href: "/analytics", roles: ['student', 'mentor', 'researcher', 'reviewer'] },
            ]
        },
        {
            label: "Tutor Mode",
            items: [
                { icon: UserCheck, label: "Tutor Dashboard", href: "/dashboard/tutor", roles: TUTOR_ROLES },
                { icon: Users, label: "My Learners", href: "/dashboard/tutor/learners", roles: TUTOR_ROLES },
                { icon: CalendarDays, label: "Sessions", href: "/dashboard/tutor/sessions", roles: TUTOR_ROLES },
                { icon: UsersRound, label: "Groups", href: "/dashboard/tutor/groups", roles: TUTOR_ROLES },
                { icon: FileBarChart2, label: "Reports", href: "/dashboard/tutor/reports", roles: TUTOR_ROLES },
            ]
        },
        {
            label: "Learning Studio",
            items: [
                { icon: Video, label: "Live Studio", href: "/studio", roles: ALL_ROLES },
                { icon: PlayCircle, label: "Recordings", href: "/studio/recordings", roles: ALL_ROLES },
            ]
        },
        {
            label: "Instructor Tools",
            items: [
                { icon: ClipboardCheck, label: "Gradebook", href: "/dashboard/instructor/gradebook", roles: ['instructor', 'admin', 'super_admin'] },
                { icon: BookOpen, label: "Question Bank", href: "/dashboard/instructor/question-bank", roles: ['instructor', 'admin', 'super_admin'] },
                { icon: ClipboardCheck, label: "Grade Assessments", href: "/dashboard/instructor/assessments", roles: ['instructor', 'admin', 'super_admin'] },
                { icon: BarChart3, label: "Course Analytics", href: "/dashboard/instructor/analytics", roles: ['instructor', 'admin', 'super_admin'] },
                { icon: Sparkles, label: "AI Lesson Generator", href: "/dashboard/instructor/ai-lesson-generator", roles: ['instructor', 'admin', 'super_admin'] },
            ]
        },
        {
            label: "Institution",
            items: [
                { icon: TrendingUp, label: "Executive Analytics", href: "/dashboard/admin/analytics", roles: ADMIN_ROLES },
                { icon: ClipboardCheck, label: "Pending Approvals", href: "/dashboard/admin/approvals", roles: ADMIN_ROLES },
                { icon: CreditCard, label: "Subscription", href: "/dashboard/admin/subscription", roles: ADMIN_ROLES },
                { icon: Shield, label: "System Auth", href: "/dashboard/super_admin", roles: ['super_admin'] },
            ]
        },
        {
            label: "Other",
            items: [
                { icon: Database, label: "Research Hub", href: "/research", roles: ['researcher', 'reviewer', 'admin', 'super_admin'] },
                { icon: Rocket, label: "Project Lab", href: "/projects", roles: ['student', 'mentor', 'admin', 'super_admin'] },
                { icon: GraduationCap, label: "Mentorship", href: "/mentorship", roles: ['student', 'mentor', 'admin', 'super_admin'] },
                { icon: Bell, label: "Notifications", href: "/notifications", roles: ALL_ROLES },
                { icon: Settings, label: "Settings", href: "/settings", roles: ALL_ROLES },
            ]
        },
    ];

    const filteredSections = navSections.map(section => ({
        ...section,
        items: section.items.filter(item => !role || item.roles.includes(role))
    })).filter(section => section.items.length > 0);

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
        <div className={cn("w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-50 shrink-0 shadow-2xl lg:shadow-none", className)}>
            <div className="p-5 flex flex-col gap-4 relative">
                {onClose && (
                    <button onClick={onClose} className="absolute top-5 right-5 lg:hidden p-2 -m-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
                <Link href="/" onClick={onClose} className="font-outfit font-bold text-xl tracking-tight flex items-center gap-2 mr-8">
                    <Image
                        src="/brand/merux-lms-icon.svg"
                        alt="MeruX"
                        width={32}
                        height={32}
                        className="rounded-lg shadow-lg shadow-hub-indigo/20"
                        priority
                    />
                    <span>Soma<span className="text-hub-indigo">Flow</span></span>
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

            <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar pb-4">
                {roleLoading ? (
                    <div className="px-3 py-10 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-hub-indigo mx-auto" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredSections.map((section, si) => (
                            <div key={si} className={cn(si > 0 && "pt-3")}>
                                {section.label && (
                                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                                        {section.label}
                                    </p>
                                )}
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                                isActive
                                                    ? "bg-hub-indigo/10 text-hub-indigo shadow-sm border border-hub-indigo/10"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-0.5"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-4 h-4 shrink-0 transition-all duration-200",
                                                isActive ? "text-hub-indigo scale-110" : "text-muted-foreground group-hover:text-foreground"
                                            )} />
                                            <span className="truncate">{item.label}</span>
                                            {item.badge && (
                                                <span className="ml-auto bg-hub-rose text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
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
