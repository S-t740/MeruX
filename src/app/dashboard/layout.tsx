"use client"

import { Sidebar } from "@/components/dashboard/sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

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
        <div className="flex bg-background min-h-screen relative overflow-hidden">
            {/* Background Decorations */}
            <div className="bg-orb top-[-100px] right-[-100px] w-[500px] h-[500px] bg-hub-indigo/20" />
            <div className="bg-orb bottom-[-100px] left-[200px] w-[600px] h-[600px] bg-hub-purple/15" />

            <Sidebar />
            <main className="flex-1 overflow-auto relative z-10">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
