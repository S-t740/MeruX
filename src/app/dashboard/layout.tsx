"use client"

import { Sidebar } from "@/components/dashboard/sidebar";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authError || !authUser) {
                    setUser(null);
                    setLoading(false);
                } else {
                    setUser(authUser);

                    // Get user role from profiles table
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', authUser.id)
                        .single();

                    if (!profileError && profile) {
                        setUserRole(profile.role);
                    } else {
                        // Default to student if no profile
                        setUserRole('student');
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setUser(null);
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, supabase.auth]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-hub-indigo border-t-transparent animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-background min-h-[100dvh] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="fixed bg-orb top-[-100px] right-[-100px] w-[500px] h-[500px] bg-hub-indigo/20 pointer-events-none" />
            <div className="fixed bg-orb bottom-[-100px] left-[200px] w-[600px] h-[600px] bg-hub-purple/15 pointer-events-none" />

            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex lg:hidden">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
                    {/* Sliding Panel */}
                    <div className="relative flex w-[280px] max-w-[80vw] flex-col bg-card shadow-2xl animate-in slide-in-from-left duration-300">
                        <Sidebar className="w-full flex h-[100dvh]" onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10 w-full flex flex-col h-[100dvh]">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 sticky top-0 z-40 bg-background/90 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/brand/merux-lms-icon.svg"
                            alt="Merux LMS"
                            width={32}
                            height={32}
                            className="rounded-lg shadow-lg shadow-hub-indigo/20"
                            priority
                        />
                        <span className="font-outfit font-bold text-xl tracking-tight">Merux <span className="text-hub-indigo">LMS</span></span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-accent/50 hover:bg-accent rounded-lg transition-colors">
                        <Menu className="w-5 h-5 text-foreground" />
                    </button>
                </header>

                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
